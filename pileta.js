// === CONTROL DE PILETA — Válvulas, Bomba, Filtrado y Retrolavado ===

// TIEMPOS DE RETARDO
const RETARDO_CAMBIO_VALVULA = 5000;   // ← ¡FALTABA! 5s entre cerrar una y abrir otra
const RETARDO_MANTENIMIENTO = 5000;     // ← Agregado para Mantenimiento
const RETARDO_ARRANQUE_BOMBA = 20000;   // 20s de tolerancia al cebado
const RETARDO_CORTE_FLUJO = 3000;       // 3s antes de apagar si pierde agua andando
const TIEMPO_RETROLAVADO = 120000;      // 2 minutos de retrolavado (ajustable)

// ESTADO
let valvulaPiletaActiva = null;
let bombaPiletaEncendida = false;
let bloqueoBombaPileta = false;
let modoRetrolavadoActivo = false;
let cicloMantenimientoPiletaActivo = false;  // ← Agregado
let temporizadorRetrolavado = null;

let cuentaPileta = 5;
let timerPileta;

// === CONTADOR EN PANTALLA ===
function reiniciarContadorPileta() {
    cuentaPileta = 5;
    const el = document.getElementById('contador-pileta');
    if (el) el.textContent = '5s';
    document.getElementById('contador-pileta').classList.remove('activo');
    clearInterval(timerPileta);
}

function iniciarContadorPileta() {
    reiniciarContadorPileta();
    const el = document.getElementById('contador-pileta');
    if (el) el.classList.add('activo');
    cuentaPileta = 5;
    timerPileta = setInterval(() => {
        cuentaPileta--;
        const el = document.getElementById('contador-pileta');
        if (el) el.textContent = cuentaPileta + 's';
        if (cuentaPileta <= 0) {
            clearInterval(timerPileta);
            const el = document.getElementById('contador-pileta');
            if (el) el.textContent = 'OK';
        }
    }, 1000);
}

// === ACTUALIZAR ESTADOS EN PANTALLA ===
function actualizarEstadoBombaPileta() {
    const el = document.getElementById('bomba-pileta-estado');
    if (!el) return;
    if (cicloMantenimientoPiletaActivo) {
        el.textContent = '🔧 MANTENIMIENTO';
        el.className = 'valor mantenimiento';
    } else {
        el.textContent = bombaPiletaEncendida ? '✅ ENCENDIDA' : '⏸️ APAGADA';
        el.className = bombaPiletaEncendida ? 'valor activo' : 'valor inactivo';
    }
}

function actualizarEstadoValvulasPileta() {
    // ← Agregué 'enjuague' a la lista
    const modos = ['skimmer', 'barrefondo', 'filtrado', 'retrolavado', 'enjuague', 'desagote', 'hidrojets'];
    modos.forEach(modo => {
        const el = document.getElementById('valv-' + modo);
        const btn = document.getElementById('btn-' + modo);
        if (el) {
            if (valvulaPiletaActiva === modo) {
                el.textContent = '✅ ABIERTA';
                el.className = 'valor activo';
            } else {
                el.textContent = '🔒 CERRADA';
                el.className = 'valor inactivo';
            }
        }
        if (btn) {
            if (valvulaPiletaActiva === modo) {
                btn.classList.add('activo');
            } else {
                btn.classList.remove('activo');
            }
        }
    });
}

// === ACTIVAR UN MODO DE PILETA ===
async function activarValvulaPileta(modo) {
    console.log('🔘 Botón pileta:', modo);
    if (bloqueoBombaPileta || modoRetrolavadoActivo || cicloMantenimientoPiletaActivo) return;

    const btn = document.getElementById('btn-' + modo);
    const estabaActivo = (valvulaPiletaActiva === modo);

    // Si tocamos el mismo que está activo → lo apagamos todo
    if (estabaActivo) {
        detenerTodoPileta();
        return;
    }

    bloqueoBombaPileta = true;

    // PASO 1: Apagar bomba primero si estaba encendida
    if (bombaPiletaEncendida) {
        bombaPiletaEncendida = false;
        actualizarEstadoBombaPileta();
    }

    // PASO 2: Cerrar válvula anterior
    valvulaPiletaActiva = null;
    actualizarEstadoValvulasPileta();

    // PASO 3: Esperar 5 segundos
    const estadoEl = document.getElementById('bomba-pileta-estado');
    if (estadoEl) {
        estadoEl.textContent = '⏳ CAMBIANDO...';
        estadoEl.className = 'valor esperando';
    }
    iniciarContadorPileta();
    await new Promise(r => setTimeout(r, RETARDO_CAMBIO_VALVULA));

    // PASO 4: Abrir la nueva válvula
    valvulaPiletaActiva = modo;
    actualizarEstadoValvulasPileta();

    // PASO 5: Encender bomba
    bombaPiletaEncendida = true;
    actualizarEstadoBombaPileta();

    bloqueoBombaPileta = false;
}

// === RETROLAVADO AUTOMÁTICO ===
async function iniciarRetrolavado() {
    console.log('🔄 Retrolavado iniciado');
    if (bloqueoBombaPileta || modoRetrolavadoActivo || cicloMantenimientoPiletaActivo) return;

    modoRetrolavadoActivo = true;
    bloqueoBombaPileta = true;

    // PASO 1: Apagar bomba
    bombaPiletaEncendida = false;
    actualizarEstadoBombaPileta();

    // PASO 2: Cerrar todo
    valvulaPiletaActiva = null;
    actualizarEstadoValvulasPileta();
    
    const estadoEl = document.getElementById('bomba-pileta-estado');
    if (estadoEl) {
        estadoEl.textContent = '⏳ PREPARANDO RETROLAVADO...';
        estadoEl.className = 'valor esperando';
    }
    await new Promise(r => setTimeout(r, 3000));

    valvulaPiletaActiva = 'retrolavado';
    actualizarEstadoValvulasPileta();
    bombaPiletaEncendida = true;
    actualizarEstadoBombaPileta();

    // PASO 3: Tiempo de retrolavado → Enjuague → Filtrado
    temporizadorRetrolavado = setTimeout(async () => {
        bombaPiletaEncendida = false;
        actualizarEstadoBombaPileta();
        
        await new Promise(r => setTimeout(r, 5000));
        
        // PASO 4: Enjuague
        valvulaPiletaActiva = 'enjuague';
        actualizarEstadoValvulasPileta();
        bombaPiletaEncendida = true;
        actualizarEstadoBombaPileta();
        
        await new Promise(r => setTimeout(r, 30000)); // 30s enjuague
        
        // PASO 5: Volver a Filtrado
        bombaPiletaEncendida = false;
        actualizarEstadoBombaPileta();
        
        await new Promise(r => setTimeout(r, 5000));
        
        valvulaPiletaActiva = 'filtrado';
        actualizarEstadoValvulasPileta();
        bombaPiletaEncendida = true;
        actualizarEstadoBombaPileta();
        
        modoRetrolavadoActivo = false;
        bloqueoBombaPileta = false;
        temporizadorRetrolavado = null;
    }, TIEMPO_RETROLAVADO);
}

// === 🔧 MANTENIMIENTO MENSUAL — Destrabar válvulas ===
async function iniciarMantenimientoPileta() {
    console.log('🔧 Mantenimiento pileta');
    if (bloqueoBombaPileta || modoRetrolavadoActivo || cicloMantenimientoPiletaActivo) return;

    if (!bombaPiletaEncendida) {
        alert('⚠️ Encendé la bomba primero para hacer el mantenimiento');
        return;
    }

    if (!confirm('🔧 Iniciar mantenimiento mensual?\n\nMoverá cada válvula para que no se trabe.')) {
        return;
    }

    cicloMantenimientoPiletaActivo = true;
    bloqueoBombaPileta = true;
    valvulaPiletaActiva = null;
    actualizarEstadoValvulasPileta();
    actualizarEstadoBombaPileta();

    const listaValvulas = ['skimmer', 'barrefondo', 'filtrado', 'retrolavado', 'enjuague', 'desagote', 'hidrojets'];

    for (const nombre of listaValvulas) {
        valvulaPiletaActiva = nombre;
        actualizarEstadoValvulasPileta();
        await new Promise(r => setTimeout(r, RETARDO_MANTENIMIENTO));

        valvulaPiletaActiva = null;
        actualizarEstadoValvulasPileta();
        await new Promise(r => setTimeout(r, RETARDO_MANTENIMIENTO));
    }

    cicloMantenimientoPiletaActivo = false;
    bloqueoBombaPileta = false;
    valvulaPiletaActiva = 'filtrado';
    actualizarEstadoValvulasPileta();
    actualizarEstadoBombaPileta();
    alert('✅ Mantenimiento finalizado');
}

// === DETENER TODO — Pileta ===
function detenerTodoPileta() {
    if (temporizadorRetrolavado) {
        clearTimeout(temporizadorRetrolavado);
        temporizadorRetrolavado = null;
    }
    modoRetrolavadoActivo = false;
    cicloMantenimientoPiletaActivo = false;
    bloqueoBombaPileta = false;
    valvulaPiletaActiva = null;
    bombaPiletaEncendida = false;
    actualizarEstadoValvulasPileta();
    actualizarEstadoBombaPileta();
    reiniciarContadorPileta();
}

// === VERIFICAR CARGA ===
console.log('✅ pileta.js cargado correctamente');
