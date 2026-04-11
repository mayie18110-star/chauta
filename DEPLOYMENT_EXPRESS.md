# ⚡ DEPLOYMENT EXPRESS (Resumen Visual)

## El viaje de tu app: 🏠 Local → 🌐 Internet

```
Tu Computadora        GitHub              TiDB Cloud          Render
   (Local)                               (Base de Datos)   (Servidor Web)
     
     app.py   ────────>   🔗   <────────── BD en vivo
 .env (secreto)          repo            (sin shell!)
 requirements.txt        GitHub
     
              Paso 1: Code + BD ──────> Render Deploy Engine
              Paso 2: Render crea BD automáticamente (initialize_db.py)
              Paso 3: Render levanta tu app (gunicorn)
              Paso 4: Tu app en vivo: https://chauta-xxxxx.onrender.com
```

---

## Pasos clave (formato ultra-resumen)

### 1️⃣ TiDB Cloud (2 minutos)
```
Registrate → Crea Cluster → Copia HOST, USER, PASSWORD
```

### 2️⃣ Tu Proyecto (10 minutos)
```
Crea .env con credenciales
→ git add . && git commit && git push
```

### 3️⃣ GitHub (2 minutos)
```
Crea repo → Sube código
```

### 4️⃣ Render (5 minutos)
```
Conecta GitHub → Agrega Variables → Deploy
```

### 5️⃣ ¡Listo! (3 minutos)
```
Tu app está en vivo en: https://chauta-xxxxx.onrender.com
```

---

## Archivos necesarios (verificar que existan)

```
chauta/
├── ✅ app.py                    (con variables de entorno)
├── ✅ initialize_db.py          (crea BD automáticamente)
├── ✅ requirements.txt          (con gunicorn + dotenv)
├── ✅ Procfile                  ("web" y "release")
├── ✅ runtime.txt              (python-3.11.7)
├── ✅ .env.example             (plantilla, SÍ en GitHub)
├── ✅ .gitignore              (NO sube .env, venv, etc)
├── 📄 .env                     (credenciales reales, solo local)
└── 📚 Guías:
    ├── DEPLOYMENT_GUIA.md      ← EMPIEZA AQUÍ
    ├── CHECKLIST.md            ← Verificación
    ├── HOW_IT_WORKS.md         ← Cómo funciona
    ├── TROUBLESHOOTING.md      ← Si falla
    ├── README.md               ← Este proyecto
    └── DEPLOYMENT_EXPRESS.md   ← Este archivo
```

---

## Credenciales a usar

### De TiDB Cloud
```
Host: gateway01.us-west-1.prod.aws.tidbcloud.com
Port: 4000
User: 2hf87jd8s9d.root  
Password: Tu-pass-aqui
Database: base_chauta
```
*(Estos son ejemplos, copia los REALES)*

### Para Render: Use variables de entorno
```
DB_HOST: (Host de TiDB)
DB_PORT: 4000
DB_USER: (User de TiDB)
DB_PASSWORD: (Pass de TiDB)
DB_NAME: base_chauta
FLASK_ENV: production
SECRET_KEY: chautasecretkey
```

---

## Timeline realista

| Paso | Acción | Tiempo |
|------|--------|--------|
| 1 | Crear TiDB Cloud | 5 min |
| 2 | Copiar credenciales | 2 min |
| 3 | Crear .env local | 3 min |
| 4 | git push a GitHub | 2 min |
| 5 | Crear Render account | 2 min |
| 6 | Connect GitHub | 2 min |
| 7 | Agregar variables | 5 min |
| 8 | Click "Create" | 0 min |
| 9 | **Build & Deploy** (RENDER) | 5-10 min |
| 10 | **APP EN VIVO** ✅ | --- |
| **TOTAL** | | **~30 min** |

---

## Check antes de desplegar

- [ ] `.env` local tiene datos reales de TiDB
- [ ] `.env` NO está en `.gitignore` (error al reversa)
- [ ] `requirements.txt` tiene: gunicorn, python-dotenv, mysql-connector-python
- [ ] `Procfile` tiene: `web:` y `release:`
- [ ] `initialize_db.py` existe
- [ ] Código está en GitHub
- [ ] Render tiene todas las variables de entorno

---

## Si ves "Your service is live" ✅

Significa:
- ✅ Build exitoso
- ✅ initialize_db.py se ejecutó
- ✅ Tablas creadas en TiDB
- ✅ gunicorn está corriendo
- ✅ Tu app está viva

**Accede a:**
```
https://chauta-xxxxx.onrender.com
(el xxxxx es único de tu servicio)
```

---

## Si falla

**Control + K (abrir Go to Line)** → Ve a Logs en Render → Busca "error"

Errores comunes:
- `Connection refused` → Credenciales incorrectas
- `ModuleNotFoundError` → requirements.txt incompleto
- `gunicorn not found` → No instaló las dependencias
- `Database not found` → Ejecuta en TiDB: `CREATE DATABASE base_chauta;`

---

## Desplegar actualizaciones (después de Día 1)

```powershell
# Haces cambios en app.py
git add .
git commit -m "Cambios a la app"
git push origin main

# Automáticamente → Render redeploía
# En 2-3 minutos tu app está actualizada ✨
```

---

## Dónde están las consideraciones "sin shell de paga"

```
BD se crea automáticamente en:
release: python initialize_db.py   ← Este comando es GRATIS (parte del build)

El comando que cobra $ es:
- Abrir terminal interactiva (SSH)  ← No lo hagas
- Ejecutar comandos ejecutivo    ← No lo hagas

Nosotros usamos "release" = Gratis
```

---

## Resumen de archivos que CAMBIAMOS

| Archivo | Cambio |
|---------|--------|
| `app.py` | Ahora lee variables de entorno |
| `requirements.txt` | Agregamos gunicorn y python-dotenv |
| `check_db.py` | Ahora lee variables de entorno |

## Archivos que CREAMOS

| Archivo | Propósito |
|---------|-----------|
| `initialize_db.py` | Crea BD automáticamente en Render |
| `Procfile` | Configuración para Render |
| `runtime.txt` | Versión de Python |
| `.env.example` | Plantilla de variables |
| `.gitignore` | Qué NO subir a Git |
| Todas las guías | Documentación |

---

## Próximo paso

### 👉 LEE: `DEPLOYMENT_GUIA.md` paso a paso

Está diseñada para:
- ✅ Ser muy detallada (ningún paso omitido)
- ✅ Incluir capturas o ejemplos
- ✅ Ser fácil de seguir
- ✅ Indicar qué copiar/pegar

---

**¡LISTO! Ve a DEPLOYMENT_GUIA.md y empieza 🚀**
