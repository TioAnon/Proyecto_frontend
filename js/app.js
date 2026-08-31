/**
 * ============================================================================
 * 1. MÓDULO DE ESTADO (Simulación de Datos Académicos)
 * Manejo de los estados requeridos: pendiente, en progreso, completada.
 * ============================================================================
 */
let matrizActividades = [
    {
        id: crypto.randomUUID(),
        nombre: "Diseñar sistema de alerta temprana de deserción",
        asignatura: "Taller de Ingeniería de Software",
        fecha: "2026-09-02", // Fecha próxima para disparar alerta visual
        estado: "en progreso"
    },
    {
        id: crypto.randomUUID(),
        nombre: "Desarrollo GestorGimnasio en C++",
        asignatura: "PTEC102",
        fecha: "2026-04-15",
        estado: "completada"
    },
    {
        id: crypto.randomUUID(),
        nombre: "Evaluación de algoritmos de clasificación",
        asignatura: "Machine Learning",
        fecha: "2026-09-10",
        estado: "pendiente"
    }
];

/**
 * ============================================================================
 * 2. PUNTEROS DE INTERFAZ (DOM Selectors)
 * ============================================================================
 */
const ui = {
    formRegistro: document.getElementById('form-actividad'),
    formEdicion: document.getElementById('form-edicion'),
    contenedor: document.getElementById('contenedor-tareas'),
    alertas: document.getElementById('alert-container'),
    contador: document.getElementById('contador-tareas'),
    barraProgreso: document.getElementById('barra-progreso'),
    filtroAsignatura: document.getElementById('filtro-asignatura'),
    filtroEstado: document.getElementById('filtro-estado')
};

// Instancia de Bootstrap Modal para el formulario de edición
const modalInstancia = new bootstrap.Modal(document.getElementById('modalEdicion'));

/**
 * ============================================================================
 * 3. MOTORES DE CÁLCULO (Avance y Vencimiento)
 * ============================================================================
 */
const actualizarProgreso = () => {
    if (matrizActividades.length === 0) {
        ui.barraProgreso.style.width = '0%';
        ui.barraProgreso.innerText = '0%';
        return;
    }
    const completadas = matrizActividades.filter(act => act.estado === 'completada').length;
    const porcentaje = Math.round((completadas / matrizActividades.length) * 100);
    
    ui.barraProgreso.style.width = `${porcentaje}%`;
    ui.barraProgreso.setAttribute('aria-valuenow', porcentaje);
    ui.barraProgreso.innerText = `${porcentaje}% Completado`;
    
    // Mutación visual del color de la barra según el progreso
    ui.barraProgreso.className = `progress-bar ${porcentaje === 100 ? 'bg-success' : 'bg-primary'}`;
};

const evaluarVencimiento = (fecha, estado) => {
    if (estado === 'completada') return { clase: '', texto: '' };
    
    const fechaEntrega = new Date(fecha);
    const hoy = new Date();
    // Normalización de horas para evitar errores de zona horaria
    fechaEntrega.setHours(0,0,0,0);
    hoy.setHours(0,0,0,0);
    
    const difTiempo = fechaEntrega.getTime() - hoy.getTime();
    const difDias = Math.ceil(difTiempo / (1000 * 3600 * 24));

    if (difDias < 0) return { clase: 'border-danger bg-danger text-white', texto: '¡Vencida!' };
    if (difDias <= 3) return { clase: 'border-warning bg-warning text-dark', texto: '¡Próxima a vencer!' };
    return { clase: '', texto: '' };
};

/**
 * ============================================================================
 * 4. MOTOR DE RENDERIZADO Y FILTRADO[cite: 2]
 * ============================================================================
 */
const renderizarTareas = () => {
    // Captura de parámetros de filtrado
    const strFiltro = ui.filtroAsignatura.value.toLowerCase();
    const estFiltro = ui.filtroEstado.value;

    // Aplicación del pipeline de filtrado
    const filtradas = matrizActividades.filter(act => {
        const coincideAsignatura = act.asignatura.toLowerCase().includes(strFiltro);
        const coincideEstado = estFiltro === 'todos' || act.estado === estFiltro;
        return coincideAsignatura && coincideEstado;
    });

    ui.contenedor.innerHTML = '';
    ui.contador.innerText = `Mostrando: ${filtradas.length}`;
    actualizarProgreso(); // Actualiza el KPI global[cite: 2]

    if (filtradas.length === 0) {
        ui.contenedor.innerHTML = `<div class="alert alert-secondary w-100 text-center">No se encontraron actividades con los filtros actuales.</div>`;
        return;
    }

    // Inyección en el DOM
    filtradas.forEach(actividad => {
        const alertaVen = evaluarVencimiento(actividad.fecha, actividad.estado);
        
        let colorBadge = 'bg-secondary';
        if (actividad.estado === 'pendiente') colorBadge = 'bg-danger';
        if (actividad.estado === 'en progreso') colorBadge = 'bg-warning text-dark';
        if (actividad.estado === 'completada') colorBadge = 'bg-success';

        const nodo = document.createElement('div');
        nodo.className = `card custom-card h-100 ${alertaVen.clase ? 'border-2 ' + alertaVen.clase.split(' ')[0] : ''}`;
        
        nodo.innerHTML = `
            <div class="card-body d-flex flex-column">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <span class="badge bg-dark">${actividad.asignatura}</span>
                    <span class="badge ${colorBadge}">${actividad.estado.toUpperCase()}</span>
                </div>
                <h5 class="card-title mt-2">${actividad.nombre}</h5>
                <p class="card-text text-muted small mb-1">📅 Entrega: ${actividad.fecha}</p>
                ${alertaVen.texto ? `<p class="fw-bold ${alertaVen.clase} px-2 py-1 rounded small text-center">${alertaVen.texto}</p>` : ''}
                
                <div class="mt-auto d-flex gap-2 pt-3 border-top">
                    <button class="btn btn-sm btn-outline-primary w-50" onclick="abrirModalEdicion('${actividad.id}')">
                        Editar
                    </button>
                    <button class="btn btn-sm btn-outline-danger w-50" onclick="eliminarTarea('${actividad.id}')">
                        Eliminar
                    </button>
                </div>
            </div>
        `;
        ui.contenedor.appendChild(nodo);
    });
};

/**
 * ============================================================================
 * 5. CONTROLADORES CRUD (Lógica de Negocio)
 * ============================================================================
 */
window.eliminarTarea = (id) => {
    if(confirm("¿Confirmar eliminación del registro en memoria?")) {
        matrizActividades = matrizActividades.filter(item => item.id !== id);
        renderizarTareas();
        emitirLog('Actividad eliminada del sistema.', 'danger');
    }
};

window.abrirModalEdicion = (id) => {
    const act = matrizActividades.find(item => item.id === id);
    if (!act) return;
    
    // Poblar el modal con los datos actuales
    document.getElementById('editId').value = act.id;
    document.getElementById('editNombre').value = act.nombre;
    document.getElementById('editAsignatura').value = act.asignatura;
    document.getElementById('editFecha').value = act.fecha;
    document.getElementById('editEstado').value = act.estado;
    
    modalInstancia.show(); // Desplegar ventana flotante[cite: 2]
};

/**
 * ============================================================================
 * 6. SISTEMA DE LOGS Y EVENTOS DE INTERFAZ
 * ============================================================================
 */
const emitirLog = (msj, tipo) => {
    ui.alertas.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show shadow-sm">
            ${msj}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    setTimeout(() => { ui.alertas.innerHTML = ''; }, 4000);
};

document.addEventListener('DOMContentLoaded', () => {
    // Renderizado inicial
    renderizarTareas();

    // Eventos de los inputs de filtrado[cite: 2]
    ui.filtroAsignatura.addEventListener('input', renderizarTareas);
    ui.filtroEstado.addEventListener('change', renderizarTareas);

    // Evento: Crear nueva actividad
    ui.formRegistro.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!ui.formRegistro.checkValidity()) {
            ui.formRegistro.classList.add('was-validated');
            emitirLog('Error de validación: Complete todos los campos.', 'warning');
            return;
        }

        matrizActividades.push({
            id: crypto.randomUUID(),
            nombre: document.getElementById('inputNombre').value,
            asignatura: document.getElementById('inputAsignatura').value,
            fecha: document.getElementById('inputFecha').value,
            estado: document.getElementById('inputEstado').value
        });
        
        ui.formRegistro.reset();
        ui.formRegistro.classList.remove('was-validated');
        renderizarTareas();
        emitirLog('Nueva actividad registrada exitosamente.', 'success');
    });

    // Evento: Guardar edición de actividad[cite: 2]
    ui.formEdicion.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!ui.formEdicion.checkValidity()) {
            ui.formEdicion.classList.add('was-validated');
            return;
        }

        const idTarget = document.getElementById('editId').value;
        const indice = matrizActividades.findIndex(item => item.id === idTarget);
        
        if (indice !== -1) {
            matrizActividades[indice] = {
                id: idTarget,
                nombre: document.getElementById('editNombre').value,
                asignatura: document.getElementById('editAsignatura').value,
                fecha: document.getElementById('editFecha').value,
                estado: document.getElementById('editEstado').value
            };
            modalInstancia.hide();
            renderizarTareas();
            emitirLog('Registro modificado correctamente.', 'info');
        }
    });
});