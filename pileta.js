// === PRUEBA SIMPLE — Pileta ===

let valvulaPiletaActiva = null;
let bombaPiletaEncendida = false;

const modos = ['skimmer', 'barrefondo', 'filtrado', 'retrolavado', 'enjuague', 'desagote', 'hidrojets'];

function actualizarTodo() {
    modos.forEach(modo => {
        const el = document.getElementById('valv-' + modo);
        const btn = document.getElementById('btn-' + modo);
        if (el) {
            el.textContent = valvulaPiletaActiva === modo ? '✅ ABIERTA' : '🔒 CERRADA';
            el.className = valvulaPiletaActiva === modo ? 'valor activo' : 'valor inactivo';
        }
        if (btn) {
            valvulaPiletaActiva === modo ? btn.classList.add('activo') : btn.classList.remove('activo');
        }
    });
    const estadoBomba = document.getElementById('bomba-pileta-estado');
    if (estadoBomba) {
        estadoBomba.textContent = bombaPiletaEncendida ? '✅ ENCENDIDA' : '⏸️ APAGADA';
        estadoBomba.className = bombaPiletaEncendida ? 'valor activo' : 'valor inactivo';
    }
}

window.activarValvulaPileta = function(modo) {
    console.log('👉 Tocado:', modo);
    
    if (valvulaPiletaActiva === modo) {
        valvulaPiletaActiva = null;
        bombaPiletaEncendida = false;
    } else {
        valvulaPiletaActiva = modo;
        bombaPiletaEncendida = true;
    }
    actualizarTodo();
};

window.detenerTodoPileta = function() {
    valvulaPiletaActiva = null;
    bombaPiletaEncendida = false;
    actualizarTodo();
};

console.log('✅ Pileta.js cargado');
