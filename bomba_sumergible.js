// === BOMBA SUMERGIBLE - Pozo / Riego / Llenado de Pileta ===

// TIEMPOS DE RETARDO
const RETARDO_BOMBA = 5000;   // 5 segundos entre cambio de válvula y bomba

// ESTADO
let bombaSumergibleEncendida = false;
let valvulasBomba = { zona1: false, zona2: false, llenado: false };
let bloqueoBombaSumergible = false;
let haySinAgua = false;
let tanqueLleno = true;

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

// CAMBIAR ESTADO DE UNA VÁLVULA
async function toggleValvulaBomba(nombre) {
    if (bloqueoBombaSumergible || haySinAgua) return;

    const btn = document.getElementById('btn-' + nombre);
    const estabaEncendida = valvulasBomba[nombre];

    // Si no estaba encendida y la bomba está apagada, esperamos
    if (!estabaEncendida && !bombaSumergibleEncendida) {
        bloqueoBombaSumergible = true;
        btn.classList.add('esperando');
        document.getElementById('bomba-sumergible-estado').textContent = '⏳ ESPERANDO...';
        document.getElementById('bomba-sumergible-estado').className = 'valor esperando';
        iniciarContadorBomba();
        await new Promise(r => setTimeout(r, RETARDO_BOMBA));
        btn.classList.remove('esperando');
        bloqueoBombaSumergible = false;
    }

    // Cerrar todas las demás válvulas
    Object.keys(valvulasBomba).forEach(clave => {
        if (clave !== nombre && valvulasBomba[clave]) {
            valvulasBomba[clave] = false;
            document.getElementById('btn-' + clave).classList.remove('activo');
            document.getElementById(clave + '-estado').textContent = '⏸️ CERRADO';
            document.getElementById(clave + '-estado').className = 'valor inactivo';
        }
    });

    // Cambiar estado de la válvula seleccionada
    valvulasBomba[nombre] = !estabaEncendida;
    const elEstado = document.getElementById(nombre + '-estado');

    if (valvulasBomba[nombre]) {
        elEstado.textContent = '✅ ABIERTO';
        elEstado.className = 'valor activo';
        btn.classList.add('activo');
        bombaSumergibleEncendida = true;
    } else {
        elEstado.textContent = '⏸️ CERRADO';
        elEstado.className = 'valor inactivo';
        btn.classList.remove('activo');
        
        // Si todas están cerradas, apagamos la bomba
        const algunaAbierta = Object.values(valvulasBomba).some(v => v);
        if (!algunaAbierta) {
            bombaSumergibleEncendida = false;
        }
    }
    
    actualizarEstadoBombaSumergible();
}

// DETENER TODO — Bomba sumergible
function detenerTodoBomba() {
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
