# Estaciones Cebaderas

Sistema de gestión de estaciones, técnicos y visitas (backend Node.js + vistas EJS).

## Estructura del proyecto

```
control-estaciones-cebaderas/
├── public/
│   ├── css/            # role-select.css, styles.css
│   ├── js/              # role-select.js
│   └── uploads/
│       ├── diagramas/   # PDFs de diagramas de estaciones
│       └── estaciones/  # Fotos de estaciones (PNG)
├── src/
│   ├── config/          # Configuración (BD, entorno, etc.)
│   ├── controllers/     # Lógica de negocio por recurso
│   ├── middlewares/     # Auth, validaciones, manejo de errores
│   ├── models/          # Modelos/entidades de datos
│   ├── repositories/    # Acceso a datos / queries
│   ├── routes/          # Definición de endpoints
│   ├── services/        # Lógica de dominio reutilizable
│   └── app.js           # Punto de entrada de la app
├── utils/                # Helpers generales
├── views/                # Plantillas EJS
│   ├── admin/
│   ├── auth/
│   ├── partials/
│   ├── password/
│   └── tecnico/
├── ecosystem.config.cjs  # Configuración PM2
├── .env                  # Variables de entorno (no versionado)
├── .gitignore
├── package.json
└── package-lock.json
```

**Patrón:** Arquitectura en capas — `routes → controllers → services → repositories → models`, con `middlewares` transversales y `views` renderizadas server-side (EJS).

## Base de datos

| Tabla | Propósito (a confirmar/ajustar) |
|---|---|
| `administrador` | Usuarios con rol administrador |
| `clientes` | Datos de clientes |
| `sedes` | Sedes/ubicaciones de los clientes |
| `estaciones` | Estaciones registradas (asociadas a una sede) |
| `estacion_fotos` | Fotos asociadas a cada estación |
| `diagramas_upc` | Diagramas (PDF) asociados a puntos/estaciones |
| `diagrama_puntos` | Puntos individuales dentro de un diagrama |
| `tecnicos` | Usuarios con rol técnico |
| `visitas` | Registro de visitas realizadas por técnicos a estaciones |
| `session` | Almacenamiento de sesiones (ej. connect-session-knex/mysql) |


## Despliegue

**Requisitos:** Node.js, motor de base de datos (según `src/config`), PM2 (ya incluido vía `ecosystem.config.cjs`).

1. **Variables de entorno** — definir en `.env` (no se versiona): credenciales de BD, puerto, secretos de sesión, etc.
2. **Instalar dependencias**
   ```bash
   npm install --production
   ```
3. **Migraciones/BD** — asegurar que las 9 tablas existan en el servidor destino antes de arrancar.
4. **Persistencia de `uploads/`** — `public/uploads/diagramas` y `public/uploads/estaciones` deben apuntar a almacenamiento persistente (no efímero) si se despliega en contenedores/PaaS.
5. **Arrancar con PM2**
   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   ```
6. **Reverse proxy** (si aplica) — Nginx/Apache apuntando al puerto de la app, con HTTPS.
7. **Logs** — revisar salida de PM2 (`pm2 logs`) para monitoreo básico.

---
*Documento generado como punto de partida — completa los detalles específicos de tu servidor/proveedor (host, dominio, motor de BD exacto) según corresponda.*
