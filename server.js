const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),url=require('url');
const PORT=Number(process.env.PORT||3000), ROOT=__dirname, PUBLIC=path.join(ROOT,'public'), DATA=path.join(ROOT,'data','contapro.json');
const SECRET=process.env.CONTAPRO_SECRET||'CHANGE-ME-CONTAPRO-SECRET-CHANGE-IN-PRODUCTION';
const collections={companies:'companies',clients:'clients',suppliers:'suppliers',sales:'sales',purchases:'purchases'};
function id(){return crypto.randomUUID()} function hash(p){return crypto.createHash('sha256').update(String(p)).digest('hex')}
function blank(){return {users:[],companies:[],clients:[],suppliers:[],sales:[],purchases:[]}}
function loadDB(){try{const x=JSON.parse(fs.readFileSync(DATA,'utf8'));return {...blank(),...x}}catch{return blank()}}
function saveDB(x){fs.mkdirSync(path.dirname(DATA),{recursive:true});const tmp=DATA+'.tmp';fs.writeFileSync(tmp,JSON.stringify(x,null,2),'utf8');fs.renameSync(tmp,DATA)}
let db=loadDB();
if(!db.users.length){db.users.push({id:id(),email:'admin@contapro.local',password:hash('ContaPro-Admin-2026'),name:'SuperAdmin',role:'superadmin',created_at:new Date().toISOString()});saveDB(db)}
function token(uid){const b=Buffer.from(JSON.stringify({uid})).toString('base64url');const s=crypto.createHmac('sha256',SECRET).update(b).digest('base64url');return b+'.'+s}
function auth(req){const h=req.headers.authorization||'',t=h.replace(/^Bearer\s+/i,'');if(!t)return null;const [b,s]=t.split('.');if(!b||!s)return null;const good=crypto.createHmac('sha256',SECRET).update(b).digest('base64url');if(s!==good)return null;try{const x=JSON.parse(Buffer.from(b,'base64url').toString());return db.users.find(u=>u.id===x.uid)||null}catch{return null}}
function send(res,status,obj){const body=JSON.stringify(obj);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Content-Length':Buffer.byteLength(body)});res.end(body)}
function text(res,status,body,type='text/html; charset=utf-8'){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','Content-Length':Buffer.byteLength(body)});res.end(body)}
function readBody(req){return new Promise((resolve,reject)=>{let b='';req.on('data',c=>{b+=c;if(b.length>2*1024*1024)reject(new Error('Solicitud demasiado grande'))});req.on('end',()=>{try{resolve(b?JSON.parse(b):{})}catch{reject(new Error('JSON inválido'))}});req.on('error',reject)})}
function safeStatic(p){const base=path.resolve(PUBLIC),file=path.resolve(PUBLIC,p);return file.startsWith(base+path.sep)?file:null}
async function handler(req,res){
 const u=url.parse(req.url,true), p=u.pathname;
 if(req.method==='GET'&&p==='/api/health')return send(res,200,{ok:true,storage:'file',database:DATA,server_time:new Date().toISOString()});
 if(p.startsWith('/api/')){
  try{
   if(req.method==='POST'&&p==='/api/login'){const b=await readBody(req),e=String(b.email||'').toLowerCase(),pw=String(b.password||'');const user=db.users.find(x=>x.email===e&&x.password===hash(pw));if(!user)return send(res,401,{error:'Correo o contraseña incorrectos'});return send(res,200,{token:token(user.id),user:{id:user.id,email:user.email,name:user.name,role:user.role}})}
   if(req.method==='POST'&&p==='/api/signup'){const b=await readBody(req),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');if(!email||password.length<6)return send(res,400,{error:'Correo y contraseña de mínimo 6 caracteres.'});if(db.users.some(x=>x.email===email))return send(res,409,{error:'El usuario ya existe.'});const user={id:id(),email,password:hash(password),name:b.name||email,role:'admin',created_at:new Date().toISOString()};db.users.push(user);saveDB(db);return send(res,201,{token:token(user.id),user:{id:user.id,email:user.email,name:user.name,role:user.role}})}
   const user=auth(req);if(!user)return send(res,401,{error:'Sesión no válida. Inicia sesión nuevamente.'});
   if(req.method==='GET'&&p==='/api/me')return send(res,200,{id:user.id,email:user.email,name:user.name,role:user.role});
   if(req.method==='GET'&&p==='/api/data')return send(res,200,{companies:db.companies,clients:db.clients,suppliers:db.suppliers,sales:db.sales,purchases:db.purchases});
   if(req.method==='GET'&&p==='/api/admin/users'){if(user.role!=='superadmin')return send(res,403,{error:'No autorizado'});return send(res,200,db.users.map(({password,...x})=>x))}
   if(req.method==='POST'&&p==='/api/admin/users'){if(user.role!=='superadmin')return send(res,403,{error:'No autorizado'});const b=await readBody(req),email=String(b.email||'').trim().toLowerCase();if(!email||!b.password)return send(res,400,{error:'Faltan datos'});if(db.users.some(x=>x.email===email))return send(res,409,{error:'Usuario existente'});const x={id:id(),email,password:hash(b.password),name:b.name||email,role:b.role||'admin',created_at:new Date().toISOString()};db.users.push(x);saveDB(db);const {password,...out}=x;return send(res,201,out)}
   const m=p.match(/^\/api\/(companies|clients|suppliers|sales|purchases)(?:\/([^/]+))?$/);if(!m)return send(res,404,{error:'Ruta no encontrada'});const type=m[1],key=collections[type],rid=m[2];
   if(req.method==='POST'){if(type==='companies'&&user.role!=='superadmin')return send(res,403,{error:'Solo SuperAdmin puede registrar empresas.'});const b=await readBody(req);if(type!=='companies'&&!b.company_id)return send(res,400,{error:'Selecciona una empresa.'});const now=new Date().toISOString(),x={...b,id:id(),created_by:user.id,created_at:now,updated_at:now};db[key].unshift(x);saveDB(db);return send(res,201,x)}
   if(req.method==='PUT'&&rid){const i=db[key].findIndex(x=>x.id===rid);if(i<0)return send(res,404,{error:'Registro no encontrado'});if(type==='companies'&&user.role!=='superadmin')return send(res,403,{error:'Solo SuperAdmin puede modificar empresas.'});const b=await readBody(req);db[key][i]={...db[key][i],...b,id:rid,updated_at:new Date().toISOString()};saveDB(db);return send(res,200,db[key][i])}
   return send(res,405,{error:'Método no permitido'});
  }catch(e){return send(res,500,{error:e.message||'Error del servidor'})}
 }
 let fp=safeStatic(p==='/'?'index.html':p.slice(1));if(!fp||!fs.existsSync(fp)||fs.statSync(fp).isFile()===false)fp=path.join(PUBLIC,'index.html');
 const ext=path.extname(fp),types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
 try{text(res,200,fs.readFileSync(fp),types[ext]||'application/octet-stream')}catch{text(res,404,'Not found','text/plain; charset=utf-8')}
}
http.createServer(handler).listen(PORT,()=>console.log(`ContaPro online en http://localhost:${PORT}`));
