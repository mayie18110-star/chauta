# 📋 GUÍA COMPLETA DE DEPLOYMENT A TIDB CLOUD + RENDER

## PARTE 1: CONFIGURACIÓN DE TIDB CLOUD ☁️

### PASO 1.1: Crear cuenta y cluster en TiDB Cloud

1. **Ir a TiDB Cloud**
   - Abre https://tidbcloud.com
   - Haz clic en "Sign Up" (Registrarse)
   - Usa tu email personal
   - Completa la verificación de email

2. **Crear un cluster**
   - En el dashboard, haz clic en "Create Cluster"
   - **Selecciona plan**: "Serverless Tier" (es gratuito, 5GB de almacenamiento)
   - **Selecciona región**: Elige la más cercana a ti (ej: "Washington D.C" para América)
   - **Nombre del cluster**: "chauta-cluster" (o cualquier nombre)
   - Haz clic en "Create"
   - Espera 2-3 minutos a que se cree

### PASO 1.2: Obtener credenciales de conexión

1. **Acceder al cluster**
   - Cuando esté listo, verás tu cluster en el dashboard
   - Haz clic en el nombre del cluster

2. **Obtener datos de conexión**
   - En la página del cluster, ve a **"Connection"** (Conexión)
   - Haz clic en **"Get Connection String"** o similar
   - Verás una cadena como: `mysql://[user]:[password]@[host]:4000/[database]`

3. **Copiar datos importantes** (guarda en un documento):
   ```
   HOST: (ej: gateway01.us-west-1.prod.aws.tidbcloud.com)
   PORT: 4000
   USER: (ej: 2hf87jd8s9d.root)
   PASSWORD: (ej: P@ssw0rd123)
   DATABASE: base_chauta
   ```

### PASO 1.3: Crear la base de datos

1. **En TiDB Cloud**
   - Haz clic en el botón **"Web Shell"** en el panel del cluster
   - Espera a que se cargue la terminal online

2. **Ejecutar comando de creación**
   ```sql
   CREATE DATABASE IF NOT EXISTS base_chauta;
   USE base_chauta;
   ```

3. **Verificar que se creó**
   ```sql
   SHOW DATABASES;
   ```
   Deberías ver `base_chauta` en la lista.

---

## PARTE 2: PREPARAR PROYECTO PARA RENDER 📦

### PASO 2.1: Crear archivo de secretos local (no subir a git)

1. **Crear archivo `.env` en la raíz del proyecto**
   - En VS Code, crea un archivo llamado `.env`
   - Ruta: `c:\Users\Usuario\OneDrive\Escritorio\chauta\.env`
   - Contenido:
   ```
   DB_HOST=tu-host-tidb.tidbcloud.com
   DB_PORT=4000
   DB_USER=tu-usuario-tidb
   DB_PASSWORD=tu-password-tidb
   DB_NAME=base_chauta
   FLASK_ENV=production
   SECRET_KEY=chautasecretkey20260411
   ```

2. **Reemplazar con tus datos reales de TiDB Cloud**
   - Reemplaza `tu-host-tidb.tidbcloud.com` con el HOST real
   - Reemplaza `tu-usuario-tidb` con tu USER real
   - Reemplaza `tu-password-tidb` con tu PASSWORD real

### PASO 2.2: Verificar archivos necesarios

Verifica que estos archivos existan en tu proyecto:
- ✅ `Procfile` (ya creado)
- ✅ `runtime.txt` (ya creado)
- ✅ `.env.example` (ya creado)
- ✅ `.gitignore` (ya creado)
- ✅ `requirements.txt` (actualizado)
- ✅ `initialize_db.py` (ya creado)

### PASO 2.3: Instalación local (OPCIONAL pero recomendado)

Para probar que funciona antes de desplegar:

```powershell
# En PowerShell (desde la carpeta del proyecto)
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python initialize_db.py
python app.py
```

Deberías ver: `Running on http://...`

---

## PARTE 3: PREPARAR REPOSITORIO GIT 🔧

### PASO 3.1: Inicializar Git (si no tiene)

```powershell
# En PowerShell (desde la carpeta del proyecto)
git init
git add .
git commit -m "Initial commit: Chauta project ready for deployment"
```

### PASO 3.2: Crear repositorio en GitHub

1. **Ir a GitHub**
   - Abre https://github.com
   - Haz login o crea cuenta
   - Haz clic en el "+" arriba a la derecha
   - Selecciona "New repository"

2. **Configurar repositorio**
   - Nombre: `chauta` (o el que prefieras)
   - Descripción: "Sistema de gestión de tienda"
   - Selecciona "Public" (así Render puede acceder)
   - NO inicialices con README (ya tienes archivos)
   - Haz clic en "Create repository"

### PASO 3.3: Subir código a GitHub

```powershell
# En PowerShell
git branch -M main
git remote add origin https://github.com/TU-USUARIO/chauta.git
git push -u origin main
```

Reemplaza `TU-USUARIO` con tu usuario de GitHub

---

## PARTE 4: DEPLOYMENT EN RENDER 🚀

### PASO 4.1: Crear cuenta en Render

1. **Ir a Render**
   - Abre https://render.com
   - Haz clic en "Get Started" o "Sign Up"
   - Selecciona "Sign up with GitHub" (más fácil)
   - Autoriza Render en GitHub

### PASO 4.2: Crear Web Service

1. **En el dashboard de Render**
   - Haz clic en "New +" 
   - Selecciona "Web Service"

2. **Conectar repositorio**
   - Si no lo ve, haz clic en "Connect a repository"
   - Busca y selecciona "chauta"
   - Haz clic en "Connect"

### PASO 4.3: Configurar servicio

**Llena los campos así:**

| Campo | Valor |
|-------|-------|
| **Name** | chauta |
| **Environment** | Python 3 |
| **Build Command** | `pip install -r requirements.txt && python initialize_db.py` |
| **Start Command** | `gunicorn app:app` |
| **Instance Type** | Free (el plan gratuito) |

### PASO 4.4: Agregar variables de entorno

1. **En la sección "Environment"**
2. **Haz clic en "Add Environment Variable"**
3. **Agrega CADA una de estas variables:**

```
DB_HOST: tu-host-tidb.tidbcloud.com
DB_PORT: 4000
DB_USER: tu-usuario-tidb  
DB_PASSWORD: tu-password-tidb
DB_NAME: base_chauta
FLASK_ENV: production
SECRET_KEY: chautasecretkey20260411
```

**⚠️ IMPORTANTE:** Usa los datos reales de TiDB Cloud

### PASO 4.5: Iniciar deployment

1. **Haz clic en "Create Web Service"**
2. **Render empezará a desplegar** (verás el log en vivo)
3. **Espera a que termine** (puede durar 5-10 minutos)
4. **Deberías ver:** ✅ "Your service is live"

### PASO 4.6: Ver tu aplicación en vivo

1. **Busca el URL en la página**
   - Algo como: `https://chauta-xxxxx.onrender.com`
2. **Haz clic en el URL**
3. **¡Listo! Tu aplicación está en vivo** 🎉

---

## PARTE 5: VERIFICACIONES FINALES ✅

### PASO 5.1: Probar conexión a base de datos

1. **Ir a tu aplicación desplegada**
2. **Prueba las operaciones:**
   - Agregar categorías
   - Agregar productos
   - Hacer ventas
   - Verificar que guarda en la base de datos

### PASO 5.2: Ver logs en Render

Si algo falla:
1. **En Render, ve a tu servicio**
2. **Haz clic en "Logs"**
3. **Busca el error** (suele estar en rojo)
4. **Comunes:**
   - "Connection refused" = Credenciales de BD incorrectas
   - "Error 403" = Variables de entorno no guardadas
   - "Module not found" = requirements.txt incompleto

### PASO 5.3: Actualizar código después

Cada vez que hagas cambios:
```powershell
git add .
git commit -m "Cambios a la app"
git push origin main
```
Render **automáticamente** volverá a desplegar ✨

---

## PARTE 6: SOLUCIÓN DE PROBLEMAS 🔧

### Problema: "Connection refused"
**Solución:**
1. Verifica credenciales de TiDB Cloud
2. Asegúrate que copiaste HOST, USER, PASSWORD exactamente
3. Ve a TiDB Cloud → Cluster → Connection para revisar datos

### Problema: "Database not found"
**Solución:**
1. En TiDB Cloud, ve a Web Shell
2. Ejecuta: `SHOW DATABASES;`
3. Si no ves `base_chauta`, crear con: `CREATE DATABASE base_chauta;`

### Problema: "ModuleNotFoundError: No module named..."
**Solución:**
1. Asegúrate que `requirements.txt` tiene todas las librerías
2. Ve a Render → Logs y mira cuál falta
3. Agrega a requirements.txt y haz push nuevamente

### Problema: "Gunicorn not found"
**Solución:**
1. Verifica que en requirements.txt esté: `gunicorn==21.2.0`
2. Si no está, agrégalo
3. Guarda y haz push

---

## 📚 RESUMEN RÁPIDO

```
1. TiDB Cloud: Crear cluster → Copiar credenciales → Crear BD
2. Proyecto: .env con credenciales → Git push a GitHub
3. Render: New Web Service → Conectar GitHub → Agregar variables
4. Aplicación en vivo en 5-10 minutos
```

---

## 🎯 URLS IMPORTANTES

- TiDB Cloud: https://tidbcloud.com
- Render: https://render.com  
- GitHub: https://github.com

## ⚡ LÍMITES DEL PLAN GRATUITO

- **TiDB Cloud**: 5GB almacenamiento, 3M filas
- **Render**: Servidor se apaga después de 15 min sin actividad

---

**¿PREGUNTAS? Revisa los logs en Render o TiDB Cloud para ver errores específicos** 🚀
