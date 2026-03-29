import './MisCrucigramas.css'

export default function MisCrucigramas({ guardados, onCargar, onEliminar, onCerrar }) {
  if (guardados.length === 0) {
    return (
      <div className="mis-modal-overlay" onClick={onCerrar}>
        <div className="mis-modal" onClick={e => e.stopPropagation()}>
          <div className="mis-header">
            <h2>📂 Mis Crucigramas</h2>
            <button className="mis-cerrar" onClick={onCerrar}>×</button>
          </div>
          <div className="mis-vacio">
            <p>Todavía no guardaste ningún crucigrama.</p>
            <p>Generá uno y usá el botón <strong>"💾 Guardar"</strong> para guardarlo acá.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mis-modal-overlay" onClick={onCerrar}>
      <div className="mis-modal" onClick={e => e.stopPropagation()}>
        <div className="mis-header">
          <h2>📂 Mis Crucigramas</h2>
          <button className="mis-cerrar" onClick={onCerrar}>×</button>
        </div>

        <div className="mis-lista">
          {guardados.map(g => (
            <div key={g.id} className="mis-item">
              <div className="mis-info">
                <span className="mis-nombre">{g.nombre}</span>
                <span className="mis-meta">
                  {g.palabras.length} palabras · {g.fecha}
                </span>
                <div className="mis-chips">
                  {g.palabras.slice(0, 5).map((p, i) => (
                    <span key={i} className="mis-chip">{p}</span>
                  ))}
                  {g.palabras.length > 5 && (
                    <span className="mis-chip mis-chip-mas">+{g.palabras.length - 5}</span>
                  )}
                </div>
              </div>
              <div className="mis-acciones">
                <button className="mis-btn-cargar" onClick={() => onCargar(g)}>
                  ✏️ Editar
                </button>
                <button className="mis-btn-eliminar" onClick={() => onEliminar(g.id)}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
