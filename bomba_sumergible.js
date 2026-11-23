// === BOMBA SUMERGIBLE - Pozo / Riego / Llenado de Pileta ===

// TIEMPOS DE RETARDO — AHORA 15 SEGUNDOS
const RETARDO_BOMBA = 15000;        // ⏱️ 15 segundos al apagar y reencender
const RETARDO_MANTENIMIENTO = 15000; // ⏱️ 15 seg abierta / 15 seg cerrada en mantenimiento

// ESTADO
let bombaSumergibleEncendida = false;
let valvulasBomba = { zona1: false, zona2: false, llenado: false };
let bloqueoBombaSumergible = false;
let haySinAgua = false;
let tanqueLleno = true;
let cicloMantenimientoActivo = false;

let cuentaBomba = 15;
let timerBomba;

// INICIO — Actualizar tanque al cargar la página
actualizarEstadoTanque();

// ACTUALIZAR CONTADOR EN PANTALLA
function reiniciarContadorBomba() {
    cuentaBomba = 15;
    const el = document.getElementById('contador-bomba');
    if (el) el.textContent = '15s';
    document.getElementById('contador-bomba').classList.remove('activo');
    clearInterval(timerBomba);
}

function iniciarContadorBomba() {
    reiniciarContadorBomba();
    document.getElementById('contador-bomba').classList.add('activo');
    cuentaBomba = 15;
    timerBomba = setInterval(() => {
        cuentaBomba--;
        const el = document.getElementById('contador-bomba');
        if (el) el.textContent = cuentaBomba + 's';
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
    if (el) {
        el.textContent = tanqueLleno ? '✅ LLENO' : '⏳ LLENÁNDOSE';
        el.className = tanqueLleno ? 'valor activo' : 'valor esperando';
    }
}

// CAMBIAR ESTADO DE UNA VÁLVULA — PERMITE VARIAS JUNTAS + 15s DE RETARDO AL REENCENDER
async function toggleValvulaBomba(nombre) {
    console.log('🔘 Tocaste:', nombre);
    if (bloqueoBombaSumergible || cicloMantenimientoActivo || haySinAgua) return;

    const btn = document.getElementById('btn-' + nombre);
    if (!btn) return;
    
    const estabaEncendida = valvulasBomba[nombre];

    // Si la APAGAMOS — no hay espera, se cierra enseguida
    if (estabaEncendida) {
        valvulasBomba[nombre] = false;
        document.getElementById(nombre + '-estado').textContent = '⏸️ CERRADO';
        document.getElementById(nombre + '-estado').className = 'valor inactivo';
        btn.classList.remove('activo');

        const algunaAbierta = Object.entries(valvulasBomba).some(([k, v]) => k !== nombre && v);
        if (!algunaAbierta) {
            bombaSumergibleEncendida = false;
        }
        actualizarEstadoBombaSumergible();
        return;
    }

    // ✅ Si la bomba está APAGADA → ESPERAR 15 SEGUNDOS antes de abrir cualquiera
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

    // ✅ Encender esta válvula — se pueden abrir varias sin esperar entre ellas
    valvulasBomba[nombre] = true;
    document.getElementById(nombre + '-estado').textContent = '✅ ABIERTO';
    document.getElementById(nombre + '-estado').className = 'valor activo';
    btn.classList.add('activo');
    bombaSumergibleEncendida = true;

    actualizarEstadoBombaSumergible();
}

// 🔧 MANTENIMIENTO — Cicla cada válvula una por una (ahora con 15s)
async function iniciarMantenimientoBomba() {
    console.log('🔧 Mantenimiento solicitado');
    if (bloqueoBombaSumergible || haySinAgua || cicloMantenimientoActivo) return;

    if (!bombaSumergibleEncendida) {
        alert('⚠️ Encendé la bomba primero para hacer el mantenimiento');
        return;
    }

    if (!confirm('🔧 Iniciar mantenimiento mensual?\n\nMoverá cada válvula para que no se trabe.')) {
        return;
    }

    cicloMantenimientoActivo = true;
    bloqueoBombaSumergible = true;
    valvulasBomba = { zona1: false, zona2: false, llenado: false };
    Object.keys(valvulasBomba).forEach(clave => {
        const btn = document.getElementById('btn-' + clave);
        if (btn) btn.classList.remove('activo');
        document.getElementById(clave + '-estado').textContent = '⏸️ CERRADO';
        document.getElementById(clave + '-estado').className = 'valor inactivo';
    });
    actualizarEstadoBombaSumergible();

    const listaValvulas = ['zona1', 'zona2', 'llenado'];

    for (const nombre of listaValvulas) {
        valvulasBomba[nombre] = true;
        document.getElementById(nombre + '-estado').textContent = '✅ ABIERTO';
        document.getElementById(nombre + '-estado').className = 'valor activo';
        const btn = document.getElementById('btn-' + nombre);
        if (btn) btn.classList.add('activo');
        actualizarEstadoBombaSumergible();
        await new Promise(r => setTimeout(r, RETARDO_MANTENIMIENTO));

        valvulasBomba[nombre] = false;
        document.getElementById(nombre + '-estado').textContent = '⏸️ CERRADO';
        document.getElementById(nombre + '-estado').className = 'valor inactivo';
        if (btn) btn.classList.remove('activo');
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
        const btn = document.getElementById('btn-' + clave);
        if (btn) btn.classList.remove('activo');
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
    const alerta = document.getElementById('alerta-sinagua');
    if (alerta) alerta.classList.remove('activa');
    actualizarEstadoBombaSumergible();
}

console.log('✅ bomba_sumergible.js cargado — Retardo: 15s | Mantenimiento: 15s');
