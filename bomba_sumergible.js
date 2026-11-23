// === BOMBA SUMERGIBLE - Pozo / Riego / Llenado de Pileta ===

// TIEMPOS DE RETARDO
const RETARDO_BOMBA = 5000;        // 5 segundos al apagar y reencender
const RETARDO_MANTENIMIENTO = 5000; // 5 seg abierta / 5 seg cerrada en mantenimiento

// ESTADO
let bombaSumergibleEncendida = false;
let valvulasBomba = { zona1: false, zona2: false, llenado: false };
let bloqueoBombaSumergible = false;
let haySinAgua = false;
let tanqueLleno = true;
let cicloMantenimientoActivo = false;

let cuentaBomba = 5;
let timerBomba;

// ACTUALIZAR CONTADOR EN PANTALLA
function reiniciarContadorBomba() {
    cuentaBomba = 5;
    document.getElementById('contador-bomba').textContent = '5s';
    document.getElementById('contador-bomba').classList.remove('activo');
    clearInterval(timerBomba);
}

function iniciarContadorBomba() {
    reiniciarContadorBomba();
    document.getElementById('contador-bomba').classList.add('activo');
    cuentaBomba = 5;
    timerBomba = setInterval(() => {
        cuentaBomba--;
        document.getElementById('contador-bomba').textContent = cuentaBomba + 's';
        if (cuentaBomba <= 0) {
            clearInterval(timerBomba);
            document.getElementById('contador-bomba').textContent = 'OK';
        }
    }, 1000);
}

// ACTUALIZAR ESTADOS EN PANTALLA
function actualizarEstadoBombaSumergible() {
    const el = document.getElementById('bomba-sumergible-estado');
    if (haySinAgua) {
        el.textContent = '⚠️ SIN AGUA';
        el.className = 'valor sinagua';
    } else if (cicloMantenimientoActivo) {
        el.textContent = '🔧 MANTENIMIENTO';
        el.className = 'valor mantenimiento';
    } else {
        el.textContent = bombaSumergibleEncendida ? '✅ ENCENDIDA' : '⏸️ APAGADA';
        el.className = bombaSumergibleEncendida ? 'valor activo' : 'valor inactivo';
    }
}

function actualizarEstadoTanque() {
    const el = document.getElementById('tanque-estado');
    el.textContent = tanqueLleno ? '✅ LLENO' : '⏳ LLENÁNDOSE';
    el.className = tanqueLleno ? 'valor activo' : 'valor esperando';
}

// CAMBIAR ESTADO DE UNA VÁLVULA — AHORA PERMITE VARIAS JUNTAS
async function toggleValvulaBomba(nombre) {
    if (bloqueoBombaSumergible || cicloMantenimientoActivo || haySinAgua) return;

    const btn = document.getElementById('btn-' + nombre);
    const estabaEncendida = valvulasBomba[nombre];

    // Si la APAGAMOS y la bomba estaba encendida, y hay que reencender luego → 5 seg de espera
    if (estabaEncendida) {
        // Apagamos esta válvula
        valvulasBomba[nombre] = false;
        document.getElementById(nombre + '-estado').textContent = '⏸️ CERRADO';
        document.getElementById(nombre + '-estado').className = 'valor inactivo';
        btn.classList.remove('activo');

        // Si no queda ninguna válvula abierta → apagamos la bomba
        const algunaAbierta = Object.entries(valvulasBomba).some(([k, v]) => k !== nombre && v);
        if (!algunaAbierta) {
            bombaSumergibleEncendida = false;
        }
        actualizarEstadoBombaSumergible();
        return;
    }

    // Si la bomba está apagada → esperamos 5 seg antes de encender
    if (!bombaSumergibleEncendida) {
        bloqueoBombaSumergible = true;
        btn.classList.add('esperando');
        document.getElementById('bomba-sumergible-estado').textContent = '⏳ ESPERANDO...';
        document.getElementById('bomba-sumergible-estado').className = 'valor esperando';
        iniciarContadorBomba();
        await new Promise(r => setTimeout(r, RETARDO_BOMBA));
        btn.classList.remove('esperando');
        bloqueoBombaSumergible = false;
    }

    // Encendemos esta válvula — NO cerramos las demás, pueden ir juntas
    valvulasBomba[nombre] = true;
    document.getElementById(nombre + '-estado').textContent = '✅ ABIERTO';
    document.getElementById(nombre + '-estado').className = 'valor activo';
    btn.classList.add('activo');
    bombaSumergibleEncendida = true;

    actualizarEstadoBombaSumergible();
}

// 🔧 MANTENIMIENTO — Cicla cada válvula una por una
async function iniciarMantenimientoBomba() {
    if (bloqueoBombaSumergible || haySinAgua || cicloMantenimientoActivo) return;

    // Verificamos que la bomba esté encendida
    if (!bombaSumergibleEncendida) {
        alert('⚠️ Encendé la bomba primero para hacer el mantenimiento');
        return;
    }

    // Confirmación
    if (!confirm('🔧 Iniciar mantenimiento mensual?\n\nMoverá cada válvula para que no se trabe.')) {
        return;
    }

    cicloMantenimientoActivo = true;
    bloqueoBombaSumergible = true;
    actualizarEstadoBombaSumergible();

    const listaValvulas = ['zona1', 'zona2', 'llenado'];

    for (const nombre of listaValvulas) {
        // Abrir válvula
        valvulasBomba[nombre] = true;
        document.getElementById(nombre + '-estado').textContent = '✅ ABIERTO';
        document.getElementById(nombre + '-estado').className = 'valor activo';
        document.getElementById('btn-' + nombre).classList.add('activo');
        actualizarEstadoBombaSumergible();
        await new Promise(r => setTimeout(r, RETARDO_MANTENIMIENTO));

        // Cerrar válvula
        valvulasBomba[nombre] = false;
        document.getElementById(nombre + '-estado').textContent = '⏸️ CERRADO';
        document.getElementById(nombre + '-estado').className = 'valor inactivo';
        document.getElementById('btn-' + nombre).classList.remove('activo');
        await new Promise(r => setTimeout(r, RETARDO_MANTENIMIENTO));
    }

    cicloMantenimientoActivo = false;
    bloqueoBombaSumergible = false;
    actualizarEstadoBombaSumergible();
    alert('✅ Mantenimiento finalizado');
}

// DETENER TODO — Bomba sumergible
function detenerTodoBomba() {
    if (cicloMantenimientoActivo) {
        cicloMantenimientoActivo = false;
        bloqueoBombaSumergible = false;
    }
    Object.keys(valvulasBomba).forEach(clave => {
        valvulasBomba[clave] = false;
        document.getElementById('btn-' + clave).classList.remove('activo');
        document.getElementById(clave + '-estado').textContent = '⏸️ CERRADO';
        document.getElementById(clave + '-estado').className = 'valor inactivo';
    });
    bombaSumergibleEncendida = false;
    actualizarEstadoBombaSumergible();
    reiniciarContadorBomba();
}

// REINICIAR SISTEMA tras alerta sin agua
function reiniciarSistema() {
    haySinAgua = false;
    document.getElementById('alerta-sinagua').classList.remove('activa');
    actualizarEstadoBombaSumergible();
}
