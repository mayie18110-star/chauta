document.addEventListener('DOMContentLoaded', () => {
    // Referencias a Tabs
    const navBtns = document.querySelectorAll('.admin-nav-btn');
    const tabSections = document.querySelectorAll('.tab-section');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            tabSections.forEach(s => s.classList.remove('active'));

            btn.classList.add('active');
            const target = btn.getAttribute('data-target');
            document.getElementById(target).classList.add('active');

            if (target === 'tab-dashboard') {
                cargarDashboard();
            } else if (target === 'tab-contabilidad') {
                cargarContabilidad();
            } else if (target === 'tab-productos') {
                cargarCategoriasSelect();
                cargarProductos();
            } else if (target === 'tab-categorias') {
                cargarCategorias();
            } else if (target === 'tab-ventas') {
                cargarVentas();
            } else if (target === 'tab-fiados') {
                cargarFiados();
            }
        });
    });

    /* =========================================
       DASHBOARD
    ========================================= */
    async function cargarDashboard() {
        try {
            const response = await fetch('/api/admin/dashboard');
            if (response.ok) {
                const data = await response.json();
                document.getElementById('dash-total-hoy').innerText = `$${Math.round(data.total_hoy).toLocaleString()}`;
                document.getElementById('dash-trans-hoy').innerText = data.transacciones_hoy;
            } else {
                console.error("Error al cargar dashboard", await response.text());
                document.getElementById('dash-total-hoy').innerText = 'Error';
            }
        } catch (err) {
            console.error("Error de conexión:", err);
            document.getElementById('dash-total-hoy').innerText = 'Error';
        }
    }

    // VOZ PARA TOTAL VENTAS
    document.getElementById('card-ventas-hoy').onclick = () => {
        const total = document.getElementById('dash-total-hoy').innerText;
        if (total === 'Cargando...' || total === 'Error') return;
        const msg = new SpeechSynthesisUtterance(`El producido total de hoy es de ${total.replace('$', '').replace(/\./g, '')} pesos`);
        msg.lang = 'es-ES';
        window.speechSynthesis.speak(msg);
    };



    /* =========================================
       CONTABILIDAD (VISTA CALENDARIO)
    ========================================= */
    let calendarDate = new Date();
    let contabilidadResumen = [];

    async function cargarContabilidad() {
        // Al cargar la pestaña, inicializamos el calendario
        renderCalendario();
    }

    async function fetchResumenMensual() {
        try {
            const res = await fetch('/api/admin/contabilidad/calendario');
            contabilidadResumen = await res.json();
        } catch (err) {
            console.error("Error cargando resumen calendario:", err);
        }
    }

    async function renderCalendario() {
        await fetchResumenMensual();
        
        const grid = document.getElementById('calendar-grid');
        const monthYearLabel = document.getElementById('calendar-month-year');
        
        // Limpiar días previos (mantener encabezados)
        const headers = grid.querySelectorAll('div[style*="font-weight: 800"]');
        grid.innerHTML = '';
        headers.forEach(h => grid.appendChild(h));

        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        monthYearLabel.innerText = `${monthNames[month]} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Relleno días mes anterior
        for (let i = 0; i < firstDay; i++) {
            grid.appendChild(document.createElement('div'));
        }

        // Días del mes actual
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Buscar si este día tiene ventas
            const resumenDia = contabilidadResumen.find(r => r.fecha === fechaStr);
            
            dayEl.style.padding = "15px 10px";
            dayEl.style.borderRadius = "12px";
            dayEl.style.cursor = "pointer";
            dayEl.style.transition = "all 0.2s";
            dayEl.style.position = "relative";
            dayEl.style.minHeight = "70px";
            dayEl.style.border = "1px solid #edf2f7";

            dayEl.innerHTML = `<span style="font-weight:700; font-size: 22px; display:block; margin-bottom: 2px;">${day}</span>`;
            
            if (resumenDia) {
                dayEl.style.background = "#ebf8ff";
                dayEl.style.border = "1px solid #bee3f8";
                const vtasK = (resumenDia.total_ventas / 1000).toFixed(1);
                dayEl.innerHTML += `<span style="font-size: 15px; font-weight: 800; color: #2b6cb0; display:block;">$${vtasK}k</span>`;
                
                // Indicador de alerta si hubo faltantes significativos (Opcional)
                dayEl.classList.add('has-data');
            }

            // Hover effects
            dayEl.onmouseover = () => { dayEl.style.background = "#f7fafc"; dayEl.style.borderColor = "#cbd5e0"; };
            dayEl.onmouseout = () => { 
                dayEl.style.background = resumenDia ? "#ebf8ff" : "transparent"; 
                dayEl.style.borderColor = resumenDia ? "#bee3f8" : "transparent";
            };

            dayEl.onclick = () => cargarDetalleDia(fechaStr, dayEl);
            grid.appendChild(dayEl);
        }
    }

    async function cargarDetalleDia(fechaStr, element) {
        // UI feedback
        document.querySelectorAll('#calendar-grid div').forEach(d => d.style.boxShadow = "none");
        if (element) element.style.boxShadow = "0 0 0 3px var(--color-primary) inset";

        try {
            const res = await fetch(`/api/admin/contabilidad/detalle-dia?fecha=${fechaStr}`);
            const data = await res.json();
            
            document.getElementById('detail-welcome').style.display = 'none';
            const content = document.getElementById('detail-content');
            content.style.display = 'block';

            // Título y totales
            const [y, m, d] = fechaStr.split('-');
            const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            document.getElementById('detail-date-title').innerText = `Ventas del ${d} ${monthNames[parseInt(m)-1]} ${y}`;

            let tBase = 0;
            let tVentas = 0;

            const tbody = document.getElementById('lista-contabilidad');
            if (!tbody) {
                console.error("Error: Elemento 'lista-contabilidad' no encontrado.");
                return;
            }
            tbody.innerHTML = '';
            
            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #a0aec0;">No hay actividad registrada</td></tr>';
            } else {
                data.forEach(item => {
                    const b = parseFloat(item.base_inicial) || 0;
                    const v = parseFloat(item.ventas_dia) || 0;
                    tBase += b;
                    tVentas += v;

                    const tr = document.createElement('tr');
                    tr.style.borderBottom = "1px solid #edf2f7";
                    
                    const hora = item.hora_apertura || '--:--';
                    const contado = item.efectivo_contado !== null ? `$${Math.round(item.efectivo_contado).toLocaleString()}` : '<small style="color:#a0aec0">Pendiente</small>';
                    const diff = item.diferencia !== null ? Math.round(item.diferencia) : null;
                    
                    let diffHtml = '<span style="color:#a0aec0">-</span>';
                    if (diff !== null) {
                        if (diff === 0) diffHtml = '<b style="color:#38a169;">OK</b>';
                        else if (diff > 0) diffHtml = `<b style="color:#3182ce;">+$${diff.toLocaleString()}</b>`;
                        else diffHtml = `<b style="color:#e53e3e;">-$${Math.abs(diff).toLocaleString()}</b>`;
                    }

                    tr.innerHTML = `
                        <td style="padding: 12px; font-size: 18px;">${hora}</td>
                        <td style="padding: 12px; font-weight: 700; font-size: 18px;">Caja ${item.caja_id}</td>
                        <td style="padding: 12px; text-align: right; font-weight:700; font-size: 18px;">$${Math.round(b).toLocaleString()}</td>
                        <td style="padding: 12px; text-align: right; font-weight:700; color:#2b6cb0; font-size: 18px;">$${Math.round(v).toLocaleString()}</td>
                        <td style="padding: 12px; text-align: right; font-size: 18px;">${contado}</td>
                        <td style="padding: 12px; text-align: right; font-size: 20px;">${diffHtml}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }

            document.getElementById('detail-total-base').innerText = `$${Math.round(tBase).toLocaleString()}`;
            document.getElementById('detail-total-ventas').innerText = `$${Math.round(tVentas).toLocaleString()}`;

        } catch (err) {
            console.error("Error cargando detalle:", err);
        }
    }

    // Navegación meses
    document.getElementById('btn-prev-month').onclick = () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendario();
    };
    document.getElementById('btn-next-month').onclick = () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendario();
    };

    /* =========================================
       CATEGORÍAS
    ========================================= */
    const formCategoria = document.getElementById('form-categoria');
    const listaCategorias = document.getElementById('lista-categorias');
    const selectCategoria = document.getElementById('prod-categoria');
    const catIdInput = document.getElementById('cat-id');
    const btnSubmitCat = document.getElementById('btn-submit-categoria');
    const btnCancelCat = document.getElementById('btn-cancelar-cat');

    async function cargarCategorias() {
        const response = await fetch('/api/categorias');
        const categorias = await response.json();

        listaCategorias.innerHTML = '';
        categorias.forEach(cat => {
            const imgHtml = cat.imagen_url ? 
                `<img src="${cat.imagen_url}" style="width: 40px; height: 40px; object-fit: contain; margin-right: 15px; border-radius: 4px;">` : 
                '<span style="margin-right: 15px; font-size: 24px;">🏷️</span>';

            const div = document.createElement('div');
            div.style.cssText = 'background: white; padding: 10px 20px; border-radius: 12px; border: 2px solid #e2e8f0; display: flex; align-items: center; font-weight: 700; font-size: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: transform 0.2s; position: relative; min-width: 200px;';
            div.innerHTML = `
                ${imgHtml}
                <span style="flex-grow: 1;">${cat.nombre}</span>
                <div style="display: flex; gap: 5px; margin-left: 10px;">
                    <button class="btn-edit-cat" title="Editar" style="background:none; border:none; cursor:pointer; font-size:18px;">✏️</button>
                    <button class="btn-delete-cat" title="Eliminar" style="background:none; border:none; cursor:pointer; font-size:18px;">🗑️</button>
                </div>
            `;

            // Eventos
            div.querySelector('.btn-edit-cat').onclick = () => prepararEdicionCategoria(cat);
            div.querySelector('.btn-delete-cat').onclick = () => eliminarCategoria(cat.id, cat.nombre);

            listaCategorias.appendChild(div);
        });
    }

    function prepararEdicionCategoria(cat) {
        catIdInput.value = cat.id;
        document.getElementById('cat-nombre').value = cat.nombre;
        btnSubmitCat.textContent = '💾 Guardar Cambios';
        btnSubmitCat.style.background = 'var(--color-primary)';
        btnCancelCat.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    btnCancelCat.onclick = () => resetFormularioCategoria();

    function resetFormularioCategoria() {
        formCategoria.reset();
        catIdInput.value = '';
        btnSubmitCat.textContent = '➕ Crear Categoría';
        btnSubmitCat.style.background = 'var(--color-success)';
        btnCancelCat.style.display = 'none';
    }

    async function eliminarCategoria(id, nombre) {
        if (confirm(`¿Estás seguro de eliminar la categoría "${nombre}"?\nLos productos asociados quedarán "Sin categoría".`)) {
            const res = await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert('✅ Categoría eliminada');
                cargarCategorias();
                cargarCategoriasSelect(); // Refrescar el select de productos
            } else {
                alert('❌ Error al eliminar');
            }
        }
    }

    async function cargarCategoriasSelect() {
        const response = await fetch('/api/categorias');
        const categorias = await response.json();

        selectCategoria.innerHTML = '<option value="">Seleccione Categoría</option>';
        categorias.forEach(cat => {
            selectCategoria.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
        });
    }

    formCategoria.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombreInput = document.getElementById('cat-nombre');
        const fileInput = document.getElementById('cat-img-file');

        const formData = new FormData();
        if (catIdInput.value) {
            formData.append('id', catIdInput.value);
        }
        formData.append('nombre', nombreInput.value.trim());
        if (fileInput.files.length > 0) {
            formData.append('imagen_file', fileInput.files[0]);
        }

        const response = await fetch('/api/categorias', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const esEdicion = catIdInput.value !== '';
            resetFormularioCategoria();
            alert(esEdicion ? '✅ Categoría actualizada' : '✅ Categoría creada exitosamente');
            cargarCategorias();
            cargarCategoriasSelect(); // Refrescar el select de productos
        } else {
            alert('❌ Error al procesar categoría');
        }
    });

    /* =========================================
       PRODUCTOS E INVENTARIO
    ========================================= */
    const formProducto = document.getElementById('form-producto');
    const listaProductos = document.getElementById('lista-productos');
    const prodIdInput = document.getElementById('prod-id');
    const btnSubmitProd = document.getElementById('btn-submit-producto');
    const btnCancelEdicion = document.getElementById('btn-cancelar-edicion');


    // --- Vista previa de imagen al seleccionar archivo ---
    const inputImgFile = document.getElementById('prod-img-file');
    const previewImg = document.getElementById('img-preview');

    if (inputImgFile) {
        inputImgFile.addEventListener('change', () => {
            const file = inputImgFile.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    previewImg.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    async function cargarProductos() {
        const response = await fetch('/api/productos');
        const productos = await response.json();

        listaProductos.innerHTML = '';
        productos.forEach(prod => {
            const imgSrc = prod.imagen_url && prod.imagen_url !== ''
                ? prod.imagen_url
                : null;

            const row = document.createElement('tr');
            row.style.background = prod.stock <= 10 ? '#fff5f5' : 'white';
            const catNom = (prod.categoria_nombre || '').toLowerCase();
            const esPesado = catNom.includes('fruta') || catNom.includes('verdura') || catNom.includes('carne') || catNom.includes('pesaje');
            const stockDisplay = esPesado ? parseFloat(prod.stock).toFixed(3) : parseInt(prod.stock);

            const imgHtml = imgSrc ? 
                `<img src="${imgSrc}" alt="${prod.nombre}" style="width:50px;height:50px;object-fit:cover;border-radius:8px;border:1px solid #ccc;">` :
                `<div style="width:50px;height:50px;background:#f7fafc;border:1px dashed #cbd5e0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#a0aec0;font-weight:700;">SIN FOTO</div>`;

            row.innerHTML = `
                <td>${imgHtml}</td>
                <td><strong>${prod.codigo_barras}</strong></td>
                <td>${prod.nombre}<br><small style="color:#4a5568;">${prod.marca}</small></td>
                <td>$${Math.round(prod.precio_unidad).toLocaleString()} / ${prod.unidad}</td>
                <td>
                    <span style="font-size:24px;font-weight:bold;color:${parseFloat(prod.stock) <= 2 ? 'red' : 'green'};">
                        ${stockDisplay}
                    </span>
                </td>
                <td>${prod.categoria_nombre || 'Sin categoría'}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-edit-prod" title="Editar" style="background:#3182ce; color:white; border:none; padding:8px 12px; border-radius:5px; cursor:pointer; font-size:18px;">✏️</button>
                        <button class="btn-delete-prod" title="Eliminar" style="background:#e53e3e; color:white; border:none; padding:8px 12px; border-radius:5px; cursor:pointer; font-size:18px;">🗑️</button>
                    </div>
                </td>
            `;

            // Eventos de botones
            row.querySelector('.btn-edit-prod').onclick = () => prepararEdicion(prod);
            row.querySelector('.btn-delete-prod').onclick = () => eliminarProducto(prod.id, prod.nombre);

            listaProductos.appendChild(row);
        });
    }

    function prepararEdicion(prod) {
        prodIdInput.value = prod.id;
        document.getElementById('prod-codigo').value = prod.codigo_barras;
        document.getElementById('prod-nombre').value = prod.nombre;
        document.getElementById('prod-marca').value = prod.marca;
        document.getElementById('prod-precio').value = prod.precio_unidad;
        document.getElementById('prod-stock').value = prod.stock;
        selectCategoria.value = prod.categoria_id || '';
        
        if (prod.imagen_url) {
            previewImg.src = prod.imagen_url;
            previewImg.style.display = 'block';
        }

        btnSubmitProd.textContent = '💾 GUARDAR CAMBIOS';
        btnSubmitProd.style.background = 'var(--color-primary)';
        btnCancelEdicion.style.display = 'block';
        
        // Scroll al formulario
        document.getElementById('tab-productos').scrollIntoView({ behavior: 'smooth' });
    }

    btnCancelEdicion.onclick = () => resetFormulario();

    function resetFormulario() {
        formProducto.reset();
        prodIdInput.value = '';
        btnSubmitProd.textContent = '➕ Guardar Producto';
        btnSubmitProd.style.background = 'var(--color-success)';
        btnCancelEdicion.style.display = 'none';
        previewImg.style.display = 'none';
        previewImg.src = '';
    }

    async function eliminarProducto(id, nombre) {
        if (confirm(`¿Estás seguro de eliminar PERMANENTEMENTE el producto "${nombre}"?\nEsta acción no se puede deshacer.`)) {
            try {
                const response = await fetch(`/api/productos/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    alert('Producto eliminado correctamente.');
                    cargarProductos();
                } else {
                    alert('Error al eliminar el producto.');
                }
            } catch (err) {
                alert('Error de conexión.');
            }
        }
    }

    // --- Envío del formulario usando FormData para soportar archivos ---
    formProducto.addEventListener('submit', async (e) => {
        e.preventDefault();

        // ── Leer y validar campos obligatorios antes de enviar ──
        const codigoBarras = document.getElementById('prod-codigo').value.trim();
        const nombre       = document.getElementById('prod-nombre').value.trim();
        const marca        = document.getElementById('prod-marca').value.trim();
        const precio       = document.getElementById('prod-precio').value.trim();

        if (!codigoBarras) { alert('⚠️ El Código de Barras es obligatorio.'); document.getElementById('prod-codigo').focus(); return; }
        if (!nombre)       { alert('⚠️ El Nombre del producto es obligatorio.'); document.getElementById('prod-nombre').focus(); return; }
        if (!marca)        { alert('⚠️ La Marca es obligatoria.'); document.getElementById('prod-marca').focus(); return; }
        if (!precio)       { alert('⚠️ El Precio es obligatorio.'); document.getElementById('prod-precio').focus(); return; }

        const formData = new FormData();
        if (prodIdInput.value) {
            formData.append('id', prodIdInput.value);
        }
        formData.append('codigo_barras', codigoBarras);
        formData.append('nombre',        nombre);
        formData.append('marca',         marca);
        formData.append('precio_unidad', precio);

        const unidadEl = document.getElementById('prod-unidad');
        formData.append('unidad', unidadEl ? unidadEl.value : 'un');
        formData.append('stock',        document.getElementById('prod-stock').value || '0');
        formData.append('categoria_id', selectCategoria.value || '');

        // Imagen: primero archivo subido, luego URL manual
        const fileInput = document.getElementById('prod-img-file');
        if (fileInput && fileInput.files.length > 0) {
            formData.append('imagen_file', fileInput.files[0]);
        } else {
            const manualUrl = document.getElementById('prod-img');
            if (manualUrl) {
                formData.append('imagen_url_manual', manualUrl.value.trim());
            }
        }

        // Log de diagnóstico — visible en la consola del navegador (F12)
        console.log('📤 Enviando producto al servidor...');
        console.log('  codigo_barras:', codigoBarras);
        console.log('  nombre:', nombre);
        console.log('  marca:', marca);
        console.log('  precio_unidad:', precio);

        // Deshabilitar botón para evitar doble envío
        const btnSubmit = formProducto.querySelector('button[type="submit"]');
        const textoOriginal = btnSubmit.textContent;
        btnSubmit.disabled = true;
        btnSubmit.textContent = '⏳ Guardando...';

        try {
            const response = await fetch('/api/productos', {
                method: 'POST',
                // NO incluir Content-Type — el navegador lo agrega con el boundary correcto
                body: formData
            });

            const result = await response.json();
            console.log('📥 Respuesta del servidor:', response.status, result);

            if (response.ok && result.success) {
                resetFormulario();
                alert(prodIdInput.value ? '✅ Cambios guardados correctamente.' : '✅ Producto guardado correctamente.');
                cargarProductos();
            } else {
                // Mostrar el error EXACTO que devuelve el servidor
                const mensajeError = result.error || `HTTP ${response.status} - Error desconocido`;
                alert('❌ Error al guardar el producto:\n' + mensajeError);
                console.error('❌ Error del servidor:', result);
            }
        } catch (err) {
            alert('❌ Error de red o conexión: ' + err.message);
            console.error('❌ Error de fetch:', err);
        } finally {
            // Siempre rehabilitar el botón
            btnSubmit.disabled = false;
            btnSubmit.textContent = textoOriginal;
        }
    });

    /* =========================================
       VENTAS
    ========================================= */
    const listaVentas = document.getElementById('lista-ventas');

    async function cargarVentas() {
        const response = await fetch('/api/ventas/historial');
        const ventas = await response.json();

        listaVentas.innerHTML = '';
        ventas.forEach(v => {
            const mLabel = v.metodo_pago === 'transferencia' ? 'Transferencia' : 'Efectivo';
            listaVentas.innerHTML += `
                <tr style="border-bottom: 1px solid #edf2f7;">
                    <td style="padding: 15px 12px; font-size: 20px;"><span style="background:#e2e8f0;padding:5px 15px;border-radius:5px;font-weight:700;">#${v.id}</span></td>
                    <td style="padding: 15px 12px; font-size: 20px;">${new Date(v.fecha_hora).toLocaleString('es-ES')}</td>
                    <td style="padding: 15px 12px; font-size: 22px; font-weight:800; color:var(--color-success);">$${Math.round(v.total).toLocaleString()}</td>
                    <td style="padding: 15px 12px; font-size: 20px; font-weight:800;">${mLabel}</td>
                    <td style="padding: 15px 12px;"><button class="btn-action" style="font-size:16px; padding:8px 12px;" onclick="verDetalleVenta(${v.id})">Ver Detalle</button></td>
                </tr>
            `;
        });
    }

    function mostrarDetalleVenta(data) {
        const emptyPanel = document.getElementById('venta-detalle-empty');
        const contentPanel = document.getElementById('venta-detalle-content');
        const titulo = document.getElementById('venta-detalle-titulo');
        const meta = document.getElementById('venta-detalle-meta');
        const itemsContainer = document.getElementById('venta-detalle-items');
        const subtotal = document.getElementById('venta-detalle-subtotal');
        const impuestos = document.getElementById('venta-detalle-impuestos');
        const total = document.getElementById('venta-detalle-total');

        emptyPanel.style.display = 'none';
        contentPanel.style.display = 'block';
        itemsContainer.innerHTML = '';

        titulo.innerText = `Venta #${data.venta.id}`;
        meta.innerText = `Fecha: ${new Date(data.venta.fecha_hora).toLocaleString('es-ES')} · Caja ${data.venta.caja_id} · Método: ${data.venta.metodo_pago}`;

        if (!data.detalle.length) {
            itemsContainer.innerHTML = '<div style="padding: 18px; border-radius: 12px; background: #f7fafc; border: 1px solid #e2e8f0; color: #718096;">No hay productos detallados para esta venta.</div>';
        } else {
            data.detalle.forEach(item => {
                const card = document.createElement('div');
                card.style.cssText = 'background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px;';
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: 700; color: #2d3748;">${item.producto_nombre} ${item.marca ? `(${item.marca})` : ''}</span>
                        <span style="font-weight: 700; color: #2b6cb0;">$${Math.round(item.total_linea).toLocaleString()}</span>
                    </div>
                    <p style="margin: 0; color: #4a5568; font-size: 15px;">${item.cantidad} × $${Math.round(item.precio_unitario).toLocaleString()}</p>
                `;
                itemsContainer.appendChild(card);
            });
        }

        subtotal.innerText = `Subtotal: $${Math.round(data.venta.subtotal).toLocaleString()}`;
        impuestos.innerText = `Impuestos: $${Math.round(data.venta.impuestos).toLocaleString()}`;
        total.innerText = `Total: $${Math.round(data.venta.total).toLocaleString()}`;
    }

    window.verDetalleVenta = async (id) => {
        try {
            const response = await fetch(`/api/ventas/${id}`);
            if (response.ok) {
                const data = await response.json();
                mostrarDetalleVenta(data);
            }
        } catch (err) {
            console.error('Error al cargar detalle de venta:', err);
        }
    };

    /* =========================================
       FIADOS
    ========================================= */
    async function cargarFiados() {
        try {
            const response = await fetch('/api/fiados');
            if (response.ok) {
                const fiados = await response.json();
                const tbody = document.getElementById('lista-fiados');
                tbody.innerHTML = '';
                fiados.forEach(f => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${f.nombre}</td>
                        <td>$${Math.round(f.total_pendiente).toLocaleString()}</td>
                        <td>${new Date(f.fecha_creacion).toLocaleDateString('es-ES')}</td>
                        <td><button class="btn-action" style="font-size:16px; padding:8px 12px;" onclick="verDetalleFiado(${f.id})">Ver Detalle</button></td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                console.error("Error al cargar fiados");
            }
        } catch (err) {
            console.error("Error de conexión:", err);
        }
    }

    function mostrarDetalleFiado(data) {
        const emptyPanel = document.getElementById('fiado-detalle-empty');
        const contentPanel = document.getElementById('fiado-detalle-content');
        const titulo = document.getElementById('fiado-detalle-titulo');
        const saldo = document.getElementById('fiado-detalle-saldo');
        const itemsContainer = document.getElementById('fiado-detalle-items');
        const meta = document.getElementById('fiado-detalle-meta');

        emptyPanel.style.display = 'none';
        contentPanel.style.display = 'block';

        titulo.innerText = `${data.cliente.nombre}`;
        saldo.innerText = `Saldo pendiente: $${Math.round(data.cliente.total_pendiente).toLocaleString()}`;
        itemsContainer.innerHTML = '';

        if (!data.detalle || data.detalle.length === 0) {
            itemsContainer.innerHTML = '<div style="padding: 18px; border-radius: 12px; background: #f7fafc; border: 1px solid #e2e8f0; color: #718096;">No hay productos registrados en este fiado.</div>';
        } else {
            data.detalle.forEach(d => {
                const item = document.createElement('div');
                item.style.cssText = 'background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px;';
                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 6px;">
                        <span style="font-weight: 700; color: #2d3748;">${d.producto_nombre} (${d.marca})</span>
                        <span style="font-weight: 700; color: #2b6cb0;">$${Math.round(d.total_linea).toLocaleString()}</span>
                    </div>
                    <p style="margin: 0; color: #4a5568; font-size: 15px;">${d.cantidad} unidad${d.cantidad === 1 ? '' : 'es'} × $${Math.round(d.precio_unitario).toLocaleString()}</p>
                `;
                itemsContainer.appendChild(item);
            });
        }

        meta.innerText = `Creado el ${new Date(data.cliente.fecha_creacion).toLocaleDateString('es-ES')}.`;
    }

    window.verDetalleFiado = async (id) => {
        try {
            const response = await fetch(`/api/fiados/${id}`);
            if (response.ok) {
                const data = await response.json();
                mostrarDetalleFiado(data);
            }
        } catch (err) {
            console.error("Error al cargar detalle:", err);
        }
    };

    // Inicializar primer tab
    cargarDashboard();
    // EDITAR NEGOCIO MODAL
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
            console.error('Error:', err);
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

        if (!nombre || !nit || !/^\d+$/.test(nit) || cajeros < 1) {
            alert('Por favor, completa todos los campos correctamente');
            return;
        }
        if (passwordCajero && (passwordCajero.length < 6 || passwordCajero.length > 18)) {
            alert('La contrasena debe tener entre 6 y 18 caracteres');
            return;
        }

        try {
            const payload = {nombre, nit, cajeros: parseInt(cajeros)};
            if (passwordCajero) payload.contrasena = passwordCajero;

            const res = await fetch('/api/admin/negocio/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (result.success) {
                alert('Negocio actualizado');
                window.cerrarModalEditarNegocio();
            } else {
                alert('Error: ' + (result.message || 'desconocido'));
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

});

