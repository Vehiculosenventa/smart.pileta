// DETENER TODO — APAGA PRIMERO, LUEGO CIERRA TODAS LAS VÁLVULAS
async function detenerTodoBomba() {
    if (bloqueoBombaSumergible) return;
    
    if (cicloMantenimientoActivo) {
        cicloMantenimientoActivo = false;
    }
    
    bloqueoBombaSumergible = true;
    
    // 🔹 PASO 1 — APAGAR LA BOMBA ENSEGUIDA
    bombaSumergibleEncendida = false;
    actualizarEstadoBombaSumergible();
    
    // 🔹 PASO 2 — Buscar las que están abiertas
    const abiertas = Object.entries(valvulasBomba)
        .filter(([_, abierta]) => abierta)
        .map(([nombre]) => nombre);
    
    if (abiertas.length === 0) {
        bloqueoBombaSumergible = false;
        reiniciarContadorBomba();
        return;
    }
    
    // 🔹 PASO 3 — Cerrar cada una con su tiempo
    for (const nombre of abiertas) {
        const estadoValvula = document.getElementById(nombre + '-estado');
        const btn = document.getElementById('btn-' + nombre);
        
        // ⏳ Muestra "Esperando..." mientras cierra
        estadoValvula.textContent = 'Esperando...';
        estadoValvula.className = 'valor esperando';
        if (btn) btn.classList.add('esperando');
        iniciarContadorBomba();
        
        await new Promise(r => setTimeout(r, RETARDO_VALVULA));
        
        // ✅ Terminó — queda CERRADO
        valvulasBomba[nombre] = false;
        estadoValvula.textContent = 'CERRADO';
        estadoValvula.className = 'valor inactivo';
        if (btn) {
            btn.classList.remove('activo', 'esperando');
        }
    }
    
    reiniciarContadorBomba();
    bloqueoBombaSumergible = false;
}
