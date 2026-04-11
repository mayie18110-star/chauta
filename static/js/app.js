document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const barcodeInput = document.getElementById('barcode-input');
    const cartContainer = document.getElementById('cart-items-container');
    const grandTotalEl = document.getElementById('grand-total');
    const subtotalEl = document.getElementById('subtotal-val');
    const taxesEl = document.getElementById('taxes-val');
    const btnImprimir = document.getElementById('btn-imprimir');
    const btnCobrar = document.getElementById('btn-cobrar');
    const btnAnular = document.getElementById('btn-anular-venta');

    const categoriesList = document.getElementById('categories-list');
    const vCategorias = document.getElementById('v-categorias');
    const vProductos = document.getElementById('v-productos');
    const catSearchInput = document.getElementById('cat-search-input');
    const btnVolverCat = document.getElementById('btn-volver-cat');
    const productsByCatGrid = document.getElementById('products-by-cat-grid');
    const catSelectedTitle = document.getElementById('cat-selected-title');

    // Referencias para resultados de búsqueda (Necesarias para evitar errores de JS)
    const resultsOverlay = document.getElementById('search-results-overlay');
    const resultsList = document.getElementById('results-list');
    const btnCloseResults = document.getElementById('close-results');

    // Elementos del MODAL DE PAGO
    const modalPago = document.getElementById('modal-pago');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');
    const btnPMEfectivo = document.getElementById('btn-pm-efectivo');
    const btnPMTransfer = document.getElementById('btn-pm-transfer');
    const secEfectivo = document.getElementById('sec-efectivo');
    const secTransferencia = document.getElementById('sec-transferencia');
    const inputPagoRecibido = document.getElementById('pago-recibido');
    const cambioVal = document.getElementById('cambio-val');
    const qrImg = document.getElementById('qr-img');
    const btnFinalizarSolo = document.getElementById('btn-finalizar-solo');
    const btnFinalizarFactura = document.getElementById('btn-finalizar-factura');

    // Elementos de FIADOS
    const btnFiado = document.getElementById('btn-fiado');
    const btnConsultarFiado = document.getElementById('btn-consultar-fiado');
    const modalFiado = document.getElementById('modal-fiado');
    const btnCerrarModalFiado = document.getElementById('btn-cerrar-modal-fiado');
    const clienteFiadoNombre = document.getElementById('cliente-fiado-nombre');
    const totalFiadoModal = document.getElementById('total-fiado-modal');
    const btnConfirmarFiado = document.getElementById('btn-confirmar-fiado');
    const modalConsultarFiado = document.getElementById('modal-consultar-fiado');
    const btnCerrarConsultarFiado = document.getElementById('btn-cerrar-consultar-fiado');
    const buscarClienteFiado = document.getElementById('buscar-cliente-fiado');
    const btnBuscarFiado = document.getElementById('btn-buscar-fiado');
    const clientesFiadosList = document.getElementById('clientes-fiados-list');
    const infoClienteFiado = document.getElementById('info-cliente-fiado');
    const nombreClienteFiado = document.getElementById('nombre-cliente-fiado');
    const deudaClienteFiado = document.getElementById('deuda-cliente-fiado');
    const montoPagarFiado = document.getElementById('monto-pagar-fiado');
    const btnPagarFiado = document.getElementById('btn-pagar-fiado');
    const btnHistorialVentas = document.getElementById('btn-historial-ventas');
    const modalHistorialVentas = document.getElementById('modal-historial-ventas');
    const btnCerrarHistorialVentas = document.getElementById('btn-cerrar-historial-ventas');
    const btnBackHistorialVentas = document.getElementById('btn-back-historial-ventas');
    const listaHistorialVentas = document.getElementById('lista-historial-ventas');
    const ventaHistorialDetalleEmpty = document.getElementById('venta-historial-detalle-empty');
    const ventaHistorialDetalleContent = document.getElementById('venta-historial-detalle-content');
    const ventaHistorialDetalleTitulo = document.getElementById('venta-historial-detalle-titulo');
    const ventaHistorialDetalleMeta = document.getElementById('venta-historial-detalle-meta');
    const ventaHistorialDetalleItems = document.getElementById('venta-historial-detalle-items');
    const ventaHistorialSubtotal = document.getElementById('venta-historial-subtotal');
    const ventaHistorialImpuestos = document.getElementById('venta-historial-impuestos');
    const ventaHistorialTotal = document.getElementById('venta-historial-total');

    // Elementos de CONFIGURACIÓN
    const modalConfig = document.getElementById('modal-config');
    const btnOpenConfig = document.getElementById('btn-open-config');
    const btnCloseConfig = document.getElementById('btn-close-config');
    const configForm = document.getElementById('config-form');

    // Elementos del MODAL DE CIERRE
    const modalCierre = document.getElementById('modal-cierre-caja');
    const btnCerrarModalCierre = document.getElementById('btn-cerrar-modal-cierre');
    const inputEfectivoContado = document.getElementById('efectivo-contado-input');
    const btnFinalizarCierre = document.getElementById('btn-finalizar-cierre');
    const lblEfeTeorico = document.getElementById('cierre-efe-teorico');
    const lblTransfe = document.getElementById('cierre-transfe');
    const containerDiff = document.getElementById('cierre-diff-container');
    const lblDiff = document.getElementById('cierre-diff-label');

    // Estado de la aplicación
    let cart = [];
    let categoriasCache = [];
    let fiadosCache = [];
    let tiendaConfig = null;
    let sesionActiva = false;
    let metodoPagoActual = 'efectivo';
    let resumenCierreActual = null;
    const taxRate = 0.0;


    // Actualizar reloj
    setInterval(() => {
        const now = new Date();
        document.getElementById('current-time').innerText = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }, 1000);

    // VERIFICAR TIENDA Y SESIÓN (ADELANTADO PARA EVITAR INTERMITENCIA)
    verificarEstadoTienda();

    // Cargar categorías al inicio para el explorador
    cargarCategoriasExplorer();

    // Cargar productos más vendidos
    cargarMasVendidos();

    // Evento de búsqueda de categorías (Filtrado en tiempo real)
    catSearchInput.addEventListener('input', (e) => {
        renderizarCategoriasExplorer(e.target.value);
    });

    // Mostrar todas al hacer clic si está vacío
    catSearchInput.addEventListener('focus', () => {
        if (catSearchInput.value === '') {
            renderizarCategoriasExplorer('');
        }
    });

    // Evento volver
    btnVolverCat.addEventListener('click', volverACategorias);


    // ═══════════════════════════════════════════════════
    //  CAPTURA GLOBAL DE TECLADO → escáner siempre listo
    // ═══════════════════════════════════════════════════
    // Cualquier tecla que el lector físico emita se redirige
    // automáticamente al barcodeInput salvo que el usuario
    // esté escribiendo en otro campo (qty-input, modales, etc.)
    document.addEventListener('keydown', (e) => {
        const active = document.activeElement;
        const tag = active ? active.tagName : '';

        // Respetar inputs/textareas que NO son el barcodeInput
        if ((tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') && active !== barcodeInput) return;

        // No interferir si hay modal visible
        const modalVisible = [...document.querySelectorAll('.modal-overlay')]
            .some(m => m.style.display === 'flex');
        const authVisible = document.getElementById('auth-overlay').style.display === 'flex';
        if (modalVisible || authVisible) return;

        // Redirigir foco al escáner si no lo tiene ya
        if (active !== barcodeInput) {
            barcodeInput.focus();
        }
    });

    // También restaurar foco al hacer clic en área vacía
    document.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
        barcodeInput.focus();
    });

    // ═══════════════════════════════════════════════════
    //  BÚSQUEDA CON ENTER  (escáner con terminador)
    // ═══════════════════════════════════════════════════
    barcodeInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(window._scanDebounce);
            const text = barcodeInput.value.trim();
            if (text) await ejecutarBusqueda(text);
        }
    });

    // ═══════════════════════════════════════════════════
    //  DEBOUNCE 350ms  (escáner sin terminador Enter)
    // ═══════════════════════════════════════════════════
    barcodeInput.addEventListener('input', () => {
        clearTimeout(window._scanDebounce);
        const text = barcodeInput.value.trim();
        // Esperar a que el escáner termine de escribir (mínimo 4 caracteres)
        if (text.length >= 4) {
            window._scanDebounce = setTimeout(async () => {
                if (barcodeInput.value.trim() === text) {
                    await ejecutarBusqueda(text);
                }
            }, 350);
        }
    });


    btnCloseResults.addEventListener('click', () => {
        resultsOverlay.style.display = 'none';
        barcodeInput.value = '';
        barcodeInput.focus();
    });

    async function ejecutarBusqueda(texto) {
        try {
            // USAR solo_codigo=1 para evitar búsqueda por nombre en caja
            const response = await fetch(`/api/productos/search?q=${encodeURIComponent(texto)}&solo_codigo=1`);
            if (response.ok) {
                const resultados = await response.json();

                if (resultados.length === 0) {
                    alert(`⚠️ No se encontró ningún producto con el código: "${texto}"`);
                    barcodeInput.value = '';
                }
                else if (resultados.length === 1) {
                    agregarAlCarrito(resultados[0]);
                    barcodeInput.value = '';
                }
            } else {
                alert('Error al buscar en el servidor');
            }
        } catch (error) {
            console.error('Error detallado:', error);
            alert('Error de comunicación con el servidor.');
        }
    }

    // ================= LÓGICA DE AUTENTICACIÓN =======================

    async function verificarEstadoTienda() {
        const overlay = document.getElementById('auth-overlay');
        const setupPanel = document.getElementById('setup-panel');
        const selectionPanel = document.getElementById('cajero-selection-panel');

        try {
            // --- CARGA INSTANTÁNEA DESDE LOCALSTORAGE ---
            const sesionGuardada = localStorage.getItem('sesion_chauta');
            if (sesionGuardada) {
                const sesion = JSON.parse(sesionGuardada);
                tiendaConfig = sesion.tienda;
                sesionActiva = true;

                // Aplicar UI instantáneamente si hay datos
                const nroCaja = String(tiendaConfig.cajeroSeleccionado).padStart(2, '0');
                document.querySelector('.logo-area h1').innerText = `🛒 ${tiendaConfig.nombre_supermercado} - CAJA ${nroCaja}`;

                overlay.style.display = 'none';
                document.body.classList.remove('auth-required');
                barcodeInput.focus();
            } else {
                // Si no hay sesión guardada, mostrar overlay de inmediato (antes del fetch)
                overlay.style.display = 'flex';
            }

            const res = await fetch('/api/tienda');
            const data = await res.json();

            if (sesionActiva && data.registrada) {
                // Verificar si la tienda sigue siendo la misma (nit)
                if (tiendaConfig.nit !== data.nit && data.nit) {
                    // Si el NIT cambió, forzar re-login
                    localStorage.removeItem('sesion_chauta');
                    window.location.reload();
                    return;
                }
                overlay.style.display = 'none';
                return; // Sesión validada con el servidor
            }

            // Si llegamos aquí, no hay sesión o no coincide
            overlay.style.display = 'flex';
            if (!data.registrada) {
                window.toggleAuth('setup');
                selectionPanel.style.display = 'none';
            } else {
                window.toggleAuth('role');
                selectionPanel.style.display = 'none';
            }
        } catch (e) {
            console.error("Error verificando tienda:", e);
            overlay.style.display = 'flex';
            window.toggleAuth('role'); // Fallback para que nunca quede en blanco
        }
    }

    // Navegación entre paneles de auth
    window.toggleAuth = (target) => {
        const panels = ['setup-panel', 'role-selection-panel', 'login-cajero-panel', 'login-admin-panel', 'cajero-selection-panel', 'apertura-caja-panel'];
        panels.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        const targetEl = document.getElementById(target + '-panel');
        if (targetEl) {
            targetEl.style.display = 'block';
        } else {
            // Fallbacks manuales para ID específicos
            if (target === 'role') document.getElementById('role-selection-panel').style.display = 'block';
            else if (target === 'setup') document.getElementById('setup-panel').style.display = 'block';
            else if (target === 'login') document.getElementById('role-selection-panel').style.display = 'block'; // Fallback a role en login genérico
        }
    };

    window.manejarVolverSeleccion = () => {
        window.toggleAuth('role');
    };

    document.getElementById('setup-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            nombre: document.getElementById('reg-nombre').value,
            nit: document.getElementById('reg-nit').value,
            dueno: document.getElementById('reg-dueno').value,
            lugar: document.getElementById('reg-lugar').value,
            direccion: document.getElementById('reg-direccion').value,
            cajeros: document.getElementById('reg-cajeros').value,
            contrasena: document.getElementById('reg-password').value
        };

        if (data.contrasena.length < 6 || data.contrasena.length > 18) {
            alert("La contraseña debe tener entre 6 y 18 caracteres.");
            return;
        }

        const res = await fetch('/api/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert("¡Registro exitoso! Ahora inicia sesión.");
            verificarEstadoTienda();
        } else {
            const err = await res.json();
            alert("Error: " + err.error);
        }
    };

    document.getElementById('login-cajero-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            rol: 'cajero',
            nombre: document.getElementById('login-cajero-nombre').value,
            password: document.getElementById('login-cajero-password').value
        };

        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        if (result.success) {
            tiendaConfig = result.tienda;
            // PASO 2: Mostrar selección de caja
            mostrarSeleccionCaja(tiendaConfig);
        } else {
            alert(result.message || 'Error de credenciales');
        }
    };

    document.getElementById('login-admin-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            rol: 'admin',
            admin_user: document.getElementById('login-admin-user').value,
            admin_password: document.getElementById('login-admin-password').value
        };

        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        if (result.success) {
            // Guardar token temporal si fuera necesario, o simplemente redirigir al panel.
            // Redirigir al panel admin
            window.location.href = '/admin';
        } else {
            alert(result.message || 'Error de credenciales');
        }
    };

    function mostrarSeleccionCaja(t) {
        window.toggleAuth('none'); // Esconde todos los auth panels regulares
        const panelCaja = document.getElementById('cajero-selection-panel');
        const grid = document.getElementById('cajeros-grid');

        panelCaja.style.display = 'block';
        grid.innerHTML = '';

        for (let i = 1; i <= t.num_cajeros; i++) {
            const btn = document.createElement('button');
            btn.className = 'btn-auth-primary';
            btn.style.height = '140px';
            btn.style.display = 'flex';
            btn.style.flexDirection = 'column';
            btn.style.justifyContent = 'center';
            btn.style.alignItems = 'center';
            btn.style.gap = '10px';
            btn.style.background = '#ffffff';
            btn.style.color = 'var(--color-primary)';
            btn.style.border = '3px solid var(--color-primary)';

            btn.innerHTML = `
                <span style="font-size: 40px;">💼</span>
                <span style="font-size: 20px; font-weight: 800;">Caja ${i}</span>
            `;

            btn.onclick = () => mostrarAperturaCaja(i);
            grid.appendChild(btn);
        }
    }

    let cajaSeleccionadaTemporal = null;

    async function mostrarAperturaCaja(nro) {
        cajaSeleccionadaTemporal = nro;

        // REQUISITO: Verificar si ya fue abierta hoy
        try {
            const res = await fetch(`/api/caja/verificar-apertura?caja_id=${nro}`);
            const data = await res.json();

            if (data.abierta) {
                // Ya fue abierta hoy para esta caja, entramos directo
                finalizarAccesoCaja(nro);
                return;
            }
        } catch (err) {
            console.error("Error verificando apertura:", err);
        }

        document.getElementById('cajero-selection-panel').style.display = 'none';
        document.getElementById('apertura-caja-panel').style.display = 'block';
        document.getElementById('lbl-caja-nro').innerText = nro;
        document.getElementById('base-inicial-input').value = '';
        setTimeout(() => document.getElementById('base-inicial-input').focus(), 100);
    }

    document.getElementById('apertura-form').onsubmit = async (e) => {
        e.preventDefault();
        const base = document.getElementById('base-inicial-input').value;

        // Mandar al servidor la apertura
        const res = await fetch('/api/caja/apertura', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caja_id: cajaSeleccionadaTemporal, base_inicial: base })
        });

        if (res.ok) {
            finalizarAccesoCaja(cajaSeleccionadaTemporal);
        } else {
            alert('Error al registrar apertura de caja');
        }
    };

    function finalizarAccesoCaja(nro) {
        tiendaConfig.cajeroSeleccionado = nro;
        sesionActiva = true;

        // Guardar sesión para persistencia
        localStorage.setItem('sesion_chauta', JSON.stringify({
            tienda: tiendaConfig,
            timestamp: new Date().getTime()
        }));

        document.getElementById('auth-overlay').style.display = 'none';
        document.body.classList.remove('auth-required');

        // Actualizar interfaz con datos de la tienda y caja
        const nroCaja = String(nro).padStart(2, '0');
        document.querySelector('.logo-area h1').innerText = `🛒 ${tiendaConfig.nombre_supermercado} - CAJA ${nroCaja}`;
        barcodeInput.focus();
    }

    document.getElementById('btn-logout').onclick = () => {
        if (confirm("¿Está seguro que desea cerrar sesión completamente?")) {
            sesionActiva = false;
            tiendaConfig = null;
            cart = [];

            // Limpiar persistencia
            localStorage.removeItem('sesion_chauta');

            renderizarCarrito();
            document.body.classList.add('auth-required');
            document.getElementById('auth-overlay').style.display = 'flex';
            toggleAuth('login');
        }
    };

    document.getElementById('btn-cambiar-caja').onclick = () => {
        if (!tiendaConfig) return;
        abrirModalArqueo();
    };

    // --- LÓGICA DE CIERRE Y ARQUEO ---
    async function abrirModalArqueo() {
        try {
            const res = await fetch(`/api/caja/resumen?caja_id=${tiendaConfig.cajeroSeleccionado}`);
            const data = await res.json();
            resumenCierreActual = data;

            lblEfeTeorico.innerText = `$${Math.round(data.total_teorico_efectivo).toLocaleString()}`;
            lblTransfe.innerText = `$${Math.round(data.transferencia_ventas).toLocaleString()}`;

            inputEfectivoContado.value = '';
            containerDiff.style.display = 'none';
            modalCierre.style.display = 'flex';
            setTimeout(() => inputEfectivoContado.focus(), 300);
        } catch (err) {
            alert("Error al cargar el resumen de caja");
        }
    }

    inputEfectivoContado.oninput = () => {
        if (!resumenCierreActual) return;
        const contado = parseFloat(inputEfectivoContado.value) || 0;
        const teorico = resumenCierreActual.total_teorico_efectivo;
        const diff = contado - teorico;

        containerDiff.style.display = 'block';
        if (diff === 0) {
            lblDiff.innerText = "¡CAJA CUADRADA!";
            lblDiff.style.color = "#2f855a";
        } else if (diff > 0) {
            lblDiff.innerText = `SOBRANTE: $${Math.round(diff).toLocaleString()}`;
            lblDiff.style.color = "#2b6cb0";
        } else {
            lblDiff.innerText = `FALTANTE: $${Math.round(Math.abs(diff)).toLocaleString()}`;
            lblDiff.style.color = "#c53030";
        }
    };

    btnFinalizarCierre.onclick = async () => {
        const contado = inputEfectivoContado.value;
        if (contado === "" || contado === null) {
            alert("Debe ingresar la plata contada para cerrar la caja.");
            return;
        }

        const dataCierre = {
            caja_id: tiendaConfig.cajeroSeleccionado,
            base_inicial: resumenCierreActual.base_inicial,
            efectivo_ventas: resumenCierreActual.efectivo_ventas,
            transferencia_ventas: resumenCierreActual.transferencia_ventas,
            total_teorico: resumenCierreActual.total_teorico_efectivo,
            efectivo_contado: parseFloat(contado),
            diferencia: parseFloat(contado) - resumenCierreActual.total_teorico_efectivo
        };

        const res = await fetch('/api/caja/cierre', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataCierre)
        });

        if (res.ok) {
            // Limpieza y cierre real
            sesionActiva = false;
            tiendaConfig = null;
            cart = [];
            localStorage.removeItem('sesion_chauta');
            window.location.reload();
        } else {
            alert("Error al registrar el cierre en el servidor.");
        }
    };

    btnCerrarModalCierre.onclick = () => modalCierre.style.display = 'none';

    window.manejarVolverSeleccion = () => {
        // Consultar el estado guardado por si acaso
        const sesionGuardada = localStorage.getItem('sesion_chauta');

        if (sesionActiva || sesionGuardada) {
            // Ya estoy logueado y elegí caja antes, vuelvo a la venta
            document.getElementById('auth-overlay').style.display = 'none';
            document.body.classList.remove('auth-required');
        } else {
            // No he terminado el proceso de entrada, vuelvo al login
            toggleAuth('login');
        }
    };

    // ================= GESTIÓN DE CONFIGURACIÓN =======================
    if (btnOpenConfig) {
        btnOpenConfig.onclick = () => {
            if (!tiendaConfig) return;

            // Cargar datos actuales en el formulario
            document.getElementById('conf-nombre').value = tiendaConfig.nombre_supermercado;
            document.getElementById('conf-nit').value = tiendaConfig.nit;
            document.getElementById('conf-dueno').value = tiendaConfig.nombre_dueno;
            document.getElementById('conf-lugar').value = tiendaConfig.lugar;
            document.getElementById('conf-direccion').value = tiendaConfig.direccion;
            document.getElementById('conf-cajeros').value = tiendaConfig.num_cajeros;

            modalConfig.style.display = 'flex';
        };
    }

    if (btnCloseConfig) btnCloseConfig.onclick = () => modalConfig.style.display = 'none';

    if (configForm) {
        configForm.onsubmit = async (e) => {
            e.preventDefault();
            const data = {
                nombre: document.getElementById('conf-nombre').value,
                nit: document.getElementById('conf-nit').value,
                dueno: document.getElementById('conf-dueno').value,
                lugar: document.getElementById('conf-lugar').value,
                direccion: document.getElementById('conf-direccion').value,
                cajeros: document.getElementById('conf-cajeros').value
            };

            const res = await fetch('/api/tienda/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                alert("✅ Configuración actualizada correctamente.");
                modalConfig.style.display = 'none';

                // Actualizar estado local e interfaz
                const resConfig = await fetch('/api/tienda');
                const dataConfig = await resConfig.json();
                tiendaConfig = { ...tiendaConfig, ...dataConfig.tienda };

                const nroCaja = String(tiendaConfig.cajeroSeleccionado || 1).padStart(2, '0');
                document.querySelector('.logo-area h1').innerText = `🛒 ${tiendaConfig.nombre_supermercado} - CAJA ${nroCaja}`;
            } else {
                alert("Error al actualizar la configuración.");
            }
        };
    }

    // ================= GESTIÓN DE BÚSQUEDA Y RESULTADOS =======================


    function mostrarResultados(productos) {
        resultsList.innerHTML = '';
        resultsOverlay.style.display = 'block';

        productos.forEach(p => {
            const btn = document.createElement('button');
            btn.className = 'result-item-btn';
            const precioNum = Number(p.precio_unidad) || 0;

            // Imagen solo si existe
            const imgHtml = p.imagen_url ? `<img src="${p.imagen_url}" alt="${p.nombre}">` : '<div class="no-img-placeholder"></div>';

            btn.innerHTML = `
                ${imgHtml}
                <div class="result-info">
                    <h4>${p.nombre}</h4>
                    <p>${p.marca} | $${Math.round(precioNum).toLocaleString()}</p>
                    <small>Código: ${p.codigo_barras}</small>
                </div>
            `;
            btn.onclick = () => {
                agregarAlCarrito(p);
                resultsOverlay.style.display = 'none';
                barcodeInput.value = '';
                barcodeInput.focus();
            };
            resultsList.appendChild(btn);
        });
    }

    async function cargarCategoriasExplorer() {
        try {
            const res = await fetch('/api/categorias');
            categoriasCache = await res.json();
            renderizarCategoriasExplorer();
        } catch (e) {
            console.error("Error cargando categorías:", e);
        }
    }

    function renderizarCategoriasExplorer(filtro = '') {
        categoriesList.innerHTML = '';
        const lowerFiltro = filtro.toLowerCase().trim();

        // Filtrar del caché
        let filtradas = categoriasCache.filter(c =>
            c.nombre.toLowerCase().includes(lowerFiltro)
        );

        // REQUISITO: Máximo 4 categorías en el listado
        const limitadas = filtradas.slice(0, 4);

        limitadas.forEach((cat) => {
            const btn = document.createElement('button');
            btn.className = 'cat-list-item';

            // Imagen: SOLO la subida por el usuario. Si no hay, emoji genérico.
            const finalImgPath = cat.imagen_url || '';

            const imgHtml = finalImgPath
                ? `<div class="cat-icon-container"><img src="${finalImgPath}" alt="${cat.nombre}" class="cat-img-icon" onerror="this.onerror=null; this.closest('.cat-icon-container').innerHTML='<span class=\'icon\'>\uD83C\uDFF7\uFE0F</span>';" ></div>`
                : `<div class="cat-icon-container"><span class="icon">🏷️</span></div>`;

            btn.innerHTML = `
                ${imgHtml}
                <span class="label">${cat.nombre}</span>
            `;
            btn.onclick = () => irAProductos(cat.id, cat.nombre);
            categoriesList.appendChild(btn);
        });

        // Si no hay resultados
        if (limitadas.length === 0) {
            const msg = filtro
                ? `<p style="padding:20px; color:#a0aec0; text-align:center;">No se encontró "${filtro}"</p>`
                : `<p style="padding:20px; color:#a0aec0; text-align:center;">Sin categorías</p>`;
            categoriesList.innerHTML = msg;
        }
    }

    async function irAProductos(id, nombre) {
        catSelectedTitle.innerText = nombre.toUpperCase();
        productsByCatGrid.innerHTML = '<p style="padding:20px; color:#a0aec0; font-size:20px;">Cargando productos...</p>';
        vCategorias.style.display = 'none';
        vProductos.style.display = 'flex';

        try {
            const res = await fetch(`/api/productos/search?categoria_id=${id}`);
            const productos = await res.json();

            productsByCatGrid.innerHTML = '';
            productos.forEach(p => {
                const btn = document.createElement('button');
                btn.className = 'cat-list-item cat-list-item--product';

                // Imagen de producto: tamaño grande para baja visión
                const imgHtml = p.imagen_url
                    ? `<img src="${p.imagen_url}" class="prod-cat-img" alt="${p.nombre}" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
                       <div class="prod-cat-img prod-cat-noimg" style="display:none;">\uD83D\uDED2</div>`
                    : `<div class="prod-cat-img prod-cat-noimg">🛒</div>`;

                btn.innerHTML = `
                    <div class="prod-cat-img-wrap">${imgHtml}</div>
                    <div style="text-align: left; flex: 1; min-width:0;">
                        <span class="label" style="display:block; font-size: 22px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.nombre}</span>
                        <span style="font-size: 22px; color: var(--color-primary); font-weight: 800;">$${p.precio_unidad.toLocaleString()}</span>
                    </div>
                `;
                btn.onclick = () => agregarAlCarrito(p);
                productsByCatGrid.appendChild(btn);
            });

            if (productos.length === 0) {
                productsByCatGrid.innerHTML = '<p style="padding:20px; color:#a0aec0; font-size:20px; text-align:center;">Sin productos en esta categoría</p>';
            }
        } catch (e) {
            console.error("Error al cargar productos de categoría:", e);
        }
    }


    function volverACategorias() {
        vProductos.style.display = 'none';
        vCategorias.style.display = 'flex';
        catSearchInput.value = '';
        renderizarCategoriasExplorer();
    }

    // ================= MÁS VENDIDOS =======================

    async function cargarMasVendidos() {
        try {
            const res = await fetch('/api/productos/mas-vendidos');
            const productos = await res.json();
            renderizarMasVendidos(productos);
        } catch (e) {
            console.error('Error cargando más vendidos:', e);
            renderizarMasVendidos([]);
        }
    }

    function renderizarMasVendidos(productos) {
        const grid = document.getElementById('mas-vendidos-grid');
        if (!grid) return;
        grid.innerHTML = '';

        if (!productos || productos.length === 0) {
            grid.innerHTML = `<div class="mv-empty-msg">Sin ventas<br>registradas aún</div>`;
            return;
        }

        productos.forEach(p => {
            const card = document.createElement('button');
            card.className = 'mv-card';
            card.title = p.nombre;

            const imgHtml = p.imagen_url
                ? `<div class="mv-img-wrap"><img src="${p.imagen_url}" alt="${p.nombre}" onerror="this.onerror=null;this.parentElement.innerHTML='<span class=\'mv-no-img\'>🛒</span>';"></div>`
                : `<div class="mv-img-wrap"><span class="mv-no-img">🛒</span></div>`;

            // Truncar nombre a 22 chars para que quepa bien
            const nameShort = p.nombre.length > 22 ? p.nombre.substring(0, 20) + '…' : p.nombre;

            card.innerHTML = `
                ${imgHtml}
                <span class="mv-name">${nameShort}</span>
            `;

            // Al hacer clic: buscar el producto y agregarlo al carrito
            card.onclick = async () => {
                try {
                    // Buscar el producto completo por su id en la API de productos
                    const r = await fetch(`/api/productos/search?q=${encodeURIComponent(p.nombre)}`);
                    const lista = await r.json();
                    // Buscar coincidencia exacta por id
                    const prod = lista.find(x => x.id === p.id) || lista[0];
                    if (prod) {
                        agregarAlCarrito(prod);
                    } else {
                        alert('Producto no encontrado.');
                    }
                } catch (e) {
                    console.error('Error al agregar desde más vendidos:', e);
                }
            };

            grid.appendChild(card);
        });
    }


    function checkEsPesado(producto) {
        if (!producto.categoria_nombre) return false;
        const cat = producto.categoria_nombre.toLowerCase();
        return cat.includes('fruta') || cat.includes('verdura') || cat.includes('carne') || cat.includes('pesaje');
    }

    function agregarAlCarrito(producto) {
        // Verificar si ya existe en el carrito
        const existingItem = cart.find(item => item.codigo_barras === producto.codigo_barras);

        if (existingItem) {
            const esPesado = checkEsPesado(producto);
            const incremento = esPesado ? 0.1 : 1;

            // Validar stock antes de sumar
            if (parseFloat(existingItem.cantidad) + incremento <= parseFloat(producto.stock)) {
                existingItem.cantidad = parseFloat((parseFloat(existingItem.cantidad) + incremento).toFixed(3));
                renderizarCarrito();
                // Flash verde en el campo de cantidad del producto actualizado
                setTimeout(() => {
                    const allInputs = document.querySelectorAll('.qty-input');
                    const target = [...allInputs].find(el => el.dataset.codigo === producto.codigo_barras);
                    if (target) {
                        target.classList.add('qty-scan-flash');
                        setTimeout(() => target.classList.remove('qty-scan-flash'), 500);
                    }
                }, 50);
            } else {
                alert(`⚠️ Stock máximo alcanzado para ${producto.nombre} (${producto.stock})`);
            }
        } else {
            cart.push({ ...producto, cantidad: 1 });
            renderizarCarrito();
        }

        // Devolver foco al escáner inmediatamente tras agregar
        setTimeout(() => barcodeInput.focus(), 80);
    }

    function cambiarCantidadManual(codigo, delta) {
        const item = cart.find(i => i.codigo_barras === codigo);
        if (item) {
            const esPesado = checkEsPesado(item);
            const step = esPesado ? 0.1 : 1;
            const actualDelta = delta > 0 ? step : -step;

            const nuevaCat = parseFloat((parseFloat(item.cantidad) + actualDelta).toFixed(3));

            if (nuevaCat > 0 && nuevaCat <= parseFloat(item.stock)) {
                item.cantidad = nuevaCat;
                renderizarCarrito();
            } else if (nuevaCat > parseFloat(item.stock)) {
                alert(`⚠️ Stock máximo alcanzado: ${item.stock} unidades/kg.`);
            }
        }
    }

    function editarCantidadDirecta(codigo, valor, esInputEvent = false) {
        const item = cart.find(i => i.codigo_barras === codigo);
        if (item) {
            const esPesado = checkEsPesado(item);
            let numStr = valor.replace(',', '.');
            if (numStr === '' || numStr === '.') return; // Dejar que siga escribiendo

            let num = parseFloat(numStr);
            if (isNaN(num)) return;

            if (num > parseFloat(item.stock)) {
                // No mostrar alert en input event para no molestar al escribir
                if (!esInputEvent) alert(`⚠️ No puedes vender más de ${item.stock} unidades/kg.`);
                num = parseFloat(item.stock);
            }

            item.cantidad = esPesado ? parseFloat(num.toFixed(3)) : Math.round(num);

            if (esInputEvent) {
                // Actualizar totales sin redibujar todo el carrito (para no perder el foco)
                actualizarTotales();
                // Actualizar solo el precio local de este item
                const itemRow = document.querySelector(`.qty-input[data-codigo="${codigo}"]`).closest('.cart-item');
                if (itemRow) {
                    const priceEl = itemRow.querySelector('.item-price');
                    priceEl.innerText = `$${Math.round(item.precio_unidad * item.cantidad)}`;
                }
            } else {
                renderizarCarrito();
            }
        }
    }




    function eliminarDelCarrito(codigo) {
        cart = cart.filter(item => item.codigo_barras !== codigo);
        renderizarCarrito();
    }

    // Funciones del DOM
    function renderizarCarrito() {
        if (cart.length === 0) {
            cartContainer.innerHTML = '<div class="empty-cart-msg"><p>Esperando productos...</p></div>';
            actualizarTotales();
            return;
        }

        cartContainer.innerHTML = '';

        cart.forEach(item => {
            const esPesado = checkEsPesado(item);
            const precioTotalItem = Math.round(item.precio_unidad * item.cantidad);
            const imgSrc = item.imagen_url && item.imagen_url !== '' ? item.imagen_url : null;

            // Mostrar 3 decimales si es pesado, sino entero
            const cantAMostrar = esPesado ? parseFloat(item.cantidad).toFixed(3) : parseInt(item.cantidad);

            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';

            const labelText = esPesado ? 'CANT. KILOS' : 'CANT. UNID';

            // Imagen del producto: tamaño grande para baja visión
            const imgHtml = imgSrc ?
                `<img src="${imgSrc}" alt="${item.nombre}" style="width: 90px; height: 90px; object-fit: cover; border-radius: 10px; border: 2px solid #e2e8f0; flex-shrink:0;">` :
                '<div class="no-img-placeholder" style="width: 90px; height: 90px; flex-shrink:0;"></div>';

            itemElement.innerHTML = `
                <div class="item-qty-container">
                    <span class="qty-header-label">${labelText}</span>
                    <div class="item-qty-control">
                        <button class="qty-btn btn-minus" data-codigo="${item.codigo_barras}">−</button>
                        <input type="text" class="qty-input" value="${cantAMostrar}" data-codigo="${item.codigo_barras}">
                        <button class="qty-btn btn-plus" data-codigo="${item.codigo_barras}">+</button>
                    </div>
                </div>
                ${imgHtml}
                <div class="item-details" style="flex: 1; min-width: 0; padding: 0 10px;">
                    <h4 style="font-size: 24px; font-weight: 700; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.nombre}</h4>
                    <p style="font-size: 19px; color: #4a5568; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.marca} | $${Math.round(item.precio_unidad)} / ${item.unidad}</p>
                </div>
                <div class="item-price" style="font-size: 26px; font-weight: 800; font-family: var(--font-display); margin-right: 15px;">$${precioTotalItem}</div>
                <button class="btn-delete" aria-label="Eliminar ${item.nombre}" data-codigo="${item.codigo_barras}">
                    🗑️
                </button>
            `;
            cartContainer.appendChild(itemElement);
        });

        // Eventos para BOTONES de cantidad
        document.querySelectorAll('.btn-plus').forEach(btn => {
            btn.onclick = (e) => cambiarCantidadManual(e.currentTarget.dataset.codigo, 1);
        });
        document.querySelectorAll('.btn-minus').forEach(btn => {
            btn.onclick = (e) => cambiarCantidadManual(e.currentTarget.dataset.codigo, -1);
        });

        // Eventos para INPUT de cantidad
        document.querySelectorAll('.qty-input').forEach(input => {
            //oninput: Actualización automática al ESCRIBIR (tiempo real)
            input.oninput = (e) => editarCantidadDirecta(e.target.dataset.codigo, e.target.value, true);

            //onchange: Limpieza y validación final al salir del campo
            input.onchange = (e) => editarCantidadDirecta(e.target.dataset.codigo, e.target.value, false);

            // Evitar que el enter recargue algo
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.target.blur();
                    barcodeInput.focus(); // Volver al buscador principal tras terminar
                }
            };

            // Seleccionar todo el texto al hacer clic para editar rápido
            input.onclick = (e) => e.target.select();
        });

        // Eventos de ELIMINAR
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.onclick = (e) => eliminarDelCarrito(e.currentTarget.dataset.codigo);
        });

        // Scroll al fondo
        cartContainer.scrollTop = cartContainer.scrollHeight;

        actualizarTotales();
    }

    function actualizarTotales() {
        let subtotal = 0;
        cart.forEach(item => {
            subtotal += item.precio_unidad * item.cantidad;
        });

        // Ahora el impuesto es 0
        const taxes = 0;
        const grandTotal = Math.round(subtotal);

        subtotalEl.innerText = `$${Math.round(subtotal)}`;
        taxesEl.innerText = `$${taxes}`;
        grandTotalEl.innerText = `$${grandTotal}`;
    }

    btnCobrar.addEventListener('click', () => {
        try {
            if (cart.length === 0) {
                alert('Agregue productos para cobrar.');
                return;
            }

            // Calcular total para el audio
            let subtotal = 0;
            cart.forEach(item => subtotal += item.precio_unidad * item.cantidad);
            const total = Math.round(subtotal);

            // Emitir audio del total a pagar (Web Speech API) - Seguro con try-catch
            try {
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel(); // Detener cualquier locución previa
                    const mensaje = new SpeechSynthesisUtterance(`El total a pagar es de ${total} pesos.`);
                    mensaje.lang = 'es-ES'; // Español
                    mensaje.rate = 1.0;     // Velocidad normal
                    window.speechSynthesis.speak(mensaje);
                }
            } catch (speechErr) {
                console.error("Error en Speech Synthesis:", speechErr);
            }

            abrirModalPago();
        } catch (err) {
            console.error("Error al procesar botón cobrar:", err);
            alert("Hubo un error interno al intentar cobrar. Revisa la consola.");
        }
    });

    // ================= LÓGICA FIADOS =======================

    btnFiado.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Agregue productos para fiar.');
            return;
        }
        let subtotal = 0;
        cart.forEach(item => {
            subtotal += item.precio_unidad * item.cantidad;
        });
        const total = Math.round(subtotal);
        totalFiadoModal.innerText = `$${total.toLocaleString()}`;
        modalFiado.style.display = 'flex';
        clienteFiadoNombre.focus();
    });

    btnCerrarModalFiado.onclick = () => modalFiado.style.display = 'none';

    btnConfirmarFiado.onclick = async () => {
        const nombre = clienteFiadoNombre.value.trim();
        if (!nombre) {
            alert('Ingresa el nombre del cliente.');
            return;
        }
        let subtotal = 0;
        cart.forEach(item => {
            subtotal += item.precio_unidad * item.cantidad;
        });
        const total = Math.round(subtotal);
        try {
            const response = await fetch('/api/fiados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cliente_nombre: nombre,
                    cart: cart,
                    total: total
                })
            });
            if (response.ok) {
                alert(`✅ Fiado registrado para ${nombre}. Total: $${total.toLocaleString()}`);
                cart = [];
                renderizarCarrito();
                modalFiado.style.display = 'none';
                clienteFiadoNombre.value = '';
                barcodeInput.focus();
            } else {
                alert('Error al registrar el fiado.');
            }
        } catch (error) {
            alert('Error de conexión.');
        }
    };

    btnConsultarFiado.onclick = async () => {
        modalConsultarFiado.style.display = 'flex';
        buscarClienteFiado.value = '';
        montoPagarFiado.value = '';
        infoClienteFiado.style.display = 'none';
        cargarListaFiadosCaja();
        buscarClienteFiado.focus();
    };

    btnCerrarConsultarFiado.onclick = () => {
        modalConsultarFiado.style.display = 'none';
        infoClienteFiado.style.display = 'none';
        buscarClienteFiado.value = '';
        montoPagarFiado.value = '';
        clientesFiadosList.innerHTML = '';
    };

    btnHistorialVentas.onclick = async () => {
        modalHistorialVentas.style.display = 'flex';
        await cargarHistorialVentasCaja();
    };

    const cerrarHistorial = () => {
        modalHistorialVentas.style.display = 'none';
        listaHistorialVentas.innerHTML = '';
        ventaHistorialDetalleEmpty.style.display = 'block';
        ventaHistorialDetalleContent.style.display = 'none';
    };

    btnCerrarHistorialVentas.onclick = cerrarHistorial;
    btnBackHistorialVentas.onclick = cerrarHistorial;

    btnBuscarFiado.onclick = () => {
        const nombre = buscarClienteFiado.value.trim().toLowerCase();
        if (!nombre) {
            alert('Ingresa el nombre del cliente.');
            return;
        }
        const cliente = fiadosCache.find(f => f.nombre.toLowerCase().includes(nombre));
        if (cliente) {
            seleccionarClienteFiado(cliente);
        } else {
            alert('Cliente no encontrado o sin deudas.');
        }
    };

    function seleccionarClienteFiado(cliente) {
        nombreClienteFiado.innerText = cliente.nombre;
        deudaClienteFiado.innerText = `$${cliente.total_pendiente.toLocaleString()}`;
        infoClienteFiado.style.display = 'block';
        infoClienteFiado.dataset.clienteId = cliente.id;
        montoPagarFiado.value = '';
    }

    async function cargarListaFiadosCaja() {
        clientesFiadosList.innerHTML = '<p style="color: #718096; margin: 0;">Cargando clientes...</p>';
        try {
            const response = await fetch('/api/fiados');
            if (!response.ok) throw new Error('No se pudieron cargar los fiados.');
            fiadosCache = await response.json();
            if (fiadosCache.length === 0) {
                clientesFiadosList.innerHTML = '<p style="color: #718096; margin: 0;">No hay clientes con fiado.</p>';
                return;
            }
            clientesFiadosList.innerHTML = '';
            fiadosCache.forEach(cliente => {
                const item = document.createElement('button');
                item.type = 'button';
                item.style.width = '100%';
                item.style.textAlign = 'left';
                item.style.background = 'white';
                item.style.border = '1px solid #d6dee6';
                item.style.borderRadius = '12px';
                item.style.padding = '12px 14px';
                item.style.marginBottom = '10px';
                item.style.cursor = 'pointer';
                item.style.fontSize = '16px';
                item.innerHTML = `
                    <strong>${cliente.nombre}</strong><br>
                    <small style="color:#4a5568;">Deuda: $${cliente.total_pendiente.toLocaleString()}</small>
                `;
                item.onclick = () => seleccionarClienteFiado(cliente);
                clientesFiadosList.appendChild(item);
            });
        } catch (error) {
            clientesFiadosList.innerHTML = '<p style="color: #e53e3e; margin: 0;">Error cargando clientes.</p>';
            console.error(error);
        }
    }

    async function cargarHistorialVentasCaja() {
        listaHistorialVentas.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #718096;">Cargando ventas...</td></tr>';
        try {
            const cajaId = tiendaConfig && tiendaConfig.cajeroSeleccionado ? tiendaConfig.cajeroSeleccionado : 1;
            const response = await fetch(`/api/ventas/historial?caja_id=${cajaId}`);
            if (!response.ok) throw new Error('No se pudo cargar el historial.');
            const ventas = await response.json();

            if (!ventas.length) {
                listaHistorialVentas.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #718096;">No hay ventas registradas en esta caja.</td></tr>';
                return;
            }

            listaHistorialVentas.innerHTML = '';
            ventas.forEach(venta => {
                const row = document.createElement('tr');
                row.style.borderBottom = '1px solid #e2e8f7';
                row.style.cursor = 'pointer';
                row.style.transition = 'background 0.2s';
                row.innerHTML = `
                    <td style="padding: 12px; font-weight: 700;">#${venta.id}</td>
                    <td style="padding: 12px;">${new Date(venta.fecha_hora).toLocaleString('es-ES')}</td>
                    <td style="padding: 12px; text-align: right; color: #2b6cb0; font-weight: 700;">$${Math.round(venta.total).toLocaleString()}</td>
                    <td style="padding: 12px;">${venta.metodo_pago === 'transferencia' ? 'Transferencia' : 'Efectivo'}</td>
                    <td style="padding: 12px; text-align: center;"><button class="btn-action" style="font-size:14px; padding: 6px 10px;" onclick="verDetalleVentaCaja(${venta.id})">Detalle</button></td>
                `;
                row.onmouseover = () => row.style.background = '#f0f4f8';
                row.onmouseout = () => row.style.background = 'transparent';
                row.onclick = () => window.verDetalleVentaCaja(venta.id);
                listaHistorialVentas.appendChild(row);
            });
            if (ventas.length > 0) {
                window.verDetalleVentaCaja(ventas[0].id);
            }
        } catch (error) {
            listaHistorialVentas.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #e53e3e;">Error al cargar el historial.</td></tr>';
            console.error(error);
        }
    }

    function mostrarDetalleVentaCaja(data) {
        ventaHistorialDetalleEmpty.style.display = 'none';
        ventaHistorialDetalleContent.style.display = 'block';
        ventaHistorialDetalleTitulo.innerText = `Venta #${data.venta.id}`;
        ventaHistorialDetalleMeta.innerText = `Fecha: ${new Date(data.venta.fecha_hora).toLocaleString('es-ES')} · Caja ${data.venta.caja_id} · Método: ${data.venta.metodo_pago}`;
        ventaHistorialDetalleItems.innerHTML = '';

        if (!data.detalle || data.detalle.length === 0) {
            ventaHistorialDetalleItems.innerHTML = '<div style="padding: 18px; border-radius: 12px; background: #f7fafc; border: 1px solid #e2e8f0; color: #718096;">No hay productos detallados para esta venta.</div>';
        } else {
            data.detalle.forEach(item => {
                const card = document.createElement('div');
                card.style.cssText = 'background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px;';
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; gap: 14px; align-items: center; margin-bottom: 6px;">
                        <span style="font-weight: 700; color: #2d3748;">${item.producto_nombre}${item.marca ? ` (${item.marca})` : ''}</span>
                        <span style="font-weight: 700; color: #2b6cb0;">$${Math.round(item.total_linea).toLocaleString()}</span>
                    </div>
                    <p style="margin: 0; color: #4a5568; font-size: 15px;">${item.cantidad} × $${Math.round(item.precio_unitario).toLocaleString()}</p>
                `;
                ventaHistorialDetalleItems.appendChild(card);
            });
        }

        ventaHistorialSubtotal.innerText = `Subtotal: $${Math.round(data.venta.subtotal).toLocaleString()}`;
        ventaHistorialImpuestos.innerText = `Impuestos: $${Math.round(data.venta.impuestos).toLocaleString()}`;
        ventaHistorialTotal.innerText = `Total: $${Math.round(data.venta.total).toLocaleString()}`;
    }

    window.verDetalleVentaCaja = async (id) => {
        try {
            const response = await fetch(`/api/ventas/${id}`);
            if (response.ok) {
                const data = await response.json();
                mostrarDetalleVentaCaja(data);
            }
        } catch (error) {
            console.error('Error al cargar detalle de venta:', error);
        }
    };

    btnPagarFiado.onclick = async () => {
        const clienteId = infoClienteFiado.dataset.clienteId;
        const monto = parseFloat(montoPagarFiado.value);
        if (!monto || monto <= 0) {
            alert('Ingresa un monto válido.');
            return;
        }
        try {
            const response = await fetch(`/api/fiados/${clienteId}/pagar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ monto_pagado: monto })
            });
            if (response.ok) {
                const res = await response.json();
                if (res.nuevo_total === 0) {
                    alert('✅ Pago completo. Cliente eliminado de fiados.');
                } else {
                    alert(`✅ Abono registrado. Nuevo total: $${res.nuevo_total.toLocaleString()}`);
                }
                modalConsultarFiado.style.display = 'none';
                infoClienteFiado.style.display = 'none';
                buscarClienteFiado.value = '';
                montoPagarFiado.value = '';
            } else {
                const err = await response.json().catch(() => null);
                alert(err && err.error ? `Error: ${err.error}` : 'Error al procesar el pago.');
            }
        } catch (error) {
            alert('Error de conexión.');
        }
    };

    // LÓGICA MODAL PAGO
    function abrirModalPago() {
        modalPago.style.display = 'flex';
        inputPagoRecibido.value = '';
        cambioVal.innerText = '$0';
        qrImg.src = '/static/img/qr.png?v=' + Date.now();

        // Reset a efectivo por defecto
        seleccionarMetodoPago('efectivo');

        // Foco automático al recibir dinero
        setTimeout(() => inputPagoRecibido.focus(), 300);
    }

    function seleccionarMetodoPago(metodo) {
        metodoPagoActual = metodo;
        if (metodo === 'efectivo') {
            btnPMEfectivo.classList.add('active');
            btnPMTransfer.classList.remove('active');
            secEfectivo.classList.add('active');
            secTransferencia.classList.remove('active');
        } else {
            btnPMEfectivo.classList.remove('active');
            btnPMTransfer.classList.add('active');
            secEfectivo.classList.remove('active');
            secTransferencia.classList.add('active');
        }
    }

    btnPMEfectivo.onclick = () => seleccionarMetodoPago('efectivo');
    btnPMTransfer.onclick = () => seleccionarMetodoPago('transferencia');
    btnCerrarModal.onclick = () => modalPago.style.display = 'none';

    // Cálculo de cambio en tiempo real
    inputPagoRecibido.oninput = () => {
        let subtotal = 0;
        cart.forEach(item => {
            const uPrice = item.precio_unidad || item.precio || 0;
            subtotal += uPrice * item.cantidad;
        });
        const total = Math.round(subtotal);
        const recibido = parseFloat(inputPagoRecibido.value) || 0;

        if (recibido >= total) {
            cambioVal.innerText = `$${Math.round(recibido - total)}`;
            cambioVal.parentElement.style.color = '#2f855a';
        } else {
            cambioVal.innerText = `Faltan $${Math.round(total - recibido)}`;
            cambioVal.parentElement.style.color = '#e53e3e';
        }
    };

    btnFinalizarSolo.onclick = () => finalizarVenta(false);
    btnFinalizarFactura.onclick = () => finalizarVenta(true);

    async function finalizarVenta(imprimir = false) {
        if (cart.length === 0) {
            alert('No hay productos en la venta. Agregue items antes de cobrar.');
            modalPago.style.display = 'none';
            return;
        }

        // Calcular totales actuales 
        let subtotal = 0;
        cart.forEach(item => {
            const uPrice = item.precio_unidad || item.precio || 0;
            subtotal += uPrice * item.cantidad;
        });
        const total = Math.round(subtotal);

        const recibido = parseFloat(inputPagoRecibido.value);
        if (!inputPagoRecibido.value.trim() || isNaN(recibido) || recibido <= 0) {
            alert('Debe ingresar el monto pagado para poder finalizar la venta.');
            inputPagoRecibido.focus();
            return;
        }

        if (recibido < total) {
            alert('El monto pagado debe ser igual o superior al total de la venta.');
            inputPagoRecibido.focus();
            return;
        }

        try {
            const response = await fetch('/api/ventas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    caja_id: tiendaConfig ? tiendaConfig.cajeroSeleccionado : 1,
                    metodo_pago: metodoPagoActual,
                    cart: cart,
                    subtotal: total,
                    impuestos: 0,
                    total: total
                })
            });

            if (response.ok) {
                const resData = await response.json();

                if (imprimir) {
                    generarPDF(resData.venta_id, cart, total);
                } else {
                    alert(`✅ Venta guardada correctamente. Ticket #${resData.venta_id}`);
                }

                // Limpiar y cerrar
                cart = [];
                renderizarCarrito();
                modalPago.style.display = 'none';
                barcodeInput.focus();
                // Refrescar ranking de más vendidos tras la venta
                cargarMasVendidos();
            } else {
                alert('Error al registrar la venta en la base de datos.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión al guardar la venta.');
        }
    }

    btnAnular.onclick = () => {
        if (confirm('¿Seguro que desea anular la venta actual?')) {
            cart = [];
            renderizarCarrito();
        }
    };

    function generarPDF(numero, items, total) {
        const now = new Date();
        const fechaStr = now.toLocaleDateString('es-ES');
        const horaStr = now.toLocaleTimeString('es-ES');

        // Formatear Nro Factura: MRC-YYYYMMDD-NRO
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const facturaNroFull = `MRC-${year}${month}${day}-${String(numero).padStart(4, '0')}`;

        // Datos del pago (Obtenidos del modal)
        const efectivoRecibido = parseFloat(inputPagoRecibido.value) || total;
        const cambioEntregado = efectivoRecibido >= total ? (efectivoRecibido - total) : 0;

        // Llenar datos de la tienda dinámicamente
        const t = tiendaConfig || { nombre_supermercado: 'supermercado Chauta', nit: '000', lugar: 'Madrid', direccion: 'Vereda Chauta' };

        const template = document.getElementById('invoice-template');
        document.getElementById('pdf-super-name').innerText = t.nombre_supermercado || 'supermercado Chauta';
        document.getElementById('pdf-footer-name').innerText = t.nombre_supermercado || 'supermercado Chauta';
        
        // El nuevo template tiene selectores IDs específicos
        document.getElementById('pdf-factura-nro').innerText = facturaNroFull;
        document.getElementById('pdf-fecha').innerText = fechaStr;
        document.getElementById('pdf-hora').innerText = horaStr;
        document.getElementById('pdf-current-time-footer').innerText = `${fechaStr} ${horaStr}`;
        
        document.getElementById('pdf-subtotal').innerText = `$${total.toLocaleString()}`;
        document.getElementById('pdf-total').innerText = `$${total.toLocaleString()}`;
        document.getElementById('pdf-pago-recibido').innerText = `$${Math.round(efectivoRecibido).toLocaleString()}`;
        document.getElementById('pdf-cambio').innerText = `$${Math.round(cambioEntregado).toLocaleString()}`;
        document.getElementById('pdf-metodo-pago').innerText = metodoPagoActual.charAt(0).toUpperCase() + metodoPagoActual.slice(1);

        const nroCajaFactura = String((tiendaConfig && tiendaConfig.cajeroSeleccionado) ? tiendaConfig.cajeroSeleccionado : 1).padStart(2, '0');
        document.getElementById('pdf-cajero-name').innerText = (t.nombre_dueno || "Administrador");

        const itemsBody = document.getElementById('pdf-items-list');
        itemsBody.innerHTML = '';

        let totalArticulos = 0;

        items.forEach(item => {
            const esPesado = checkEsPesado(item);
            const cantStr = esPesado ? parseFloat(item.cantidad).toFixed(3) : parseInt(item.cantidad);
            const uPrice = item.precio_unidad || item.precio || 0;
            const subtotalItem = Math.round(uPrice * item.cantidad);

            totalArticulos += parseFloat(item.cantidad);

            // Bloque del producto
            const itemBlock = document.createElement('tr');
            
            // Fila nombre y valor
            itemBlock.innerHTML = `
                <td style="padding: 2px 0;">
                    <div style="display: flex; flex-direction: column;">
                        <span>${item.nombre.toLowerCase()}</span>
                        <span style="font-size: 12px; color: #555;">&nbsp;&nbsp;${esPesado ? '⚖️' : '&nbsp;'} ${cantStr} ${item.unidad || 'un'} x $${uPrice.toLocaleString()} / ${item.unidad || 'un'}</span>
                    </div>
                </td>
                <td style="text-align: right; vertical-align: top; padding: 2px 0;">$${subtotalItem.toLocaleString()}</td>
            `;
            itemsBody.appendChild(itemBlock);
        });

        document.getElementById('pdf-art-count').innerText = totalArticulos % 1 === 0 ? totalArticulos : totalArticulos.toFixed(3);

        // Configuración de html2pdf
        const element = document.getElementById('invoice-template');
        element.style.display = 'block';

        const opt = {
            margin: [2, 2],
            filename: `Factura_${facturaNroFull}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 4, logging: false },
            jsPDF: { unit: 'mm', format: [80, 250], orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            element.style.display = 'none';
        });
    }

    // CIERRE DE SESIÓN
    const btnLogoutHeader = document.getElementById('btn-logout');
    if (btnLogoutHeader) {
        btnLogoutHeader.addEventListener('click', () => {
            if (confirm('¿Seguro que deseas cerrar la sesión actual?')) {
                localStorage.removeItem('sesion_chauta');
                window.location.reload();
            }
        });
    }

});

// Función global para el botón de Sidebar
window.manejarCerrarCaja = function () {
    if (confirm('¿Seguro que deseas cerrar la caja / sesión?')) {
        localStorage.removeItem('sesion_chauta');
        window.location.reload();
    }
};
