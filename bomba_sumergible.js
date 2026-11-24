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

// === AUTOAPAGADO — LA PLACA ES LA QUE CUENTA Y APAGA, LA WEB SOLO MUESTRA ===
let tiempoSeleccionado = 0;           // minutos elegidos por el usuario
let cuentaRestante = 0;               // lo que muestra la web
let temporizadorWeb = null;           // solo para mostrar la cuenta en pantalla
let autoapagadoActivo = false;

// Abrir el recuadro del temporizador
function abrirTemporizador(sistema) {
    const modal = document.getElementById('modal-temporizador');
    modal.innerHTML = `
        <div id="fondo-temporizador" class="modal-fondo activo" onclick="cerrarTemporizador(event)">
            <div class="modal-contenido" onclick="event.stopPropagation()">
                <h3>⏱️ Autoapagado por Inactividad</h3>
                <p class="subtitulo">Seleccioná cuándo apagar automáticamente</p>
                
                <div class="opcion-tiempo" data-minutos="30" onclick="seleccionarTiempo(30, this)">
                    <strong>30 minutos</strong>
                </div>
                <div class="opcion-tiempo" data-minutos="60" onclick="seleccionarTiempo(60, this)">
                    <strong>1 hora</strong>
                </div>
                <div class="opcion-tiempo" data-minutos="120" onclick="seleccionarTiempo(120, this)">
                    <strong>2 horas</strong>
                </div>
                <div class="opcion-tiempo" data-minutos="0" onclick="seleccionarTiempo(0, this)">
                    <strong>❌ Desactivar</strong>
                </div>
                
                <div class="hora-apagado" id="hora-apagado">
                    Seleccioná un tiempo
                </div>
                
                <div class="botones-modal">
                    <button class="boton-modal-cancelar" onclick="cerrarTemporizador()">❌ Cancelar</button>
                    <button class="boton-modal-confirmar" onclick="confirmarAutoapagado()">✅ Confirmar</button>
                </div>
            </div>
        </div>
    `;
    tiempoSeleccionado = 0;
}

// Elegir un tiempo
function seleccionarTiempo(minutos, elemento) {
    tiempoSeleccionado = minutos;
    
    document.querySelectorAll('.opcion-tiempo').forEach(el => el.classList.remove('seleccionado'));
    elemento.classList.add('seleccionado');
    
    const horaTexto = document.getElementById('hora-apagado');
    if (minutos === 0) {
        horaTexto.textContent = '❌ Autoapagado desactivado';
    } else {
        const ahora = new Date();
        const apagarA = new Date(ahora.getTime() + minutos * 60000);
        const h = apagarA.getHours().toString().padStart(2, '0');
        const m = apagarA.getMinutes().toString().padStart(2, '0');
        horaTexto.innerHTML = `⏰ Se apaga a las <strong>${h}:${m}</strong>`;
    }
}

// Confirmar y enviar a la PLACA — LA PLACA ES LA QUE MANDA
function confirmarAutoapagado() {
    cerrarTemporizador();
    
    if (tiempoSeleccionado === 0) {
        // Cancelar en la placa
        enviarComandoAPlaca('AUTOAPAGADO:BOMBA:0');
        detenerCuentaWeb();
        autoapagadoActivo = false;
        alert('❌ Autoapagado desactivado');
        return;
    }
    
    // ✅ Enviar a la placa — ELLA cuenta y apaga
    enviarComandoAPlaca(`AUTOAPAGADO:BOMBA:${tiempoSeleccionado}`);
    
    // ✅ La web solo muestra la cuenta, NO decide apagar
    iniciarCuentaWeb(tiempoSeleccionado);
    autoapagadoActivo = true;
    
    alert(`✅ Enviado a la placa: se apaga en ${tiempoSeleccionado} minutos\nLa placa es la que controla el tiempo`);
}

// ⏱️ La web solo muestra la cuenta regresiva
function iniciarCuentaWeb(minutos) {
    detenerCuentaWeb();
    cuentaRestante = minutos * 60; // en segundos
    
    const actualizarDisplay = () => {
        if (cuentaRestante <= 0) {
            if (temporizadorWeb) clearInterval(temporizadorWeb);
            temporizadorWeb = null;
            return;
        }
        const h = Math.floor(cuentaRestante / 3600);
        const m = Math.floor((cuentaRestante % 3600) / 60);
        // Podés mostrarlo donde quieras en la interfaz
        console.log(`⏳ Falta: ${h}h ${m}m — LA PLACA CUENTA REALMENTE`);
        cuentaRestante--;
    };
    
    actualizarDisplay();
    temporizadorWeb = setInterval(actualizarDisplay, 1000);
}

// Detener la cuenta visual
function detenerCuentaWeb() {
    if (temporizadorWeb) {
        clearInterval(temporizadorWeb);
        temporizadorWeb = null;
    }
    cuentaRestante = 0;
}

// ✅ Cada vez que el usuario hace algo → avisar a la placa que reinicie su cuenta
function reiniciarCuentaEnPlaca() {
    if (!autoapagadoActivo || tiempoSeleccionado === 0) return;
    enviarComandoAPlaca(`AUTOAPAGADO:BOMBA:REINICIAR:${tiempoSeleccionado}`);
    iniciarCuentaWeb(tiempoSeleccionado); // Reiniciar también el display de la web
}

// Cerrar recuadro
function cerrarTemporizador(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('modal-temporizador').innerHTML = '';
}

// 📡 ENVIAR COMANDO A LA PLACA — acá conectás con tu ESP32
function enviarComandoAPlaca(comando) {
    console.log('📡 Enviando a la placa:', comando);
    // Acá va tu código real de comunicación con la placa:
    // fetch, WebSocket, o lo que uses
    // Ejemplo básico: fetch('/comando?cmd=' + encodeURIComponent(comando))
}

// INICIO — Mostrar 🔒 CERRADA desde el primer momento
function inicializarValvulas() {
    const nombres = ['zona1', 'zona2', 'llenado'];
    nombres.forEach(nombre => {
        const el = document.getElementById(nombre + '-estado');
        if (el) {
            el.textContent = '🔒 CERRADA';
            el.className = 'valor inactivo';
        }
    });
}

inicializarValvulas();
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

// === CAMBIAR ESTADO DE UNA VÁLVULA ===
async function toggleValvulaBomba(nombre) {
    console.log('🔘 Tocaste:', nombre);
    if (bloqueoBombaSumergible || cicloMantenimientoActivo || haySinAgua) return;

    // ✅ Cada acción del usuario → la placa reinicia su cuenta
    reiniciarCuentaEnPlaca();

    const btn = document.getElementById('btn-' + nombre);
    if (!btn) return;
    
    const estabaEncendida = valvulasBomba[nombre];
    const cantidadAbiertaAntes = Object.values(valvulasBomba).filter(v => v).length;
    
    bloqueoBombaSumergible = true;
    btn.classList.add('esperando');
    const estadoValvula = document.getElementById(nombre + '-estado');
    
    if (estabaEncendida) {
        estadoValvula.textContent = '⏳ Cerrando...';
        estadoValvula.className = 'valor esperando';
        
        const esLaUltima = cantidadAbiertaAntes === 1;
        if (esLaUltima) {
            bombaSumergibleEncendida = false;
            actualizarEstadoBombaSumergible();
        }
        
        iniciarContadorBomba();
        await new Promise(r => setTimeout(r, RETARDO_VALVULA));
        
        valvulasBomba[nombre] = false;
        estadoValvula.textContent = '🔒 CERRADA';
        estadoValvula.className = 'valor inactivo';
        btn.classList.remove('activo');
        
    } else {
        estadoValvula.textContent = '⏳ Abriendo...';
        estadoValvula.className = 'valor esperando';
        
        iniciarContadorBomba();
        await new Promise(r => setTimeout(r, RETARDO_VALVULA));
        
        valvulasBomba[nombre] = true;
        estadoValvula.textContent = '✅ ABIERTA';
        estadoValvula.className = 'valor activo';
        btn.classList.add('activo');
        
        if (cantidadAbiertaAntes === 0) {
            bombaSumergibleEncendida = true;
            actualizarEstadoBombaSumergible();
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

    // ✅ Reiniciar cuenta en la placa
    reiniciarCuentaEnPlaca();

    if (!bombaSumergibleEncendida) {
        alert('Encendé la bomba primero para hacer el mantenimiento');
        return;
    }

    if (!confirm('Iniciar mantenimiento mensual?\\n\\nMoverá cada válvula para que no se trabe.')) {
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

// DETENER TODO — la web solo avisa a la placa si hay autoapagado activo
async function detenerTodoBomba() {
    if (bloqueoBombaSumergible) return;
    
    // ✅ Si se apaga manual → avisar a la placa que cancele
    if (autoapagadoActivo) {
        enviarComandoAPlaca('AUTOAPAGADO:BOMBA:0');
        detenerCuentaWeb();
        autoapagadoActivo = false;
    }
    
    if (cicloMantenimientoActivo) {
        cicloMantenimientoActivo = false;
    }
    
    bloqueoBombaSumergible = true;
    
    bombaSumergibleEncendida = false;
    actualizarEstadoBombaSumergible();
    
    const abiertas = Object.entries(valvulasBomba)
        .filter(([_, abierta]) => abierta)
        .map(([nombre]) => nombre);
    
    if (abiertas.length === 0) {
        bloqueoBombaSumergible = false;
        reiniciarContadorBomba();
        return;
    }
    
    abiertas.forEach(nombre => {
        const estadoValvula = document.getElementById(nombre + '-estado');
        const btn = document.getElementById('btn-' + nombre);
        estadoValvula.textContent = '⏳ Cerrando...';
        estadoValvula.className = 'valor esperando';
        if (btn) btn.classList.add('esperando');
    });
    
    iniciarContadorBomba();
    await new Promise(r => setTimeout(r, RETARDO_VALVULA));
    
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

console.log('✅ bomba_sumergible.js cargado
