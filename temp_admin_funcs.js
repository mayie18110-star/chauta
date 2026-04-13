
    // EDITAR NEGOCIO - FUNCIONES GLOBALES
    const formEditarNegocio = document.getElementById('form-editar-negocio');
    const modalEditarNegocio = document.getElementById('modal-editar-negocio');

    window.abrirModalEditarNegocio = async () => {
        try {
            const res = await fetch('/api/tienda');
            const data = await res.json();
            if (data.registrada && data.tienda) {
                document.getElementById('edit-nombre-negocio').value = data.tienda.nombre_supermercado || '';
                document.getElementById('edit-nit').value = data.tienda.nit || '';
                document.getElementById('edit-cajeros').value = data.tienda.num_cajeros || 1;
                document.getElementById('edit-password-cajero').value = '';
            }
        } catch (err) {
            console.error('Error cargando tienda:', err);
        }
        modalEditarNegocio.style.display = 'flex';
    };

    window.cerrarModalEditarNegocio = () => {
        modalEditarNegocio.style.display = 'none';
        formEditarNegocio.reset();
    };

    modalEditarNegocio.onclick = (e) => {
        if (e.target.id === 'modal-editar-negocio') {
            window.cerrarModalEditarNegocio();
        }
    };

    formEditarNegocio.onsubmit = async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('edit-nombre-negocio').value.trim();
        const nit = document.getElementById('edit-nit').value.trim();
        const cajeros = document.getElementById('edit-cajeros').value;
        const passwordCajero = document.getElementById('edit-password-cajero').value;

        if (!nombre) {
            alert('El nombre del negocio es obligatorio');
            return;
        }
        if (!nit || !/^\d+$/.test(nit)) {
            alert('El NIT debe contener solo numeros');
            return;
        }
        if (cajeros < 1) {
            alert('Debe tener al menos 1 cajero');
            return;
        }
        if (passwordCajero && (passwordCajero.length < 6 || passwordCajero.length > 18)) {
            alert('La contrasena debe tener entre 6 y 18 caracteres');
            return;
        }

        try {
            const payload = { nombre, nit, cajeros: parseInt(cajeros) };
            if (passwordCajero) payload.contrasena = passwordCajero;

            const res = await fetch('/api/admin/negocio/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (result.success) {
                alert('Negocio actualizado correctamente');
                window.cerrarModalEditarNegocio();
            } else {
                alert('Error: ' + (result.message || result.error || 'Error desconocido'));
            }
        } catch (err) {
            alert('Error de conexion: ' + err.message);
            console.error('Error:', err);
        }
    };
});
