# 🏪 CHAUTA - Sistema de Gestión de Tienda

Aplicación web para gestión de productos, categorías y ventas de un supermercado.

## 🚀 Deployment Rápido (Lee esto primero)

### Para desplegar la app en Render + TiDB Cloud:

**👉 VE A:** `DEPLOYMENT_GUIA.md` ← Esta es tu guía paso a paso

Los archivos están ordenados así:

1. **DEPLOYMENT_GUIA.md** ← EMPIEZA AQUÍ (Pasos detallados)
2. **CHECKLIST.md** ← Verificación de que todo está listo
3. **HOW_IT_WORKS.md** ← Cómo se crea la BD automáticamente
4. **TROUBLESHOOTING.md** ← Si algo falla (cuando lo creemos)

---

## 📦 Stack Tecnológico

- **Backend**: Flask (Python)
- **Base de datos**: MySQL (TiDB Cloud)
- **Hosting**: Render
- **Frontend**: HTML, CSS, JavaScript

---

## 🏠 Local Setup (Si quieres probar localmente)

```powershell
# 1. Clonar/Descargar repo
cd tu-carpeta-chauta

# 2. Crear ambiente virtual
python -m venv venv
.\venv\Scripts\Activate.ps1

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar .env local
# Edita .env con tus datos (pueden ser local MySQL)

# 5. Inicializar BD
python initialize_db.py

# 6. Ejecutar app
python app.py
# Acceder a: http://localhost:5000
```

---

## 🛠️ Archivos importantes

```
chauta/
├── app.py                    # Aplicación Flask (corazón del proyecto)
├── initialize_db.py          # Script para crear tablas (automático en Render)
├── requirements.txt          # Dependencias Python
├── Procfile                  # Configuración para Render
├── runtime.txt              # Versión de Python (3.11.7)
├── .env.example             # Plantilla de variables (SÍ subir a Git)
├── .env                     # Variables reales (NO subir, solo local)
├── .gitignore              # Archivos a ignorar en Git
├── DEPLOYMENT_GUIA.md      # 📘 Otra paso a paso (EMPIEZA AQUÍ)
├── CHECKLIST.md            # ✅ Lista de verificación
├── HOW_IT_WORKS.md         # 🔄 Cómo funciona la B.D.
├── README.md               # Este archivo
├── static/
│   ├── css/
│   │   └── styles.css
│   ├── img/                # Carpeta para imágenes de productos
│   └── js/
│       ├── admin.js
│       └── app.js
└── templates/
    ├── admin.html
    ├── index.html
```

---

## 🎯 Próximos pasos

### 1️⃣ Ahora mismo:
- Lee `DEPLOYMENT_GUIA.md`
- Sigue CADA paso exactamente

### 2️⃣ Si algo falla:
- Abre `TROUBLESHOOTING.md` (créalo cuando lo necesites)
- Busca el error en Google + "render" + "tidb"

### 3️⃣ Una vez en producción:
- URL de tu app: `https://chauta-xxxxx.onrender.com`
- Cada `git push` = redeployment automático
- Cambios en vivo en 2-3 minutos

---

## 📋 Variables de entorno necesarias

```
DB_HOST=            # Host de TiDB Cloud
DB_PORT=4000        # Puerto TiDB (siempre 4000)
DB_USER=            # Usuario de TiDB
DB_PASSWORD=        # Password de TiDB
DB_NAME=base_chauta # Nombre de la BD
FLASK_ENV=production
SECRET_KEY=         # Cualquier string secreto
```

---

## 🔒 Seguridad

- ✅ `.env` está en `.gitignore` (NO se sube)
- ✅ Credenciales están en variables de entorno (Render)
- ✅ `initialize_db.py` crea tablas automáticamente (sin shell)
- ✅ Contraseñas NO están en el código

---

## 📞 Soporte

- **Error en logs**: Ve a Render → Logs de tu servicio
- **Error de BD**: Ve a TiDB Cloud → Web Shell
- **Error de Git**: Asegúrate que `.env` NO esté tracked (`git status`)

---

## 🌐 Links útiles

- **Render**: https://render.com
- **TiDB Cloud**: https://tidbcloud.com
- **GitHub**: https://github.com

---

## 📝 Notas

- Plan gratuito de TiDB: 5GB, suficiente para desarrollo
- Plan gratuito de Render: Servidor se detiene sin actividad
- Si "deployment" falla: Revisa Python version en runtime.txt

---

**¡A DESPLEGAR! 🚀**

Lee: `DEPLOYMENT_GUIA.md` → Sigue pasos → Deploy en Render → ¡Listo!
