# ContaPro Online — guardado de registros

Versión sin Supabase. Usa un servidor Node.js propio y guarda los registros de forma persistente en `data/contapro.json`.

## Importante
GitHub Pages solo sirve archivos estáticos y no ejecuta `server.js`. Para que Guardar funcione de verdad, este proyecto debe ejecutarse en un hosting que soporte Node.js y almacenamiento persistente.

## Ejecutar
1. Instala Node.js 18+.
2. Ejecuta `npm start`.
3. Abre `http://localhost:3000`.
4. Usuario inicial: `admin@contapro.local`
5. Contraseña inicial: `ContaPro-Admin-2026`

## Verificar almacenamiento
Abre `/api/health` en el mismo servidor. Debe responder `ok: true` y `storage: "file"`.

Los registros se guardan en `data/contapro.json`. No hay endpoint de eliminación física; las bajas se manejan como Inactivo/Anulada para conservar historial.

## Producción
Usa un servicio Node/VPS con disco persistente. No uses GitHub Pages para el backend.
