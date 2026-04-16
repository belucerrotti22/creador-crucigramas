import { useState } from 'react'
import './MisCrucigramas.css'

export default function MisCrucigramas({
  guardados, onCargar, onEliminar, onDuplicar, onCerrar,
  titulo = '📂 Mis Crucigramas',
  mensajeVacio = 'Todavía no guardaste ningún crucigrama.',
  itemLabel = 'palabras',
}) {
  const [busqueda, setBusqueda] = useState('')

  const filtrados = busqueda.trim()
    ? guardados.filter(g =>
        g.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        g.palabras.some(p => p.toLowerCase().includes(busqueda.toLowerCase()))
      )
    : guardados

  return (
    <div className="mis-modal-overlay" onClick={onCerrar}>
      <div className="mis-modal" onClick={e => e.stopPropagation()}>
        <div className="mis-header">
          <h2>{titulo}</h2>
          <button className="mis-cerrar" onClick={onCerrar}>×</button>
        </div>

        {guardados.length === 0 ? (
          <div className="mis-vacio">
            <p>{mensajeVacio}</p>
            <p>Generá una y usá el botón <strong>"💾 Guardar"</strong> para guardarla acá.</p>
          </div>
        ) : (
          <>
            <div className="mis-buscador">
              <input
                type="text"
                placeholder="Buscar por nombre o palabra..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                autoFocus
              />
              {busqueda && (
                <button className="mis-buscador-limpiar" onClick={() => setBusqueda('')}>×</button>
              )}
            </div>

            <div className="mis-lista">
              {filtrados.length === 0 ? (
                <div className="mis-sin-resultados">
                  No se encontraron crucigramas para <strong>"{busqueda}"</strong>
                </div>
              ) : (
                filtrados.map(g => (
                  <div key={g.id} className="mis-item">
                    <div className="mis-info">
                      <span className="mis-nombre">{g.nombre}</span>
                      <span className="mis-meta">
                        {g.palabras.length} {itemLabel} · {g.fecha}
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
                      <button className="mis-btn-duplicar" onClick={() => onDuplicar(g.id)} title="Duplicar">
                        📋
                      </button>
                      <button className="mis-btn-eliminar" onClick={() => onEliminar(g.id)} title="Eliminar">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
