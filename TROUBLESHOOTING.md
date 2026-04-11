# 🔧 TROUBLESHOOTING - Soluciones a problemas comunes

## 🚨 Durante el Deployment

### ❌ Error: "Build failed"

**En los logs verás:**
```
...
error: pip install failed
...
```

**Soluciones:**
1. Verifica que `requirements.txt` no tenga errores
2. Ejecuta localmente: `pip install -r requirements.txt`
3. Si falla, genera nuevo requirements.txt:
   ```powershell
   pip freeze > requirements.txt
   ```

---

### ❌ Error: "Connection refused" o "Cannot connect to database"

**En los logs verás:**
```
Error: Connect timeout
Connection refused
ECONNREFUSED
```

**Causas y soluciones:**

| Causa | Solución |
|-------|----------|
| DB_HOST incorrecto | 1. Ve a TiDB Cloud<br>2. Cluster → Connection<br>3. Copia HOST exacto<br>4. Pega en Render Environment |
| DB_PORT incorrecto | Debe ser siempre `4000` (port TiDB) |
| DB_USER incorrecto | 1. TiDB Cloud → Cluster<br>2. Acceso DB → Users<br>3. Copia exactamente |
| DB_PASSWORD incorrecto | 1. Copia sin espacios<br>2. Si tiene caracteres especiales (@, #, etc), usar comillas |
| DB_NAME no existe | En TiDB Web Shell: `CREATE DATABASE base_chauta;` |
| Cluster TiDB offline | Verifica en TiDB Cloud que diga "Active" |

**Verificación rápida:**
```powershell
# Local (para probar conexión)
python
>>> import mysql.connector
>>> conn = mysql.connector.connect(
...     host="tu-host.tidbcloud.com",
...     port=4000,
...     user="tu-user",
...     password="tu-password",
...     database="base_chauta"
... )
>>> print("✓ Conexión exitosa")
```

---

### ❌ Error: "ModuleNotFoundError: No module named 'mysql'"

**En los logs verás:**
```
ModuleNotFoundError: No module named 'mysql.connector'
```

**Solución:**
```
1. Abre requirements.txt
2. Verifica que tenga:
   mysql-connector-python==8.2.0
3. Si no está, agrégalo
4. Guarda y haz git push
5. Render redesplegará automáticamente
```

---

### ❌ Error: "No module named 'dotenv'"

**Solución:**
```
requirements.txt debe tener:
python-dotenv==1.0.0
```

---

### ❌ Error: "gunicorn: command not found"

**En los logs verás:**
```
bash: gunicorn: command not found
Start Command exited with code 127
```

**Solución:**
```
1. requirements.txt debe tener:
   gunicorn==21.2.0
2. Verifica que esté instalado localmente:
   pip install gunicorn
3. Haz git push
```

---

### ❌ Error: "initialize_db.py: No such file"

**Solución:**
```
1. Verifica que el archivo existe:
   c:\Users\Usuario\OneDrive\Escritorio\chauta\initialize_db.py
2. Si no existe, créalo (está en la guía)
3. Asegúrate de capitalización:
   - initialize_db.py (correcto)
   - initialize_DB.py (incorrecto)
4. Haz git push
```

---

### ❌ Error: "Environment variable X not found"

**En los logs verás:**
```
KeyError: 'DB_HOST'
```

**Solución:**
1. Ve a Render → Tu servicio
2. Haz clic en "Environment"
3. Verifica que TODAS estén:
   - DB_HOST
   - DB_PORT
   - DB_USER
   - DB_PASSWORD
   - DB_NAME
   - FLASK_ENV
   - SECRET_KEY
4. Si falta una, agrégala
5. Guarda y espera a redeployment

---

### ❌ Error: "Your service is live pero la app no carga"

**Causas:**

**1. Puerto incorrecto**
```
Start Command debe ser:
gunicorn app:app

NO:
gunicorn app:app --port 3000
Render asigna el puerto automáticamente
```

**2. app.py no existe**
```
Verifica que el archivo sea:
app.py (no App.py, no app.PY)
```

**3. Hay error en app.py**
```
Ve a Render → Logs
Busca "Exception" o "Error"
Puede ser import faltante o sintaxis
```

---

## 🚨 Después del Deployment

### ❌ App carga pero "Error 500"

**Solución:**
1. Ve a Render → Logs
2. Busca la línea de error completa
3. Común: Conexión a BD

**Si es "Cannot connect to database":**
```
1. Verifica BD existe en TiDB:
   TiDB Cloud → Web Shell
   SHOW DATABASES;
   Debería ver: base_chauta
2. Si no existe:
   CREATE DATABASE base_chauta;
```

---

### ❌ "Cannot add product" o error al guardar

**Es error de conexión a BD:**
1. Logs en Render verán error SQL
2. Verifica credenciales de TiDB
3. Verifica que tablas existan:
   ```sql
   -- En TiDB Web Shell
   USE base_chauta;
   SHOW TABLES;
   ```

---

### ❌ App dice "Database already initialized" en logs

**Esto es NORMAL:**
```
En cada deployment, initialize_db.py intenta crear tablas
Pero si ya existen, simplemente salta (por IF NOT EXISTS)
Es correcto, no es error
```

---

### ❌ Imágenes no se ven

**Causa:** Carpeta static/img no existe

**Solución:**
```
1. Ve a tu carpeta proyecto local
2. Crea carpeta: static/img
3. Haz git push
4. Render redesplegará
```

---

## 🔍 Debugging paso a paso

### Paso 1: ¿Qué dice el error?

```
Ve a Render → Tu servicio → Logs
Copia el último error que ves (línea en rojo)
```

### Paso 2: ¿Cuándo ocurre?

- ¿Durante build? → Error en requirements o python síntax
- ¿Durante start? → Error al conectar o iniciar Flask
- ¿Al usar app? → Error en lógica de app

### Paso 3: Soluciona sistemáticamente

```
1. Build error:
   → python -m py_compile app.py (verifica síntaxis local)
   → pip install -r requirements.txt (verifica dependencias)

2. Start error:
   → Revisa initialize_db.py credenciales
   → python initialize_db.py (prueba localmente)

3. Runtime error:
   → Busca stacktrace completo en logs
   → Googlea el error específico
```

### Paso 4: Después de las correcciones

```powershell
git add .
git commit -m "Fix: [describe el error que arreglaste]"
git push origin main
# Render redeploía automáticamente
# Espera 2-3 minutos
# Revisa logs nuevamente
```

---

## 📱 Pruebas de conectividad

### De local a TiDB Cloud

```powershell
# Abre powershell
python

# Dentro de Python:
import mysql.connector

db_config = {
    'host': 'TU-HOST.tidbcloud.com',
    'port': 4000,
    'user': 'TU-USER',
    'password': 'TU-PASSWORD',
    'database': 'base_chauta'
}

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    cursor.execute("SELECT 1")
    print("✓ Conexión exitosa a TiDB")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"✗ Error: {e}")
    print(f"   Verifica HOST, USER, PASSWORD")
```

---

## 🆘 Si nada funciona

### Opción 1: Revisar todo nuevamente

```
1. ¿.env tiene datos reales de TiDB? (local)
2. ¿requirements.txt tiene TODO? (especialmente gunicorn)
3. ¿initialize_db.py existe?
4. ¿Render Variables de Entorno están correctas?
5. ¿Código fue pushed a GitHub?
```

### Opción 2: Redeployar

```
1. Ve a Render → Tu servicio
2. Haz clic en "Manual Deploy"
3. Elige "Deploy main branch"
4. Espera 5-10 minutos
5. Revisa logs nuevamente
```

### Opción 3: Empezar de cero (último recurso)

```
1. En Render: Delete the Web Service
2. Elimina repository en GitHub
3. Crea nuevo repo
4. Nuevo Web Service en Render
5. Conecta nuevo repo
```

---

## 📊 Estado de salud de la app

**App está bien si ves:**
- ✅ "Your service is live"
- ✅ Puedes acceder a https://chauta-xxxxx.onrender.com
- ✅ Logs dicen "Application started"
- ✅ Puedes crear productos
- ✅ Los datos se guardan

**App tiene problemas si ves:**
- ❌ "Build failed" en logs
- ❌ "Application crashed"
- ❌ Error 500 en la web
- ❌ "Cannot connect to database"

---

## 📚 Recursos útiles si falla

- Render Docs: https://render.com/docs
- TiDB Docs: https://docs.tidbcloud.com
- Flask Docs: https://flask.palletsprojects.com
- MySQL Connector Python: https://dev.mysql.com/doc/connector-python/en/

---

**Última opción:** Revisa los logs con muy atención, busca la línea de error exacta y googlea "render [tu error específico]" ✨
