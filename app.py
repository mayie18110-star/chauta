from flask import Flask, render_template, request, jsonify
import mysql.connector
from mysql.connector import Error
from datetime import datetime
from decimal import Decimal
import os
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from flask_mail import Mail, Message
import secrets

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)

# Carpeta donde se guardarán las imágenes subidas
UPLOAD_FOLDER = os.path.join('static', 'img')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Configuración de Flask-Mail
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER') or app.config['MAIL_USERNAME']
app.config['MAIL_TEST_MODE'] = os.environ.get('MAIL_TEST_MODE', 'True').lower() == 'true'

mail = Mail(app)

# Diccionario para almacenar códigos de recuperación temporales
recovery_codes = {}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Configuración de base de datos desde variables de entorno
DB_SSL_CA = os.environ.get('DB_SSL_CA')
db_config = {
    'host': os.environ.get('DB_HOST', '127.0.0.1'),
    'port': int(os.environ.get('DB_PORT', 3307)),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'database': os.environ.get('DB_NAME', 'base_chauta'),
    'autocommit': True,
    'use_unicode': True,
    'charset': 'utf8mb4'
}
if DB_SSL_CA:
    db_config['ssl_ca'] = DB_SSL_CA
    db_config['ssl_verify_cert'] = True

def get_db_connection():
    try:
        connection = mysql.connector.connect(**db_config)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        print('DB config used:', db_config)
        return None

def initialize_database():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS categorias (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) UNIQUE NOT NULL,
                imagen_url TEXT,
                tienda_id INT DEFAULT 1
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS productos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                codigo_barras VARCHAR(50) UNIQUE NOT NULL,
                nombre VARCHAR(100) NOT NULL,
                marca VARCHAR(50) NOT NULL,
                precio_unidad DECIMAL(10, 2) NOT NULL,
                unidad VARCHAR(20) DEFAULT 'un',
                stock DECIMAL(10, 3) DEFAULT 0,
                imagen_url TEXT,
                categoria_id INT,
                tienda_id INT DEFAULT 1,
                FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ventas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
                subtotal DECIMAL(10, 2) NOT NULL,
                impuestos DECIMAL(10, 2) NOT NULL,
                total DECIMAL(10, 2) NOT NULL,
                caja_id INT DEFAULT 1
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS detalle_ventas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                venta_id INT,
                producto_id INT,
                cantidad DECIMAL(10, 3) NOT NULL,
                precio_unitario DECIMAL(10, 2) NOT NULL,
                total_linea DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
                FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS config_tienda (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre_supermercado VARCHAR(100) NOT NULL,
                direccion VARCHAR(255),
                nit VARCHAR(50),
                contrasena VARCHAR(255) NOT NULL,
                num_cajeros INT DEFAULT 1,
                correo VARCHAR(100),
                admin_nombre VARCHAR(100),
                admin_user VARCHAR(100) NOT NULL,
                admin_password VARCHAR(255) NOT NULL,
                admin_email VARCHAR(100),
                cajero_email VARCHAR(100)
            )
        ''')

        def add_column_if_missing(table, column, definition):
            cursor.execute(f"SHOW COLUMNS FROM {table} LIKE %s", (column,))
            if not cursor.fetchone():
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")

        add_column_if_missing('config_tienda', 'correo', 'VARCHAR(100)')
        add_column_if_missing('config_tienda', 'admin_nombre', 'VARCHAR(100)')
        add_column_if_missing('config_tienda', 'admin_email', 'VARCHAR(100)')
        add_column_if_missing('config_tienda', 'cajero_email', 'VARCHAR(100)')
        add_column_if_missing('categorias', 'tienda_id', 'INT DEFAULT 1')
        add_column_if_missing('productos', 'tienda_id', 'INT DEFAULT 1')

        cursor.execute("SHOW COLUMNS FROM config_tienda LIKE 'nombre_dueno'")
        if cursor.fetchone():
            cursor.execute("UPDATE config_tienda SET admin_nombre = nombre_dueno WHERE admin_nombre IS NULL")

        # NUEVAS TABLAS PARA FIADOS
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS clientes_fiados (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                total_pendiente DECIMAL(10, 2) NOT NULL DEFAULT 0,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS detalle_fiados (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cliente_fiado_id INT,
                producto_id INT,
                cantidad DECIMAL(10, 3) NOT NULL,
                precio_unitario DECIMAL(10, 2) NOT NULL,
                total_linea DECIMAL(10, 2) NOT NULL,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cliente_fiado_id) REFERENCES clientes_fiados(id) ON DELETE CASCADE,
                FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
            )
        ''')

        # Solo insertar categorías si no existen — SIN productos de prueba
        cursor.execute("SELECT COUNT(*) FROM categorias")
        if cursor.fetchone()[0] == 0:
            categorias_iniciales = [
                ('Licores',), ('Galletas',), ('Arroces',), ('Atunes',),
                ('Vegetales',), ('Panadería',), ('Lácteos',), ('Frutas',),
                ('Aseos',), ('Bebidas',), ('Snacks',), ('Carnes',)
            ]
            cursor.executemany("INSERT INTO categorias (nombre) VALUES (%s)", categorias_iniciales)
            conn.commit()

        # MIGRACIÓN: Asegurar que stock y cantidad sean DECIMAL (Ejecutar si ya existan)
        try:
            cursor.execute("ALTER TABLE productos MODIFY stock DECIMAL(10, 3)")
            cursor.execute("ALTER TABLE detalle_ventas MODIFY cantidad DECIMAL(10, 3)")
            # MIGRACIÓN: Añadir imagen_url a categorías si no existe
            try:
                cursor.execute("ALTER TABLE categorias ADD COLUMN imagen_url TEXT")
            except:
                pass
            
            # MIGRACIÓN ROLES: Añadir credenciales de admin a config_tienda
            try:
                cursor.execute("ALTER TABLE config_tienda ADD COLUMN admin_user VARCHAR(100)")
                cursor.execute("ALTER TABLE config_tienda ADD COLUMN admin_password VARCHAR(255)")
                cursor.execute("UPDATE config_tienda SET admin_user = 'admin', admin_password = 'admin123' WHERE admin_user IS NULL")
            except Exception as ex:
                pass # Ya existen las columnas
                
            # MIGRACIÓN CONTABILIDAD: Añadir tabla y caja_id a ventas previas
            try:
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS contabilidad_caja (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
                        caja_id INT NOT NULL,
                        base_inicial DECIMAL(10, 2) NOT NULL
                    )
                ''')
                cursor.execute("ALTER TABLE ventas ADD COLUMN caja_id INT DEFAULT 1")
            except Exception as ex:
                pass # Ya existe
                
            # MIGRACIÓN CIERRES Y MÉTODO PAGO
            try:
                cursor.execute("ALTER TABLE ventas ADD COLUMN metodo_pago VARCHAR(20) DEFAULT 'efectivo'")
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS cierres_caja (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
                        caja_id INT NOT NULL,
                        base_inicial DECIMAL(10, 2) NOT NULL,
                        efectivo_ventas DECIMAL(10, 2) NOT NULL,
                        transferencia_ventas DECIMAL(10, 2) NOT NULL,
                        total_teorico DECIMAL(10, 2) NOT NULL,
                        efectivo_contado DECIMAL(10, 2) NOT NULL,
                        diferencia DECIMAL(10, 2) NOT NULL
                    )
                ''')
            except Exception as ex:
                pass 
                
            conn.commit()
        except Exception as e:
            print(f"Nota: La migración a DECIMAL ya se realizó o falló controladamente: {e}")

        cursor.close()
        conn.close()

try:
    initialize_database()
except Exception as e:
    print("Error inicializando base de datos:", e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/api/ping', methods=['GET'])
def ping():
    """Endpoint de diagnóstico: verifica conexión a la BD."""
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM productos")
        total = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        return jsonify({'status': 'ok', 'total_productos': total})
    return jsonify({'status': 'error', 'mensaje': 'No se pudo conectar a la BD'}), 500

# ================= API ENDPOINTS =======================

@app.route('/api/producto/<codigo_barras>', methods=['GET'])
def get_producto(codigo_barras):
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT p.*, c.nombre as categoria_nombre 
            FROM productos p 
            LEFT JOIN categorias c ON p.categoria_id = c.id 
            WHERE p.codigo_barras = %s
        """, (codigo_barras,))
        producto = cursor.fetchone()
        cursor.close()
        conn.close()
        if producto:
            if 'precio_unidad' in producto:
                producto['precio_unidad'] = int(float(producto['precio_unidad']))
            return jsonify(producto)
        else:
            return jsonify({'error': 'Producto no encontrado'}), 404
    return jsonify({'error': 'Error de base de datos'}), 500

@app.route('/api/productos/search', methods=['GET'])
def search_productos():
    query = request.args.get('q', '').strip()
    cat_id = request.args.get('categoria_id', '').strip()
    
    # Búsqueda por categoría explícita
    if cat_id:
        conn = get_db_connection()
        if conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT p.*, c.nombre as categoria_nombre 
                FROM productos p 
                LEFT JOIN categorias c ON p.categoria_id = c.id 
                WHERE p.categoria_id = %s 
                ORDER BY p.nombre ASC
            """, (cat_id,))
            results = cursor.fetchall()
            for p in results:
                p['precio_unidad'] = int(float(p['precio_unidad']))
            cursor.close()
            conn.close()
            return jsonify(results)
            
    if not query:
        return jsonify([])

    solo_codigo = request.args.get('solo_codigo', '0') == '1'

    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT p.*, c.nombre as categoria_nombre 
            FROM productos p 
            LEFT JOIN categorias c ON p.categoria_id = c.id 
            WHERE p.codigo_barras = %s
        """, (query,))
        exact_match = cursor.fetchall()
        
        if exact_match:
            # Convertir a Entero en COP
            for p in exact_match:
                p['precio_unidad'] = int(float(p['precio_unidad']))
            
            print(f"Búsqueda exacta [SOLO_CODIGO={solo_codigo}] para '{query}'")
            cursor.close()
            conn.close()
            return jsonify(exact_match)

        # SI SE PIDE SOLO CÓDIGO Y NO HUBO COINCIDENCIA EXACTA, LLEGAR AQUÍ Y RETORNAR VACÍO
        if solo_codigo:
            cursor.close()
            conn.close()
            return jsonify([])

        sql = "SELECT * FROM productos WHERE LOWER(nombre) LIKE LOWER(%s) ORDER BY nombre ASC"
        cursor.execute(sql, (f"%{query}%",))
        results = cursor.fetchall()
        
        # Convertir a Entero para Pesos Colombianos
        for p in results:
            p['precio_unidad'] = int(float(p['precio_unidad']))
            
        print(f"Búsqueda por nombre para '{query}': {len(results)} resultados")
        
        cursor.close()
        conn.close()
        return jsonify(results)
    
    return jsonify({'error': 'Error de base de datos'}), 500

@app.route('/api/productos', methods=['GET'])
def get_productos():
    tienda_id = request.args.get('tienda_id', 1, type=int)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('''
        SELECT p.*, c.nombre as categoria_nombre
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id AND c.tienda_id = %s
        WHERE p.tienda_id = %s
        ORDER BY p.nombre ASC
    ''', (tienda_id, tienda_id))
    productos = cursor.fetchall()
        
    # Convertir a Entero para COP
    for p in productos:
        if 'precio_unidad' in p:
            p['precio_unidad'] = int(float(p['precio_unidad']))
            
    cursor.close()
    conn.close()
    return jsonify(productos)

@app.route('/api/productos', methods=['POST'])
def add_producto():
    try:
        prod_id       = request.form.get('id', '').strip() or None
        tienda_id     = int(request.form.get('tienda_id', 1))
        codigo_barras = request.form.get('codigo_barras', '').strip()
        nombre        = request.form.get('nombre', '').strip()
        marca         = request.form.get('marca', '').strip()
        precio_unidad = request.form.get('precio_unidad', '0').strip()
        unidad        = request.form.get('unidad', 'un').strip()
        stock         = request.form.get('stock', '0').strip()
        categoria_id  = request.form.get('categoria_id') or None

        # Log completo de los datos recibidos
        print("\n===== add_producto RECIBIDO =====")
        print(f"  codigo_barras : '{codigo_barras}'")
        print(f"  nombre        : '{nombre}'")
        print(f"  marca         : '{marca}'")
        print(f"  precio_unidad : '{precio_unidad}'")
        print(f"  unidad        : '{unidad}'")
        print(f"  stock         : '{stock}'")
        print(f"  categoria_id  : '{categoria_id}'")
        print(f"  imagen_file   : {bool(request.files.get('imagen_file'))}")
        print("================================\n")

        if not codigo_barras:
            return jsonify({'error': 'El código de barras es obligatorio'}), 400
        if not nombre:
            return jsonify({'error': 'El nombre del producto es obligatorio'}), 400
        if not marca:
            return jsonify({'error': 'La marca es obligatoria'}), 400
        if not precio_unidad:
            return jsonify({'error': 'El precio es obligatorio'}), 400

        precio_unidad = float(precio_unidad)
        stock = int(stock)

        # Manejo de imagen
        imagen_url = request.form.get('imagen_url_manual', '').strip() or None
        file = request.files.get('imagen_file')
        if file and file.filename != '' and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            imagen_url = f'/static/img/{filename}'

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500

        cursor = conn.cursor()
        
        # SI SE ENVIA UN ID, ES UNA EDICIÓN EXPLÍCITA (Sobrescribir stock)
        if prod_id:
            cursor.execute("""
                UPDATE productos
                SET codigo_barras=%s, nombre=%s, marca=%s, precio_unidad=%s,
                    unidad=%s, stock=%s, imagen_url=COALESCE(%s, imagen_url), categoria_id=%s
                WHERE id=%s
            """, (codigo_barras, nombre, marca, precio_unidad, unidad, stock, imagen_url, categoria_id, prod_id))
            print(f"Producto EDITADO (ID {prod_id}): {nombre}")
        else:
            # SI NO HAY ID, FUNCIONA COMO "GUARDAR NUEVO" O "SUMAR STOCK" POR CÓDIGO
            cursor.execute("SELECT id, stock FROM productos WHERE codigo_barras = %s", (codigo_barras,))
            existing = cursor.fetchone()

            if existing:
                prod_id_existente = existing[0]
                nuevo_stock = existing[1] + stock
                cursor.execute("""
                    UPDATE productos
                    SET nombre=%s, marca=%s, precio_unidad=%s, unidad=%s,
                        stock=%s, imagen_url=COALESCE(%s, imagen_url), categoria_id=%s
                    WHERE id=%s
                """, (nombre, marca, precio_unidad, unidad, nuevo_stock, imagen_url, categoria_id, prod_id_existente))
                print(f"Stock SUMADO por código: {nombre} | Stock nuevo: {nuevo_stock}")
            else:
                cursor.execute("""
                    INSERT INTO productos (codigo_barras, nombre, marca, precio_unidad, unidad, stock, imagen_url, categoria_id, tienda_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (codigo_barras, nombre, marca, precio_unidad, unidad, stock, imagen_url, categoria_id, tienda_id))
                print(f"Producto NUEVO guardado: {nombre}")

        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True})

    except Exception as e:
        print(f"ERROR en add_producto: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/productos/<int:id>', methods=['DELETE'])
def delete_producto(id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Error de base de datos'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM productos WHERE id = %s", (id,))
        conn.commit()
        print(f"Producto ELIMINADO permanentemente (ID {id})")
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/categorias', methods=['GET'])
def get_categorias():
    tienda_id = request.args.get('tienda_id', 1, type=int)
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB error'}), 500
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, nombre, imagen_url FROM categorias WHERE tienda_id = %s ORDER BY nombre ASC", (tienda_id,))
    cats = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(cats)

@app.route('/api/categorias', methods=['POST'])
def add_categoria():
    try:
        cat_id = request.form.get('id')
        nombre = request.form.get('nombre', '').strip()
        if not nombre:
            return jsonify({'error': 'El nombre es obligatorio'}), 400
            
        file = request.files.get('imagen_file')
        imagen_url = None
        if file and file.filename != '' and allowed_file(file.filename):
            filename = secure_filename(f"cat_{datetime.now().strftime('%y%m%d%H%M')}_{file.filename}")
            os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            imagen_url = f'/static/img/{filename}'

        conn = get_db_connection()
        if not conn: return jsonify({'error': 'Error de base de datos'}), 500
        cursor = conn.cursor()
        
        if cat_id:
            # ACTUALIZAR
            if imagen_url:
                cursor.execute("UPDATE categorias SET nombre = %s, imagen_url = %s WHERE id = %s", (nombre, imagen_url, cat_id))
            else:
                cursor.execute("UPDATE categorias SET nombre = %s WHERE id = %s", (nombre, cat_id))
            print(f"Categoría ACTUALIZADA (ID {cat_id}): {nombre}")
        else:
            # INSERTAR
            cursor.execute("INSERT INTO categorias (nombre, imagen_url) VALUES (%s, %s)", (nombre, imagen_url))
            print(f"Categoría CREADA: {nombre}")
            
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        print(f"ERROR en add_categoria: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/categorias/<int:id>', methods=['DELETE'])
def delete_categoria(id):
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Error de base de datos'}), 500
    try:
        cursor = conn.cursor()
        # El esquema tiene ON DELETE SET NULL para productos, así que es seguro.
        cursor.execute("DELETE FROM categorias WHERE id = %s", (id,))
        conn.commit()
        print(f"Categoría ELIMINADA (ID {id})")
        return jsonify({'success': True})
    except Exception as e:
        print(f"ERROR en delete_categoria: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@app.route('/api/ventas', methods=['POST'])
def registrar_venta():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection error'}), 500

    data = request.json
    cart = data.get('cart', [])
    subtotal = data.get('subtotal', 0)
    impuestos = data.get('impuestos', 0)
    total = data.get('total', 0)
    caja_id = data.get('caja_id', 1)
    metodo_pago = data.get('metodo_pago', 'efectivo')

    try:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO ventas (subtotal, impuestos, total, caja_id, metodo_pago)
            VALUES (%s, %s, %s, %s, %s)
        ''', (subtotal, impuestos, total, caja_id, metodo_pago))

        venta_id = cursor.lastrowid

        for item in cart:
            cursor.execute("SELECT id, stock FROM productos WHERE codigo_barras = %s", (item['codigo_barras'],))
            prod = cursor.fetchone()
            if prod:
                p_id = prod[0]
                p_stock = prod[1]
                # Fallback para nombre de campo de precio (asegurar robustez)
                u_price = item.get('precio_unidad') or item.get('precio') or 0
                total_linea = u_price * item['cantidad']
                cursor.execute('''
                    INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, total_linea)
                    VALUES (%s, %s, %s, %s, %s)
                ''', (venta_id, p_id, item['cantidad'], u_price, total_linea))
                nuevo_stock = max(0, p_stock - item['cantidad'])
                cursor.execute("UPDATE productos SET stock = %s WHERE id = %s", (nuevo_stock, p_id))

        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'venta_id': venta_id})
    except Exception as e:
        print(f"ERROR en registrar_venta: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/productos/mas-vendidos', methods=['GET'])
def get_mas_vendidos():
    """Retorna los 4 productos más vendidos según detalle_ventas."""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB error'}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT p.id, p.nombre, p.imagen_url, SUM(dv.cantidad) AS total_vendido
            FROM detalle_ventas dv
            JOIN productos p ON dv.producto_id = p.id
            GROUP BY p.id, p.nombre, p.imagen_url
            ORDER BY total_vendido DESC
            LIMIT 4
        """)
        productos = cursor.fetchall()
        for p in productos:
            p['total_vendido'] = float(p['total_vendido'])
        return jsonify(productos)
    except Exception as e:
        print(f"ERROR en get_mas_vendidos: {e}")
        return jsonify([])
    finally:
        cursor.close()
        conn.close()

@app.route('/api/ventas/historial', methods=['GET'])
def get_historial():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    caja_id = request.args.get('caja_id')
    if caja_id:
        cursor.execute("SELECT id, fecha_hora, subtotal, impuestos, total, metodo_pago, caja_id FROM ventas WHERE caja_id = %s ORDER BY fecha_hora DESC LIMIT 50", (caja_id,))
    else:
        cursor.execute("SELECT id, fecha_hora, subtotal, impuestos, total, metodo_pago, caja_id FROM ventas ORDER BY fecha_hora DESC LIMIT 50")
    ventas = cursor.fetchall()
    for v in ventas:
        if v['fecha_hora']:
            v['fecha_hora'] = str(v['fecha_hora'])
        v['subtotal'] = float(v['subtotal'])
        v['impuestos'] = float(v['impuestos'])
        v['total'] = float(v['total'])
    cursor.close()
    conn.close()
    return jsonify(ventas)

@app.route('/api/ventas/<int:venta_id>', methods=['GET'])
def get_venta_detalle(venta_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB error'}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, fecha_hora, subtotal, impuestos, total, metodo_pago, caja_id FROM ventas WHERE id = %s", (venta_id,))
        venta = cursor.fetchone()
        if not venta:
            return jsonify({'error': 'Venta no encontrada'}), 404

        cursor.execute('''
            SELECT dv.cantidad, dv.precio_unitario, dv.total_linea, p.nombre AS producto_nombre, p.marca
            FROM detalle_ventas dv
            LEFT JOIN productos p ON dv.producto_id = p.id
            WHERE dv.venta_id = %s
        ''', (venta_id,))
        detalle = cursor.fetchall()

        for item in detalle:
            item['cantidad'] = float(item['cantidad'])
            item['precio_unitario'] = float(item['precio_unitario'])
            item['total_linea'] = float(item['total_linea'])

        if venta['fecha_hora']:
            venta['fecha_hora'] = str(venta['fecha_hora'])
        venta['subtotal'] = float(venta['subtotal'])
        venta['impuestos'] = float(venta['impuestos'])
        venta['total'] = float(venta['total'])

        return jsonify({'venta': venta, 'detalle': detalle})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ================= API FIADOS =======================

@app.route('/api/fiados', methods=['POST'])
def crear_fiado():
    data = request.json
    cliente_nombre = data.get('cliente_nombre', '').strip()
    cart = data.get('cart', [])
    total = data.get('total', 0)

    if not cliente_nombre:
        return jsonify({'error': 'Nombre del cliente es obligatorio'}), 400
    if not cart:
        return jsonify({'error': 'Debe haber productos en el fiado'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB error'}), 500

    try:
        cursor = conn.cursor()

        # Insertar cliente fiado
        cursor.execute("INSERT INTO clientes_fiados (nombre, total_pendiente) VALUES (%s, %s)", (cliente_nombre, total))
        cliente_id = cursor.lastrowid

        # Insertar detalle fiados y descontar stock
        for item in cart:
            cursor.execute("SELECT id FROM productos WHERE codigo_barras = %s", (item['codigo_barras'],))
            prod = cursor.fetchone()
            if prod:
                p_id = prod[0]
                total_linea = item['precio_unidad'] * item['cantidad']
                cursor.execute('''
                    INSERT INTO detalle_fiados (cliente_fiado_id, producto_id, cantidad, precio_unitario, total_linea)
                    VALUES (%s, %s, %s, %s, %s)
                ''', (cliente_id, p_id, item['cantidad'], item['precio_unidad'], total_linea))

                # Descontar stock
                cursor.execute("UPDATE productos SET stock = stock - %s WHERE id = %s", (item['cantidad'], p_id))

        conn.commit()
        return jsonify({'success': True, 'cliente_id': cliente_id})
    except Exception as e:
        print(f"ERROR en crear_fiado: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/fiados', methods=['GET'])
def get_fiados():
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB error'}), 500
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, nombre, total_pendiente, fecha_creacion FROM clientes_fiados WHERE total_pendiente > 0 ORDER BY fecha_creacion DESC")
    fiados = cursor.fetchall()
    for f in fiados:
        f['total_pendiente'] = float(f['total_pendiente'])
        f['fecha_creacion'] = str(f['fecha_creacion'])
    cursor.close()
    conn.close()
    return jsonify(fiados)

@app.route('/api/fiados/<int:cliente_id>', methods=['GET'])
def get_fiado_detalle(cliente_id):
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB error'}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        # Cliente
        cursor.execute("SELECT * FROM clientes_fiados WHERE id = %s", (cliente_id,))
        cliente = cursor.fetchone()
        if not cliente:
            return jsonify({'error': 'Cliente no encontrado'}), 404

        # Detalle
        cursor.execute('''
            SELECT df.*, p.nombre as producto_nombre, p.marca
            FROM detalle_fiados df
            JOIN productos p ON df.producto_id = p.id
            WHERE df.cliente_fiado_id = %s
            ORDER BY df.fecha DESC
        ''', (cliente_id,))
        detalle = cursor.fetchall()
        for d in detalle:
            d['cantidad'] = float(d['cantidad'])
            d['precio_unitario'] = float(d['precio_unitario'])
            d['total_linea'] = float(d['total_linea'])
            d['fecha'] = str(d['fecha'])

        cliente['total_pendiente'] = float(cliente['total_pendiente'])
        cliente['fecha_creacion'] = str(cliente['fecha_creacion'])

        return jsonify({'cliente': cliente, 'detalle': detalle})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/fiados/<int:cliente_id>/pagar', methods=['POST'])
def pagar_fiado(cliente_id):
    data = request.json
    monto_pagado = Decimal(str(data.get('monto_pagado', 0)))

    if monto_pagado <= Decimal('0'):
        return jsonify({'error': 'Monto inválido'}), 400

    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB error'}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT total_pendiente FROM clientes_fiados WHERE id = %s", (cliente_id,))
        cliente = cursor.fetchone()
        if not cliente:
            return jsonify({'error': 'Cliente no encontrado'}), 404

        total_pendiente = Decimal(str(cliente['total_pendiente']))
        nuevo_total = total_pendiente - monto_pagado
        if nuevo_total <= Decimal('0'):
            # Pago completo, eliminar
            cursor.execute("DELETE FROM clientes_fiados WHERE id = %s", (cliente_id,))
            # El detalle se elimina por CASCADE
            nuevo_total = Decimal('0')
        else:
            # Actualizar total
            cursor.execute("UPDATE clientes_fiados SET total_pendiente = %s WHERE id = %s", (nuevo_total, cliente_id))

        conn.commit()
        return jsonify({'success': True, 'nuevo_total': float(nuevo_total)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/dashboard', methods=['GET'])
def admin_dashboard():
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB error'}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        # Total hoy (Ventas reales sin importar aperturas)
        cursor.execute("SELECT SUM(total) as total_hoy, COUNT(id) as transacciones FROM ventas WHERE DATE(fecha_hora) = CURDATE()")
        hoy_data = cursor.fetchone()
        
        # Historial (aunque se oculte, para tener el dato)
        cursor.execute("SELECT SUM(total) as total_historico FROM ventas")
        hist_data = cursor.fetchone()
        
        return jsonify({
            'total_hoy': float(hoy_data['total_hoy']) if hoy_data['total_hoy'] else 0,
            'transacciones_hoy': hoy_data['transacciones'] if hoy_data['transacciones'] else 0,
            'total_historico': float(hist_data['total_historico']) if hist_data['total_historico'] else 0
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/contabilidad/calendario', methods=['GET'])
def get_contabilidad_calendario():
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB error'}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT 
                t_fechas.fecha,
                COALESCE(SUM(c.base_inicial), 0) as total_base,
                0 as total_ventas
            FROM (
                SELECT DISTINCT DATE(fecha_hora) as fecha FROM contabilidad_caja
                UNION
                SELECT DISTINCT DATE(fecha_hora) as fecha FROM ventas
            ) t_fechas
            LEFT JOIN contabilidad_caja c ON DATE(c.fecha_hora) = t_fechas.fecha
            GROUP BY t_fechas.fecha
            ORDER BY t_fechas.fecha DESC
            LIMIT 100
        """
        cursor.execute(query)
        resumen = cursor.fetchall()
        for r in resumen:
            r['fecha'] = str(r['fecha'])
            r['total_base'] = float(r['total_base'])
            # Calcular ventas para ese día
            cursor.execute("SELECT SUM(total) as suma FROM ventas WHERE DATE(fecha_hora) = %s", (r['fecha'],))
            v_data = cursor.fetchone()
            r['total_ventas'] = float(v_data['suma']) if v_data['suma'] else 0
        return jsonify(resumen)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/contabilidad/detalle-dia', methods=['GET'])
def get_contabilidad_dia():
    fecha = request.args.get('fecha')
    if not fecha: return jsonify({'error': 'Falta fecha'}), 400
    
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB error'}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        # Agrupamos por caja_id para ese día para no repetir filas
        query = """
            SELECT 
                t_ids.caja_id,
                DATE_FORMAT(t_c.hora_min, '%H:%i') as hora_apertura,
                COALESCE(t_c.base_max, 0) as base_inicial,
                COALESCE(t_v.total_dia, 0) as ventas_dia,
                ci.efectivo_contado,
                ci.diferencia
            FROM (
                SELECT DISTINCT caja_id FROM contabilidad_caja WHERE DATE(fecha_hora) = %s
                UNION
                SELECT DISTINCT caja_id FROM ventas WHERE DATE(fecha_hora) = %s
            ) t_ids
            LEFT JOIN (
                SELECT caja_id, MIN(fecha_hora) as hora_min, MAX(base_inicial) as base_max
                FROM contabilidad_caja 
                WHERE DATE(fecha_hora) = %s
                GROUP BY caja_id
            ) t_c ON t_c.caja_id = t_ids.caja_id
            LEFT JOIN (
                SELECT caja_id, SUM(total) as total_dia 
                FROM ventas 
                WHERE DATE(fecha_hora) = %s 
                GROUP BY caja_id
            ) t_v ON t_v.caja_id = t_ids.caja_id
            LEFT JOIN cierres_caja ci ON ci.id = (
                SELECT id FROM cierres_caja 
                WHERE caja_id = t_ids.caja_id AND DATE(fecha_hora) = %s 
                ORDER BY id DESC LIMIT 1
            )
            ORDER BY t_ids.caja_id ASC
        """
        cursor.execute(query, (fecha, fecha, fecha, fecha, fecha))
        registros = cursor.fetchall()
        for r in registros:
            r['hora_apertura'] = r['hora_apertura'] if r['hora_apertura'] else '--:--'
            r['base_inicial'] = float(r['base_inicial'])
            r['ventas_dia'] = float(r['ventas_dia'])
            r['total_teorico'] = r['base_inicial'] + r['ventas_dia']
            r['efectivo_contado'] = float(r['efectivo_contado']) if r['efectivo_contado'] is not None else None
            r['diferencia'] = float(r['diferencia']) if r['diferencia'] is not None else None
            
        return jsonify(registros)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/contabilidad', methods=['GET'])
def get_contabilidad():
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB error'}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        # Traer todas las aperturas de caja, con la suma de ventas de esa caja en ese día
        # Se asume que caja_id y la fecha coinciden para "ese día"
        query = """
            SELECT 
                c.id, 
                c.fecha_hora as fecha_apertura, 
                c.caja_id, 
                c.base_inicial,
                COALESCE(
                    (SELECT SUM(v.total) 
                     FROM ventas v 
                     WHERE v.caja_id = c.caja_id 
                     AND DATE(v.fecha_hora) = DATE(c.fecha_hora)
                    ), 0
                ) as ventas_dia,
                ci.efectivo_contado,
                ci.diferencia,
                ci.fecha_hora as fecha_cierre
            FROM contabilidad_caja c
            LEFT JOIN cierres_caja ci ON ci.caja_id = c.caja_id AND DATE(ci.fecha_hora) = DATE(c.fecha_hora)
            ORDER BY c.fecha_hora DESC
            LIMIT 100
        """
        cursor.execute(query)
        registros = cursor.fetchall()
        for r in registros:
            r['fecha_apertura'] = str(r['fecha_apertura'])
            r['base_inicial'] = float(r['base_inicial'])
            r['ventas_dia'] = float(r['ventas_dia'])
            r['total_teorico'] = r['base_inicial'] + r['ventas_dia']
            r['efectivo_contado'] = float(r['efectivo_contado']) if r['efectivo_contado'] is not None else None
            r['diferencia'] = float(r['diferencia']) if r['diferencia'] is not None else None
            r['fecha_cierre'] = str(r['fecha_cierre']) if r['fecha_cierre'] else None
            
        return jsonify(registros)
    except Exception as e:
        print(f"Error en contabilidad: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ================= AUTH & CONFIG =======================

# ================= CAJA & CONTABILIDAD =======================

@app.route('/api/caja/verificar-apertura', methods=['GET'])
def verificar_apertura():
    caja_id = request.args.get('caja_id')
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB error'}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        # Buscar si hay una apertura hoy para esta caja
        query = "SELECT * FROM contabilidad_caja WHERE caja_id = %s AND DATE(fecha_hora) = CURDATE() LIMIT 1"
        cursor.execute(query, (caja_id,))
        apertura = cursor.fetchone()
        return jsonify({'abierta': apertura is not None})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/caja/resumen', methods=['GET'])
def get_resumen_caja():
    caja_id = request.args.get('caja_id')
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB error'}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        # 1. Base inicial
        cursor.execute("SELECT base_inicial FROM contabilidad_caja WHERE caja_id = %s AND DATE(fecha_hora) = CURDATE() ORDER BY id DESC LIMIT 1", (caja_id,))
        base = cursor.fetchone()
        base_inicial = float(base['base_inicial']) if base else 0
        
        # 2. Ventas Efectivo hoy
        cursor.execute("SELECT SUM(total) as suma FROM ventas WHERE caja_id = %s AND metodo_pago = 'efectivo' AND DATE(fecha_hora) = CURDATE()", (caja_id,))
        v_efe = cursor.fetchone()
        efectivo_ventas = float(v_efe['suma']) if v_efe['suma'] else 0
        
        # 3. Ventas Transferencia hoy
        cursor.execute("SELECT SUM(total) as suma FROM ventas WHERE caja_id = %s AND metodo_pago = 'transferencia' AND DATE(fecha_hora) = CURDATE()", (caja_id,))
        v_tra = cursor.fetchone()
        transferencia_ventas = float(v_tra['suma']) if v_tra['suma'] else 0
        
        total_teorico = base_inicial + efectivo_ventas
        
        return jsonify({
            'base_inicial': base_inicial,
            'efectivo_ventas': efectivo_ventas,
            'transferencia_ventas': transferencia_ventas,
            'total_teorico_efectivo': total_teorico
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/caja/cierre', methods=['POST'])
def registrar_cierre():
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO cierres_caja (caja_id, base_inicial, efectivo_ventas, transferencia_ventas, total_teorico, efectivo_contado, diferencia)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', (
            data['caja_id'], data['base_inicial'], data['efectivo_ventas'], 
            data['transferencia_ventas'], data['total_teorico'], 
            data['efectivo_contado'], data['diferencia']
        ))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/caja/apertura', methods=['POST'])
def aperturar_caja():
    data = request.json
    caja_id = data.get('caja_id')
    base_inicial = data.get('base_inicial', 0)
    
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB error'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO contabilidad_caja (caja_id, base_inicial)
            VALUES (%s, %s)
        """, (caja_id, base_inicial))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error apertrura caja: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/tienda', methods=['GET'])
def get_tienda_config():
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB error'}), 500
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT nombre_supermercado, direccion, nit, num_cajeros, admin_nombre, admin_email FROM config_tienda LIMIT 1")
    tienda = cursor.fetchone()
    cursor.close()
    conn.close()
    if tienda:
        return jsonify({'registrada': True, 'tienda': tienda})
    return jsonify({'registrada': False})

@app.route('/api/setup', methods=['POST'])
def setup_tienda():
    data = request.json
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB error'}), 500
    cursor = conn.cursor()
    try:
        # Validaciones
        if not data.get('nit') or not str(data['nit']).isdigit():
            return jsonify({'error': 'El NIT debe contener solo números'}), 400
        if not data.get('contrasena') or len(data['contrasena']) < 6 or len(data['contrasena']) > 18:
            return jsonify({'error': 'La contraseña del supermercado debe tener entre 6 y 18 caracteres'}), 400
        if not data.get('admin_password') or len(data['admin_password']) < 6 or len(data['admin_password']) > 18:
            return jsonify({'error': 'La contraseña del administrador debe tener entre 6 y 18 caracteres'}), 400
        if not data.get('admin_user'):
            return jsonify({'error': 'El usuario del administrador es obligatorio'}), 400
        if not data.get('admin_nombre'):
            return jsonify({'error': 'El nombre completo del administrador es obligatorio'}), 400
        if not data.get('admin_email'):
            return jsonify({'error': 'El correo electrónico del administrador es obligatorio'}), 400

        # Validar que el usuario admin no exista YA en otro establecimiento
        cursor.execute("SELECT id FROM config_tienda WHERE admin_user = %s", (data['admin_user'],))
        if cursor.fetchone():
            return jsonify({'error': f'El usuario administrador "{data["admin_user"]}" ya existe en otro establecimiento'}), 400
        
        cursor.execute("SHOW COLUMNS FROM config_tienda LIKE 'nombre_dueno'")
        has_nombre_dueno = bool(cursor.fetchone())

        if has_nombre_dueno:
            cursor.execute("""
                INSERT INTO config_tienda (nombre_supermercado, direccion, nit, contrasena, num_cajeros, admin_nombre, admin_user, admin_password, admin_email, nombre_dueno)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (data['nombre'], data['direccion'], data['nit'], data['contrasena'], data['cajeros'], data['admin_nombre'], data['admin_user'], data['admin_password'], data['admin_email'], data['admin_nombre']))
        else:
            cursor.execute("""
                INSERT INTO config_tienda (nombre_supermercado, direccion, nit, contrasena, num_cajeros, admin_nombre, admin_user, admin_password, admin_email)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (data['nombre'], data['direccion'], data['nit'], data['contrasena'], data['cajeros'], data['admin_nombre'], data['admin_user'], data['admin_password'], data['admin_email']))

        tienda_id = cursor.lastrowid
        conn.commit()
        return jsonify({'success': True, 'tienda_id': tienda_id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/tienda/update', methods=['POST'])
def update_tienda():
    data = request.json
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB error'}), 500
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE config_tienda 
            SET nombre_supermercado=%s, direccion=%s, nit=%s, num_cajeros=%s, admin_nombre=%s
            WHERE id = 1
        """, (data['nombre'], data['direccion'], data['nit'], data['cajeros'], data['dueno']))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    rol = data.get('rol', 'cajero') # Default 'cajero' para compatibilidad
    
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB error'}), 500
    cursor = conn.cursor(dictionary=True)
    
    try:
        if rol == 'admin':
            admin_user = data.get('admin_user')
            admin_password = data.get('admin_password')
            cursor.execute("SELECT * FROM config_tienda WHERE admin_user = %s AND admin_password = %s", (admin_user, admin_password))
        else:
            nombre = data.get('nombre')
            password = data.get('password')
            cursor.execute("SELECT * FROM config_tienda WHERE LOWER(nombre_supermercado) = LOWER(%s) AND contrasena = %s", (nombre, password))
            
        tienda = cursor.fetchone()
        
        if tienda:
            return jsonify({'success': True, 'tienda': tienda, 'rol': rol})
        else:
            return jsonify({'success': False, 'message': 'Credenciales incorrectas'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    nombre_supermercado = data.get('nombre_supermercado', '').strip()
    email = data.get('email', '').strip()
    rol = data.get('rol', 'cajero')

    if not nombre_supermercado or not email:
        return jsonify({'success': False, 'message': 'Nombre y correo requeridos'}), 400

    if rol != 'admin':
        return jsonify({'success': False, 'message': 'Solo el administrador puede recuperar la contraseña'}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB error'}), 500
    cursor = conn.cursor(dictionary=True)

    try:
        # Validar que nombre y correo coincidan
        cursor.execute("SELECT admin_email FROM config_tienda WHERE nombre_supermercado = %s LIMIT 1", (nombre_supermercado,))
        tienda = cursor.fetchone()
        
        if not tienda:
            return jsonify({'success': False, 'message': 'Nombre de supermercado no encontrado'}), 404
        
        stored_admin_email = tienda['admin_email'].lower()
        if stored_admin_email != email.lower():
            return jsonify({'success': False, 'message': 'Correo no coincide con el registrado'}), 401

        # Generar código de 4 dígitos aleatorio
        previous_code = recovery_codes.get(email.lower())
        code = ''.join(secrets.choice('0123456789') for _ in range(4))
        while previous_code and code == previous_code:
            code = ''.join(secrets.choice('0123456789') for _ in range(4))
        recovery_codes[email.lower()] = code

        return jsonify({'success': True, 'message': 'Código generado', 'code': code})
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/verify-code', methods=['POST'])
def verify_code():
    data = request.json
    email = data.get('email')
    code = data.get('code')

    if not email or not code:
        return jsonify({'success': False, 'message': 'Correo y código requeridos'}), 400

    if recovery_codes.get(email.lower()) == code:
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': 'Código incorrecto'}), 400

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    email = data.get('email')
    code = data.get('code')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')
    rol = data.get('rol', 'cajero')

    if not all([email, code, new_password, confirm_password]):
        return jsonify({'success': False, 'message': 'Todos los campos requeridos'}), 400

    if new_password != confirm_password:
        return jsonify({'success': False, 'message': 'Las contraseñas no coinciden'}), 400

    if len(new_password) < 6 or len(new_password) > 18:
        return jsonify({'success': False, 'message': 'Contraseña debe tener 6-18 caracteres'}), 400

    if recovery_codes.get(email.lower()) != code:
        return jsonify({'success': False, 'message': 'Código incorrecto'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB error'}), 500
    cursor = conn.cursor()

    try:
        if rol != 'admin':
            return jsonify({'success': False, 'message': 'Solo el administrador puede cambiar la contraseña por este método'}), 403

        cursor.execute("UPDATE config_tienda SET admin_password = %s WHERE admin_email = %s", (new_password, email))
        conn.commit()

        # Limpiar código
        recovery_codes.pop(email.lower(), None)

        return jsonify({'success': True, 'message': 'Contraseña actualizada'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/negocio/update', methods=['POST'])
def update_negocio_admin():
    data = request.json
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'DB error'}), 500
    cursor = conn.cursor()
    try:
        nombre = data.get('nombre', '').strip()
        nit = data.get('nit', '').strip()
        cajeros = data.get('cajeros')
        contrasena = data.get('contrasena', '').strip()
        if not nombre or not nit or not str(nit).isdigit() or not cajeros:
            return jsonify({'success': False, 'message': 'Datos invalidos'}), 400
        if contrasena and (len(contrasena) < 6 or len(contrasena) > 18):
             return jsonify({'success': False, 'message': 'Contrasena: 6-18'}), 400
        query = "UPDATE config_tienda SET nombre_supermercado=%s, nit=%s, num_cajeros=%s"
        params = [nombre, nit, cajeros]
        if contrasena:
            query += ", contrasena=%s"
            params.append(contrasena)
        query += " WHERE id=1"
        cursor.execute(query, params)
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)