// === Pileta Smart — Control de Válvulas ===

let valvulaPiletaActiva = null;
let bombaPiletaEncendida = false;
let cambiando = false; // Evita doble clic mientras cambia

// Quité "enjuague" de la lista
const modos = ['skimmer', 'barrefondo', 'filtrado', 'retrolavado', 'desagote', 'hidrojets'];

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

window.activarValvulaPileta = async function(modo) {
    console.log('👉 Tocado:', modo);
    
    if (cambiando) {
        console.log('⏳ Esperando, todavía está cambiando...');
        return;
    }
    
    // Si es la misma que ya está activa → la apagamos
    if (valvulaPiletaActiva === modo) {
        valvulaPiletaActiva = null;
        bombaPiletaEncendida = false;
        actualizarTodo();
        return;
    }
    
    cambiando = true;
    
    // PASO 1: Cerramos la válvula actual
    console.log('🔒 Cerrando:', valvulaPiletaActiva || 'ninguna');
    valvulaPiletaActiva = null;
    bombaPiletaEncendida = false;
    actualizarTodo();
    
    // PASO 2: Esperamos 15 segundos para que termine de cerrar
    console.log('⏳ Esperando 15 segundos...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // PASO 3: Abrimos la nueva válvula
    console.log('🔓 Abriendo:', modo);
    valvulaPiletaActiva = modo;
    bombaPiletaEncendida = true;
    actualizarTodo();
    
    cambiando = false;
    console.log('✅ Cambio completado');
};

window.detenerTodoPileta = function() {
    valvulaPiletaActiva = null;
    bombaPiletaEncendida = false;
    cambiando = false;
    actualizarTodo();
    console.log('⏹️ Todo detenido');
};

console.log('✅ Pileta.js cargado — Enjuague eliminado | 15s de retardo agregado');
