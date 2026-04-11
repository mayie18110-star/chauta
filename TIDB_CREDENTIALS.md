# 🔐 OBTENER CREDENCIALES DE TIDB CLOUD (Paso a Paso Visual)

## E1: Crear Cluster en TiDB Cloud

### Paso 1: Registrarse y Crear Cluster

```
1. Abre: https://tidbcloud.com
2. Haz clic en "Sign Up"
3. Usa tu email
4. Verifica email
5. Haz login
```

### Paso 2: En el Dashboard

```
Verás:
┌─────────────────────────────┐
│  Create Cluster             │
│  [Botón azul]               │
└─────────────────────────────┘
```

Haz clic en `Create Cluster`

### Paso 3: Seleccionar Tier

```
┌─────────────────────────────┐
│ Choose your plan:           │
│ [o] Serverless Tier (FREE)  │ ← SELECCIONA ESTO
│ [ ] Dedicated Tier (Pago)   │
└─────────────────────────────┘
```

Haz clic en `Serverless Tier`

### Paso 4: Seleccionar Region

```
Region: [Dropdown]
Opciones:
  - Washington D.C (us-east-1) ← Para América
  - N. California (us-west-1)
  - Frankfurt (eu-central-1)
  - Singapore (ap-southeast-1)
  
Elige la más cercana a ti
```

### Paso 5: Nombre del Cluster

```
Cluster Name: [chauta-cluster] ← Puedes cambiar
```

### Paso 6: Crear

```
Botón azul: [Create] ← Haz clic
┌─────────────────────────────┐
│ Creating your cluster...    │
│ (Espera 2-3 minutos)        │
└─────────────────────────────┘
```

---

## Paso 2: Obtener Credenciales

Una vez que el cluster esté "Active":

### Paso 1: Haz clic en el cluster

```
Dashboard TiDB:
┌────────────────────────────────┐
│ Clusters                       │
│ ┌──────────────────────────┐   │
│ │ chauta-cluster           │   │ ← Haz clic aquí
│ │ Status: Active ✓         │   │
│ │ Region: us-east-1        │   │
│ └──────────────────────────┘   │
└────────────────────────────────┘
```

### Paso 2: Abre "Connection"

Verás tabs:
```
[Overview] [Connection] [Management] [Logs]
              ↓
            Haz clic aquí
```

### Paso 3: Busca "Database Connection"

Verás algo tipo:
```
┌─────────────────────────────────────────────┐
│ Database Connection                         │
│ Public Endpoint (Gateway)                   │
│                                             │
│ Connection Type: [MySQL Tab Active]         │
│                                             │
│ Host:                                       │
│ gateway01.us-west-1.prod.aws.tidbcloud.com │
│ (o similar)                                 │
│                                             │
│ Port: 4000                                  │
│                                             │
│ Username Generator [▼]                      │
│ 2hf87jd8s9d.root                           │
│                                             │
│ Password: [•••••••] [Show]                  │
│ P@ssw0rd123                                 │
│                                             │
│ Database:                                   │
│ [vacío]                                     │
└─────────────────────────────────────────────┘
```

### Paso 4: COPIAR DATOS

Usa esto:

✅ **HOST**: `gateway01.us-west-1.prod.aws.tidbcloud.com`
   - Haz clic en "Copy"

✅ **PORT**: `4000`
   - Es fijo, siempre 4000

✅ **USER**: `2hf87jd8s9d.root`
   - Haz clic en "Copy"

✅ **PASSWORD**: (Haz clic en "Show" primero)
   - Luego haz clic en "Copy"

✅ **DATABASE**: `base_chauta`
   - Lo crearemos después

---

## Paso 3: Crear la Base de Datos

### En la página de "Connection":

Busca el botón **"Web Shell"** o **"Web Console"**

```
┌─────────────────────────────┐
│ ... [Web Shell] [...]       │ ← Botón en la esquina
└─────────────────────────────┘
```

Haz clic en él

### Se abre terminal online

```
Welcome to TiDB Cloud Shell!
mysql>
   ↑
   Acá escribes comandos
```

### Copia y pega esto:

```sql
CREATE DATABASE IF NOT EXISTS base_chauta;
USE base_chauta;
SHOW DATABASES;
```

### Deberías ver:

```
mysql> SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| base_chauta        | ← ¡Aquí está!
+--------------------+
```

Si ves `base_chauta`, está listo.

---

## Resumen: QUÉ COPIAR

**Abre un documento de texto y guarda:**

```
TIDB CLOUD CREDENCIALES:

HOST: gateway01.us-west-1.prod.aws.tidbcloud.com
PORT: 4000
USER: 2hf87jd8s9d.root
PASSWORD: P@ssw0rd123
DATABASE: base_chauta

(Reemplaza con TUS datos reales)
```

---

## Paso 4: Crear el archivo .env local

En Visual Studio Code:

### Crea archivo `.env`

```
File → New File → Guardar como: .env
```

### Contenido:

```
DB_HOST=gateway01.us-west-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=2hf87jd8s9d.root
DB_PASSWORD=P@ssw0rd123
DB_NAME=base_chauta
FLASK_ENV=production
SECRET_KEY=chautasecret123
```

**Reemplaza con TUS datos reales** (los que guardaste arriba)

### Guarda

```
Ctrl + S
```

---

## Verificación Local (OPCIONAL)

Para asegurarte que las credenciales son correctas:

```powershell
# En PowerShell, desde la carpeta del proyecto:
python

# Dentro de Python:
>>> import mysql.connector
>>> conn = mysql.connector.connect(
...     host="gateway01.us-west-1.prod.aws.tidbcloud.com",
...     port=4000,
...     user="2hf87jd8s9d.root",
...     password="P@ssw0rd123",
...     database="base_chauta"
... )
>>> print("✓ Conexión exitosa!")
```

Si ves `✓ Conexión exitosa!` = Datos correctos ✨

Si ves error = Revisa credenciales

---

## ⚠️ IMPORTANTES

1. **HOST**: Copia exactamente (incluye `.tidbcloud.com`)
2. **PORT**: Siempre es `4000` para TiDB
3. **USER**: Puede tener puntos (`.`), no borres
4. **PASSWORD**: Copia sin espacios extras
5. **DATABASE**: Debe existir (ya creamos `base_chauta`)

---

## Siguiente paso

Una vez que tengas `.env` con datos reales:

👉 Ve a **DEPLOYMENT_GUIA.md** (Parte 3 en adelante)

---

**FIN**: Ya tienes credenciales de TiDB Cloud ✅
