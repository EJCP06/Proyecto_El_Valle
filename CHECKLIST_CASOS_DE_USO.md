# LISTA DE VERIFICACIÓN DE CASOS DE USO

Estructura replicada del documento `DOC-20260722-WA0015..pdf`.
La columna **CONTROL** usa casillas: `[x]` = implementado, `[ ]` = pendiente.

## SEGURIDAD EN SISTEMAS

| PROCESO | CASOS DE USO | CONTROL | ESTADO |
|---|---|---|---|
| SEGURIDAD EN SISTEMAS | INICIAR SESIÓN | [x] | ✅ Login JWT + sesiones en BD (`auth.controller.js:23`) |
| SEGURIDAD EN SISTEMAS | REGISTRAR USUARIO Y CONTRASEÑA | [x] | ✅ Solo admin, sistema privado (`POST /auth/usuarios`) |
| SEGURIDAD EN SISTEMAS | MODIFICAR CONTRASEÑA | [x] | ✅ `PATCH /auth/password` + vista Perfil |
| SEGURIDAD EN SISTEMAS | RECUPERAR USUARIO Y CONTRASEÑA | [x] | ✅ Wizard en login (email / Telegram / preguntas) |
| SEGURIDAD EN SISTEMAS | RECUPERAR POR PREGUNTAS DE SEGURIDAD | [x] | ✅ `POST /preguntas-seguridad/verify` |
| SEGURIDAD EN SISTEMAS | RECUPERAR POR CORREO ELECTRÓNICO | [x] | ✅ OTP por email (`recuperacion.controller.js`) |
| SEGURIDAD EN SISTEMAS | RECUPERAR POR TELEFONÍA (SMS) | [x] | ✅ Canal Telegram: OTP por bot (`recuperacion.controller.js` canal `'telegram'` + `vincularTelegram`) |
| SEGURIDAD EN SISTEMAS | VERIFICAR SESIÓN | [x] | ✅ Middleware auth + auth guard |
| SEGURIDAD EN SISTEMAS | VALIDAR FECHA DE EXPIRACIÓN | [x] | ✅ Doble: expiración JWT + `expira_en` en BD |
| SEGURIDAD EN SISTEMAS | TEMPORIZADOR DE SESIONES (TIEMPO DE INACTIVIDAD) | [x] | ✅ 5 min frontend + aviso 60 s (solo "Continuar") |
| SEGURIDAD EN SISTEMAS | AGREGAR USUARIO | [x] | ✅ Admin |
| SEGURIDAD EN SISTEMAS | MODIFICAR USUARIO | [x] | ✅ Admin |
| SEGURIDAD EN SISTEMAS | ELIMINAR USUARIO | [x] | ✅ Desactivación lógica |
| SEGURIDAD EN SISTEMAS | CONSULTAR USUARIO | [x] | ✅ Admin |
| SEGURIDAD EN SISTEMAS | AGREGAR PREGUNTAS DE SEGURIDAD | [x] | ✅ En alta/edición de usuario y en Perfil |
| SEGURIDAD EN SISTEMAS | MODIFICAR PREGUNTAS DE SEGURIDAD | [x] | ✅ En Perfil (`PUT /preguntas-seguridad/mias`) |
| SEGURIDAD EN SISTEMAS | ELIMINAR PREGUNTAS DE SEGURIDAD | [x] | ✅ En Perfil (se permite eliminar y guardar sin preguntas) |
| SEGURIDAD EN SISTEMAS | CONSULTAR PREGUNTAS DE SEGURIDAD | [x] | ✅ `GET /preguntas-seguridad/mias` y `/usuario/:id` |
| SEGURIDAD EN SISTEMAS | ASOCIAR PREGUNTAS DE SEGURIDAD CON USUARIO | [x] | ✅ |
| SEGURIDAD EN SISTEMAS | AGREGAR RESPUESTAS DE SEGURIDAD CON USUARIO | [x] | ✅ Respuestas encriptadas con bcrypt |
| SEGURIDAD EN SISTEMAS | SESIÓN PROTEGIDA | [x] | ✅ helmet + CORS restringido + rate limiting |
| SEGURIDAD EN SISTEMAS | CONECTAR A BD | [x] | ✅ Pool pg + `GET /health` |
| SEGURIDAD EN SISTEMAS | CHEQUEAR SESIÓN | [x] | ✅ Middleware + guard |
| SEGURIDAD EN SISTEMAS | MOSTRAR PANEL (DASHBOARD) | [x] | ✅ `/app/dashboard` + `GET /reportes/stats` |
| SEGURIDAD EN SISTEMAS | CERRAR OTRAS SESIONES | [x] | ✅ Se revocan automáticamente al iniciar sesión |
| SEGURIDAD EN SISTEMAS | VERIFICAR SESIÓN ÚNICA | [x] | ✅ Código `SESSION_REVOKED` (interceptor) |
| SEGURIDAD EN SISTEMAS | REQUERIR SESIÓN ÚNICA | [x] | ✅ Siempre activa (revoca sesiones anteriores al login) |

## GENERAR BASE DE DATOS

| PROCESO | CASOS DE USO | CONTROL | ESTADO |
|---|---|---|---|
| GENERAR BASE DE DATOS | SEGURIDAD_POSTGRES.SQL | [x] | ✅ `db/SEGURIDAD_POSTGRES.SQL` (esquema de seguridad consolidado e idempotente) |
| GENERAR BASE DE DATOS | SEGURIDAD_CRIPTO.SQL | [x] | ✅ `db/SEGURIDAD_CRIPTO.SQL` (pgcrypto + `hash_seguro`/`verificar_contrasena`, bcrypt `$2a$`) |
| GENERAR BASE DE DATOS | RESPALDAR BASE DE DATOS | [x] | ✅ `npm run backup` (pg_dump `-Fc` o `--sql`) → `backend/backups/` + metadatos |
| GENERAR BASE DE DATOS | RECUPERAR BASE DE DATOS | [x] | ✅ `npm run restore -- <archivo>` (pg_restore / psql) |

## AUDITORÍA

| PROCESO | CASOS DE USO | CONTROL | ESTADO |
|---|---|---|---|
| AUDITORÍA | AUDITAR DATOS SENSIBLES | [x] | ✅ Trazas en auth (login, login fallido, registro, modificar, desactivar, contraseña, recuperación), preguntaSeguridad y configuración. Detalle saneado (nunca contraseñas/tokens) |
| AUDITORÍA | REGISTRAR ACTIVIDAD (TRAZAS) | [x] | ✅ Middleware global (`middleware/auditoria.js`) + endpoint `GET /api/auditoria` + pantalla admin "Auditoría" con filtros y paginación |

## SEGURIDAD

| PROCESO | CASOS DE USO | CONTROL | ESTADO |
|---|---|---|---|
| SEGURIDAD | TERMINAR SESIONES INACTIVAS | [x] | ✅ Backend: middleware revoca sesión sin actividad >5 min → `401 SESSION_INACTIVE` (`middleware/auth.js`) |
| SEGURIDAD | REVOCAR INACTIVOS | [x] | ✅ Job `jobs/limpiarSesiones.js` (cada 60 s) revoca inactivas/expiradas y limpia revocadas viejas |
| SEGURIDAD | VALIDAR CONTRASEÑA | [x] | ✅ `validarPassword` aplicado en registro, cambio, recuperación OTP y preguntas (backend + frontend) |

## REDES

| PROCESO | CASOS DE USO | CONTROL | ESTADO |
|---|---|---|---|
| REDES | SALIR DE SISTEMAS | [x] | ✅ Logout en frontend (la sesión del backend se invalida con la revocación) |
| REDES | VALIDAR DIRECCIONES IP | [ ] | ❌ Solo se almacena la IP al login, sin validación/bloqueo |
| REDES | CONFIGURAR SEGURIDAD | [ ] | ⚠️ Tabla + API `/configuracion` existe, sin pantalla de configuración |
| REDES | CONFIGURAR ENTORNO DE RED | [ ] | ❌ Pendiente |
| REDES | CONFIGURAR FIREWALL | [ ] | ❌ Pendiente |

## BACKUP

| PROCESO | CASOS DE USO | CONTROL | ESTADO |
|---|---|---|---|
| BACKUP | BACKUP COMPLETO DE BD | [ ] | ❌ Pendiente |
| BACKUP | BACKUP SOLO ESTRUCTURA | [ ] | ❌ Pendiente |
| BACKUP | BACKUP DE TABLAS ESPECÍFICAS | [ ] | ❌ Pendiente |

## RESTORE

| PROCESO | CASOS DE USO | CONTROL | ESTADO |
|---|---|---|---|
| RESTORE | RESTAURAR DESDE BACKUP EXISTENTE | [ ] | ❌ Pendiente |
| RESTORE | SUBIR ARCHIVO Y RESTAURAR | [ ] | ❌ Pendiente |
| RESTORE | RESTAURAR TABLAS ESPECÍFICAS | [ ] | ❌ Pendiente |
| RESTORE | OPCIÓN DE LIMPIAR BD ANTES DE RESTAURAR | [ ] | ❌ Pendiente |
| RESTORE | OPCIÓN DE ELIMINAR Y RECREAR BD | [ ] | ❌ Pendiente |

## UTILIDADES (BACKUP)

| PROCESO | CASOS DE USO | CONTROL | ESTADO |
|---|---|---|---|
| UTILIDADES (BACKUP) | VERIFICAR INTEGRIDAD DE BACKUPS | [ ] | ❌ Pendiente |
| UTILIDADES (BACKUP) | DESCARGAR BACKUPS | [ ] | ❌ Pendiente |
| UTILIDADES (BACKUP) | ELIMINAR BACKUPS | [ ] | ❌ Pendiente |
| UTILIDADES (BACKUP) | LIMPIEZA AUTOMÁTICA POR ANTIGÜEDAD | [ ] | ❌ Pendiente |
| UTILIDADES (BACKUP) | ESTADÍSTICAS EN TIEMPO REAL | [ ] | ⚠️ Dashboard bajo demanda, sin push en tiempo real |
