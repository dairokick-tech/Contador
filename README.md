# ContaPro Online

Sistema propio online con almacenamiento persistente en `data/contapro.json`.

## Crear tus propios credenciales

Ya no se crea el usuario `admin@contapro.local` automáticamente.

1. Abre el sistema.
2. Pulsa **Crear mi usuario**.
3. Escribe tu correo y una contraseña de mínimo 6 caracteres.
4. Indica tu nombre.
5. **El primer usuario registrado obtiene el rol SuperAdmin automáticamente.**
6. Los siguientes usuarios se crean como administradores normales.

No se incluyen credenciales predeterminadas.

## Ejecutar

```bash
npm start
```

Luego abre `http://localhost:3000`.

Los registros se guardan en `data/contapro.json`. Para uso público real, despliega el servidor en un hosting Node.js con almacenamiento persistente.
