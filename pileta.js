// === CONTROL DE PILETA — Válvulas, Bomba, Filtrado y Retrolavado ===

// TIEMPOS DE RETARDO
const RETARDO_CAMBIO_VALVULA = 5000;   // 5s entre cerrar una y abrir otra
const RETARDO_MANTENIMIENTO = 5000;     // 5s abierta / 5s cerrada
const RETARDO_ARRANQUE_BOMBA = 20000;   // 20s de tolerancia al cebado
const RETARDO_CORTE_FLUJO = 3000;       // 3s antes de apagar si pierde agua andando
const TIEMPO_RETROLAVADO = 120000;       // 2 minutos de retrolavado (ajustable)

// ESTADO
let valvulaPiletaActiva = null;
let bombaPiletaEncendida = false;
let bloqueoBombaPileta = false;
let modoRetrolavadoActivo = false;
let cicloMantenimientoPiletaActivo = false;
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

    const estabaActivo = (valvulaPiletaActiva === modo);

    if (estabaActivo) {
        detenerTodoPileta();
        return;
    }

    bloqueoBombaPileta = true;

    if (bombaPiletaEncendida) {
        bombaPiletaEncendida = false;
        actualizarEstadoBombaPileta();
    }

    valvulaPiletaActiva = null;
    actualizarEstadoValvulasPileta();

    const estadoEl = document.getElementById('bomba-pileta-estado');
    if (estadoEl) {
        estadoEl.textContent = '⏳ CAMBIANDO...';
        estadoEl.className = 'valor esperando';
    }
    iniciarContadorPileta();
    await new Promise(r => setTimeout(r, RETARDO_CAMBIO_VALVULA));

    valvulaPiletaActiva = modo;
    actualizarEstadoValvulasPileta();

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

    bombaPiletaEncendida = false;
    actualizarEstadoBombaPileta();

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

    temporizadorRetrolavado = setTimeout(async () => {
        bombaPiletaEncendida = false;
        actualizarEstadoBombaPileta();
        
        await new Promise(r => setTimeout(r, 5000));
        
        valvulaPiletaActiva = 'enjuague';
        actualizarEstadoValvulasPileta();
        bombaPiletaEncendida = true;
        actualizarEstadoBombaPileta();
        
        await new Promise(r => setTimeout(r, 30000));
        
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

// === 🔧 MANTENIMIENTO ===
async function iniciarMantenimientoPileta() {
    console.log('🔧 Mantenimiento pileta');
    if (bloqueoBombaPileta || modoRetrolavadoActivo || cicloMantenimientoPiletaActivo) return;

    if (!bombaPiletaEncendida) {
        alert('⚠️ Encendé la bomba primero');
        return;
    }

    if (!confirm('🔧 Iniciar mantenimiento mensual?')) return;

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

// === DETENER TODO ===
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

// === INICIO — Verificar carga ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ pileta.js cargado correctamente');
});
