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
    cols = [col[0] for col in cursor.fetchall()]
    print(f"COLUMNS: {cols}")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"ERROR: {e}")