// === BOMBA SUMERGIBLE - Pozo / Riego / Llenado de Pileta ===

// TIEMPOS DE RETARDO
const RETARDO_VALVULA = 15000;        // ⏱️ 15 segundos para ABRIR o CERRAR cada válvula
const RETARDO_MANTENIMIENTO = 15000;  // ⏱️ 15 segundos en mantenimiento

// ESTADO
let bombaSumergibleEncendida = false;
let valvulasBomba = { zona1: false, zona2: false, llenado: false };
let bloqueoBombaSumergible = false;
let haySinAgua = false;
let tanqueLleno = true;
let cicloMantenimientoActivo = false;

let cuentaBomba = 15;
let timerBomba;

// INICIO
actualizarEstadoTanque();
actualizarEstadoBombaSumergible();

// CONTADOR
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

// ESTADOS
function actualizarEstadoBombaSumergible() {
    const el = document.getElementById('bomba-sumergible-estado');
    if (!el) return;
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

// === CAMBIAR ESTADO DE UNA VÁLVULA — SIEMPRE ESPERA 15s ===
async function toggleValvulaBomba(nombre) {
    console.log('🔘 Tocaste:', nombre);
    if (bloqueoBombaSumergible || cicloMantenimientoActivo || haySinAgua) return;

    const btn = document.getElementById('btn-' + nombre);
    if (!btn) return;
    
    const estabaEncendida = valvulasBomba[nombre];
    const algunaAbiertaAntes = Object.values(valvulasBomba).some(v => v);
    
    // ⏱️ Mostrar estado en la VÁLVULA
    bloqueoBombaSumergible = true;
    btn.classList.add('esperando');
    const estadoValvula = document.getElementById(nombre + '-estado');
    
    if (estabaEncendida) {
        estadoValvula.textContent = '⏳ Cerrando...';
        estadoValvula.className = 'valor esperando';
        // 🔹 Si es la última → APAGAR BOMBA ENSEGUIDA
        const soloEstaAbierta = Object.entries(valvulasBomba).every(([k, v]) => k === nombre ? v : !v);
        if (soloEstaAbierta) {
            bombaSumergibleEncendida = false;
            actualizarEstadoBombaSumergible();
        }
    } else {
        estadoValvula.textContent = '⏳ Abriendo...';
        estadoValvula.className = 'valor esperando';
    }
    
    iniciarContadorBomba();
    await new Promise(r => setTimeout(r, RETARDO_VALVULA));
    
    // ✅ Terminó
    if (estabaEncendida) {
        valvulasBomba[nombre] = false;
        estadoValvula.textContent = '🔒 CERRADA';
        estadoValvula.className = 'valor inactivo';
        btn.classList.remove('activo');
    } else {
        valvulasBomba[nombre] = true;
        estadoValvula.textContent = '✅ ABIERTA';
        estadoValvula.className = 'valor activo';
        btn.classList.add('activo');
        // 🔹 Si estaba todo cerrado → ENCENDER BOMBA
        if (!algunaAbiertaAntes) {
            bombaSumergibleEncendida = true;
        }
    }
    
    btn.classList.remove('esperando');
    bloqueoBombaSumergible = false;
    actualizarEstadoBombaSumergible();
}

// 🔧 MANTENIMIENTO
async function iniciarMantenimientoBomba() {
    console.log('🔧 Mantenimiento solicitado');
    if (bloqueoBombaSumergible || haySinAgua || cicloMantenimientoActivo) return;

    if (!bombaSumergibleEncendida) {
        alert('Encendé la bomba primero para hacer el mantenimiento');
        return;
    }

    if (!confirm('Iniciar mantenimiento mensual?\n\nMoverá cada válvula para que no se trabe.')) {
        return;
    }

    cicloMantenimientoActivo = true;
    bloqueoBombaSumergible = true;
    bombaSumergibleEncendida = false;
    actualizarEstadoBombaSumergible();
    
    valvulasBomba = { zona1: false, zona2: false, llenado: false };
    Object.keys(valvulasBomba).forEach(clave => {
        const btn = document.getElementById('btn-' + clave);
        if (btn) btn.classList.remove('activo');
        document.getElementById(clave + '-estado').textContent = '🔒 CERRADA';
        document.getElementById(clave + '-estado').className = 'valor inactivo';
    });

    const listaValvulas = ['zona1', 'zona2', 'llenado'];

    for (const nombre of listaValvulas) {
        document.getElementById(nombre + '-estado').textContent = '⏳ Abriendo...';
        document.getElementById(nombre + '-estado').className = 'valor esperando';
        iniciarContadorBomba();
        await new Promise(r => setTimeout(r, RETARDO_MANTENIMIENTO));
        
        valvulasBomba[nombre] = true;
        document.getElementById(nombre + '-estado').textContent = '✅ ABIERTA';
        document.getElementById(nombre + '-estado').className = 'valor activo';
        const btn = document.getElementById('btn-' + nombre);
        if (btn) btn.classList.add('activo');
        if (nombre === listaValvulas[0]) {
            bombaSumergibleEncendida = true;
            actualizarEstadoBombaSumergible();
        }
        
        document.getElementById(nombre + '-estado').textContent = '⏳ Cerrando...';
        document.getElementById(nombre + '-estado').className = 'valor esperando';
        iniciarContadorBomba();
        await new Promise(r => setTimeout(r, RETARDO_MANTENIMIENTO));
        
        valvulasBomba[nombre] = false;
        document.getElementById(nombre + '-estado').textContent = '🔒 CERRADA';
        document.getElementById(nombre + '-estado').className = 'valor inactivo';
        if (btn) btn.classList.remove('activo');
    }

    cicloMantenimientoActivo = false;
    bloqueoBombaSumergible = false;
    bombaSumergibleEncendida = false;
    actualizarEstadoBombaSumergible();
    reiniciarContadorBomba();
    alert('Mantenimiento finalizado');
}

// DETENER TODO — APAGA BOMBA, TODAS ESPERAN JUNTAS, LUEGO CIERRAN JUNTAS
async function detenerTodoBomba() {
    if (bloqueoBombaSumergible) return;
    
    if (cicloMantenimientoActivo) {
        cicloMantenimientoActivo = false;
    }
    
    bloqueoBombaSumergible = true;
    
    // 🔹 PASO 1 — APAGAR LA BOMBA ENSEGUIDA
    bombaSumergibleEncendida = false;
    actualizarEstadoBombaSumergible();
    
    // 🔹 PASO 2 — Encontrar cuáles están abiertas
    const abiertas = Object.entries(valvulasBomba)
        .filter(([_, abierta]) => abierta)
        .map(([nombre]) => nombre);
    
    if (abiertas.length === 0) {
        bloqueoBombaSumergible = false;
        reiniciarContadorBomba();
        return;
    }
    
    // 🔹 PASO 3 — TODAS muestran "Esperando..." AL MISMO TIEMPO
    abiertas.forEach(nombre => {
        const estadoValvula = document.getElementById(nombre + '-estado');
        const btn = document.getElementById('btn-' + nombre);
        estadoValvula.textContent = '⏳ Esperando...';
        estadoValvula.className = 'valor esperando';
        if (btn) btn.classList.add('esperando');
    });
    
    // 🔹 PASO 4 — Esperar 15 segundos
    iniciarContadorBomba();
    await new Promise(r => setTimeout(r, RETARDO_VALVULA));
    
    // 🔹 PASO 5 — TODAS pasan a CERRADA JUNTAS
    abiertas.forEach(nombre => {
        valvulasBomba[nombre] = false;
        const estadoValvula = document.getElementById(nombre + '-estado');
        const btn = document.getElementById('btn-' + nombre);
        estadoValvula.textContent = '🔒 CERRADA';
        estadoValvula.className = 'valor inactivo';
        if (btn) {
            btn.classList.remove('activo', 'esperando');
        }
    });
    
    reiniciarContadorBomba();
    bloqueoBombaSumergible = false;
}

// REINICIAR SISTEMA
function reiniciarSistema() {
    haySinAgua = false;
    const alerta = document.getElementById('alerta-sinagua');
    if (alerta) alerta.classList.remove('activa');
    actualizarEstadoBombaSumergible();
}

console.log('✅ bomba_sumergible.js cargado — con emojis confirmados ✅');
