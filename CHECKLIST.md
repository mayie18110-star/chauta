# ✅ CHECKLIST PRE-DEPLOYMENT

## Archivos necesarios (verifica que existan)
- [ ] `app.py` - Actualizado con variables de entorno
- [ ] `requirements.txt` - Con gunicorn y python-dotenv
- [ ] `Procfile` - Configurado
- [ ] `runtime.txt` - Python 3.11.7
- [ ] `initialize_db.py` - Script de inicialización
- [ ] `.gitignore` - Creado
- [ ] `.env` - SOLO local (NO subir a Git)
- [ ] `.env.example` - Plantilla (SÍ subir)

## Configuración antes de Render
- [ ] Cuenta creada en TiDB Cloud
- [ ] Cluster Serverless creado en TiDB Cloud
- [ ] Credenciales copiadas (HOST, USER, PASSWORD)
- [ ] Base de datos `base_chauta` creada en TiDB
- [ ] Archivo `.env` completado con credenciales reales
- [ ] `requirements.txt` tiene todas las librerías

## Git y GitHub
- [ ] Repositorio Git inicializado (`git init`)
- [ ] Repositorio GitHub creado (público)
- [ ] Código pushed a GitHub (`git push`)
- [ ] `.env` NO está en Git (verificar con `git status`)

## Render
- [ ] Cuenta creada en Render
- [ ] Conectado GitHub a Render
- [ ] Web Service creado
- [ ] Build Command: `pip install -r requirements.txt && python initialize_db.py`
- [ ] Start Command: `gunicorn app:app`
- [ ] Variables de entorno agregadas:
  - [ ] DB_HOST
  - [ ] DB_PORT
  - [ ] DB_USER
  - [ ] DB_PASSWORD
  - [ ] DB_NAME
  - [ ] FLASK_ENV
  - [ ] SECRET_KEY

## Después del Deploy
- [ ] Aplicación en Render dice "Your service is live"
- [ ] Puedes acceder a la URL de Render
- [ ] Puedes crear categorías y productos
- [ ] Datos se guardan correctamente
- [ ] Logs en Render muestran "Application started successfully"

---

## 🚨 SI ALGO FALLA

1. **Abre Render → Tu servicio → Logs**
2. **Busca mensajes de error (en rojo)**
3. **Copia el error exacto**
4. **Revisa esta lista:**

| Error | Solución |
|-------|----------|
| `Connection refused` | Credenciales BD incorrectas |
| `Auth failed` | Password de TiDB incorrecto |
| `ENOTFOUND` | HOST de TiDB incorrecto |
| `ModuleNotFoundError` | Falta agregar a requirements.txt |
| `Gunicorn not found` | Falta agregar gunicorn a requirements.txt |
| `No such file` | initialize_db.py no existe |
| `Environment variable X not found` | No agregaste la variable en Render |

---

**LISTO PARA DESPLEGAR?** ✅ Sigue la guía DEPLOYMENT_GUIA.md paso a paso
