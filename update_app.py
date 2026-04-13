with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_endpoint = '''
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
            return jsonify({'success': False, 'message': 'Contrasena: 6-18 caracteres'}), 400

        if contrasena:
            cursor.execute("""
                UPDATE config_tienda 
                SET nombre_supermercado=%s, nit=%s, num_cajeros=%s, contrasena=%s 
                WHERE id=1
            """, (nombre, nit, cajeros, contrasena))
        else:
            cursor.execute("""
                UPDATE config_tienda 
                SET nombre_supermercado=%s, nit=%s, num_cajeros=%s 
                WHERE id=1
            """, (nombre, nit, cajeros))
        conn.commit()
        return jsonify({'success': True, 'message': 'Actualizado'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

'''

content = content.replace("if __name__ == '__main__':", new_endpoint + "\nif __name__ == '__main__':")

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('Endpoint agregado')
