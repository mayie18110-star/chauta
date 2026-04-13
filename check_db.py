import mysql.connector
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

db_config = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'port': int(os.getenv('DB_PORT', 3307)),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'Mariaf18'),
    'database': os.getenv('DB_NAME', 'base_chauta')
}

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    print("✓ Conexión exitosa a la base de datos")
    
    cursor.execute("DESCRIBE ventas")
    print("\nColumnas de ventas:")
    for row in cursor.fetchall():
        print(row)
        
    cursor.execute("DESCRIBE detalle_ventas")
    print("\nColumnas de detalle_ventas:")
    for row in cursor.fetchall():
        print(row)
        
    cursor.execute("SELECT * FROM ventas ORDER BY id DESC LIMIT 1")
    print("\nÚltima venta:", cursor.fetchone())
except Exception as e:
    print("✗ Error:", e)
    print(f"\nIntentó conectarse a:")
    print(f"  HOST: {db_config['host']}")
    print(f"  PORT: {db_config['port']}")
    print(f"  USER: {db_config['user']}")
    print(f"  DATABASE: {db_config['database']}")
finally:
    if 'cursor' in locals(): cursor.close()
    if 'conn' in locals() and conn.is_connected(): conn.close()