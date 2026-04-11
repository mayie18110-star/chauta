import mysql.connector

db_config = {
    'host': '127.0.0.1',
    'port': 3307,
    'user': 'root',
    'password': 'Mariaf18',
    'database': 'base_chauta'
}

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    cursor.execute("DESCRIBE ventas")
    print("Columnas de ventas:")
    for row in cursor.fetchall():
        print(row)
        
    cursor.execute("DESCRIBE detalle_ventas")
    print("\nColumnas de detalle_ventas:")
    for row in cursor.fetchall():
        print(row)
        
    cursor.execute("SELECT * FROM ventas ORDER BY id DESC LIMIT 1")
    print("\nÚltima venta:", cursor.fetchone())
except Exception as e:
    print("Error:", e)
finally:
    if 'cursor' in locals(): cursor.close()
    if 'conn' in locals() and conn.is_connected(): conn.close()
