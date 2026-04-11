# 🔄 CÓMO FUNCIONA LA INICIALIZACIÓN DE BASE DE DATOS

## ¿Por qué no necesitas shell pagado en Render?

Render ejecuta comandos de forma **gratuita** durante el deployment. No es lo mismo que abrir una terminal interactiva (eso sí es de paga).

---

## El flujo automático

```
1. Empujas código a GitHub
     ↓
2. Render detecta el cambio
     ↓
3. Render ejecuta BUILD COMMAND:
   → pip install -r requirements.txt
   → python initialize_db.py  ← Aquí se crean las tablas
     ↓
4. Render ejecuta START COMMAND:
   → gunicorn app:app
     ↓
5. ¡Tu app está en vivo!
```

---

## Archivo: initialize_db.py

Este script hace TODO automáticamente:

✅ Se conecta a TiDB Cloud usando variables de entorno
✅ Crea la tabla `categorias`
✅ Crea la tabla `productos`  
✅ Crea la tabla `ventas`
✅ Crea la tabla `detalle_ventas`
✅ Crea la tabla `config_tienda`
✅ Muestra mensajes: ✓ Tabla creada

**Lo importante:** Se ejecuta SOLO UNA VEZ (CREATE TABLE IF NOT EXISTS)
- Si ya existen las tablas, no hace nada
- Si no existen, las crea
- Después cada deployment: no cambia nada

---

## Variables de entorno en Render

Son protegidas y secretas. Render:
- ✅ NO las muestra en logs
- ✅ Acepta comandos que las usan
- ✅ Las inyecta durante el build

Por eso en initialize_db.py hacemos:
```python
access_config = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    ...
}
```

Render reemplaza automáticamente con valores reales.

---

## Procfile: La magia

```
web: gunicorn app:app
release: python initialize_db.py
```

- **web**: El comando que ejecuta la aplicación (siempre)
- **release**: El comando que ejecuta ANTES de cada deployment (creación de BD)

"release" es GRATIS en Render, es parte del deployment.

---

## Verificar que funcionó

### Opción 1: Logs en Render
```
1. Ve a tu servicio en Render
2. Abre la tab "Logs"
3. Busca:   ✓ Tabla 'productos' creada/verificada
             ✓ Tabla 'ventas' creada/verificada
             ✓✓✓ Base de datos inicializada correctamente ✓✓✓
```

### Opción 2: Desde la app
```
1. Accede a tu aplicación en Render
2. Si funciona, significa que las tablas fueron creadas
3. Prueba: agregar un producto
   → Si se guarda, la BD está lista
```

### Opción 3: En TiDB Cloud
```
1. Ve a TiDB Cloud → Tu cluster → Web Shell
2. Ejecuta:
   USE base_chauta;
   SHOW TABLES;
3. Deberías ver:
   - categorias
   - productos
   - ventas
   - detalle_ventas
   - config_tienda
```

---

## Flujo después de cambios

Cada vez que hagas cambios:
```
git push origin main
    ↓ (Render detecta automáticamente)
Render ejecuta: python initialize_db.py
    ↓ (Si hay nuevas tablas en el script, se crean)
    ↓ (Si ya existen, no hace nada)
Render ejecuta: gunicorn app:app
    ↓
App actualized en vivo: https://chauta-xxxxx.onrender.com
```

---

## Resumen

**SIN SHELL PAGADO:**
- ✅ Crear tablas: automático (initialize_db.py)
- ✅ Actualizar tablas: automático (agregar al script)
- ✅ Datos iniciales: puedes agregar al script

**CON SHELL PAGADO (NO NECESARIO):**
- Editar datos manualmente
- Consultas directas complejas
- Debugging interactivo

**Recomendación:** Para tu app, NUNCA necesitarás shell pagado ✨

---

## ¿Qué pasa si falla?

Si al desplegar ves error en logs:

1. **Error: "Auth failed"**
   - Credenciales incorrectas
   - Solución: Verifica en Render → Environment que DB_PASSWORD sea correcto

2. **Error: "database not found"**
   - BD `base_chauta` no existe en TiDB
   - Solución: En TiDB Cloud, crea: `CREATE DATABASE base_chauta;`

3. **Error: "Table already exists"**
   - Cambió el script sin verificar IF NOT EXISTS
   - Solución: Asegúrate que todos los CREATE TABLE tengan IF NOT EXISTS

4. **Error: "Connection refused"**
   - TiDB Cloud offline o credenciales mal
   - Solución: Verifica cluster esté "Active" en TiDB Cloud

---

**Resultado final:** Tu BD se crea automáticamente, gratis, sin necesidad de shell 🚀
