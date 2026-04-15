"""
Script para inicializar la base de datos en TiDB Cloud.
Este script se ejecuta automáticamente durante el deployment en Render.
"""
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def initialize_database():
    db_config = {
        'host': os.getenv('DB_HOST', '127.0.0.1'),
        'port': int(os.getenv('DB_PORT', 3307)),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'base_chauta')
    }
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        print("✓ Conexión exitosa a la base de datos")

        # Crear tabla de categorías
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS categorias (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) UNIQUE NOT NULL,
                imagen_url TEXT,
                tienda_id INT DEFAULT 1
            )
        ''')
        print("✓ Tabla 'categorias' creada/verificada")

        # Crear tabla de productos
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
        print("✓ Tabla 'productos' creada/verificada")

        # Crear tabla de ventas
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
        print("✓ Tabla 'ventas' creada/verificada")

        # Crear tabla de detalle de ventas
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
        print("✓ Tabla 'detalle_ventas' creada/verificada")

        # Crear tabla de configuración de tienda
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
                admin_password VARCHAR(255) NOT NULL
            )
        ''')
        print("✓ Tabla 'config_tienda' creada/verificada")

        conn.commit()
        print("\n✓✓✓ Base de datos inicializada correctamente ✓✓✓")
        cursor.close()
        conn.close()

    except Error as e:
        print(f"✗ Error inicializando base de datos: {e}")
        raise

if __name__ == "__main__":
    initialize_database()