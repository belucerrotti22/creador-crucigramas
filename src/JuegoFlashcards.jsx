import { useState } from 'react'
import './JuegoFlashcards.css'

/**
 * Props:
 *   nombre: string
 *   tarjetas: Array<{ frente: string, reverso: string }>
 */
export default function JuegoFlashcards({ nombre, tarjetas }) {
  const [indice, setIndice] = useState(0)
  const [volteada, setVolteada] = useState(false)
  const [sabe, setSabe] = useState(new Set())       // índices que el usuario marcó "Lo sé"
  const [repasar, setRepasar] = useState(new Set())  // índices que el usuario marcó "Repasar"
  const [finalizado, setFinalizado] = useState(false)
  const [orden, setOrden] = useState(() => tarjetas.map((_, i) => i)) // orden actual

  const total = orden.length
  const tarjetaActual = tarjetas[orden[indice]]

  const handleVoltear = () => setVolteada(v => !v)

  const avanzar = (accion) => {
    const idx = orden[indice]
    if (accion === 'sabe') {
      setSabe(prev => new Set([...prev, idx]))
      setRepasar(prev => { const s = new Set(prev); s.delete(idx); return s })
    } else {
      setRepasar(prev => new Set([...prev, idx]))
      setSabe(prev => { const s = new Set(prev); s.delete(idx); return s })
    }

    setVolteada(false)
    if (indice + 1 >= total) {
      setFinalizado(true)
    } else {
      setIndice(i => i + 1)
    }
  }

  const handleReiniciarTodas = () => {
    setOrden(tarjetas.map((_, i) => i))
    setIndice(0)
    setVolteada(false)
    setSabe(new Set())
    setRepasar(new Set())
    setFinalizado(false)
  }

  const handleRepasarMarcadas = () => {
    const aRepasar = [...repasar]
    if (aRepasar.length === 0) return
    setOrden(aRepasar)
    setIndice(0)
    setVolteada(false)
    setSabe(new Set())
    setRepasar(new Set())
    setFinalizado(false)
  }

  // ── Pantalla final ──
  if (finalizado) {
    const cantSabe = sabe.size
    const cantRepasar = repasar.size
    const porcentaje = Math.round((cantSabe / tarjetas.length) * 100)
    const emoji = porcentaje === 100 ? '🏆' : porcentaje >= 70 ? '🎉' : porcentaje >= 40 ? '😅' : '📚'

    return (
      <div className="jfc-wrapper">
        <div className="jfc-card">
          <div className="jfc-titulo-wrapper">
            <h1 className="jfc-titulo">{nombre || 'Flashcards'}</h1>
          </div>

          <div className="jfc-resultado-final">
            <div className="jfc-resultado-emoji">{emoji}</div>
            <div className="jfc-resultado-stats">
              <div className="jfc-stat jfc-stat-sabe">
                <span className="jfc-stat-num">{cantSabe}</span>
                <span className="jfc-stat-label">Lo sé ✅</span>
              </div>
              <div className="jfc-stat jfc-stat-repasar">
                <span className="jfc-stat-num">{cantRepasar}</span>
                <span className="jfc-stat-label">A repasar 🔁</span>
              </div>
            </div>
            <p className="jfc-resultado-porcentaje">{porcentaje}% dominado</p>
          </div>

          {/* Repaso */}
          <div className="jfc-repaso">
            <p className="jfc-repaso-titulo">Repaso de tarjetas</p>
            {tarjetas.map((t, i) => {
              const enSabe = sabe.has(i)
              const enRepasar = repasar.has(i)
              return (
                <div key={i} className={`jfc-repaso-item${enSabe ? ' jfc-repaso-ok' : enRepasar ? ' jfc-repaso-mal' : ''}`}>
                  <div className="jfc-repaso-header">
                    <span className="jfc-repaso-icon">{enSabe ? '✅' : '🔁'}</span>
                    <span className="jfc-repaso-frente">{i + 1}. {t.frente}</span>
                  </div>
                  <div className="jfc-repaso-reverso">{t.reverso}</div>
                </div>
              )
            })}
          </div>

          <div className="jfc-botones-finales">
            {cantRepasar > 0 && (
              <button className="jfc-btn-repasar" onClick={handleRepasarMarcadas}>
                🔁 Repasar las {cantRepasar} marcadas
              </button>
            )}
            <button className="jfc-btn-reiniciar" onClick={handleReiniciarTodas}>
              🔄 Empezar de nuevo
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Pantalla de juego ──
  return (
    <div className="jfc-wrapper">
      <div className="jfc-card">
        <div className="jfc-titulo-wrapper">
          <h1 className="jfc-titulo">{nombre || 'Flashcards'}</h1>
          <p className="jfc-progreso-text">
            {indice + 1} de {total}
          </p>
          <div className="jfc-barra-progreso">
            <div
              className="jfc-barra-fill"
              style={{ width: `${((indice) / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Tarjeta con flip */}
        <div className={`jfc-flip-container${volteada ? ' jfc-flipped' : ''}`} onClick={handleVoltear}>
          <div className="jfc-flip-inner">
            <div className="jfc-cara jfc-cara-frente">
              <span className="jfc-cara-label">Frente</span>
              <p className="jfc-cara-texto">{tarjetaActual.frente}</p>
              <span className="jfc-tap-hint">Tocá para ver el reverso →</span>
            </div>
            <div className="jfc-cara jfc-cara-reverso">
              <span className="jfc-cara-label">Reverso</span>
              <p className="jfc-cara-texto">{tarjetaActual.reverso}</p>
              <span className="jfc-tap-hint">Tocá para volver al frente ←</span>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="jfc-acciones">
          <button
            className="jfc-btn-repasar-accion"
            onClick={() => avanzar('repasar')}
            type="button"
          >
            🔁 A repasar
          </button>
          <button
            className="jfc-btn-sabe"
            onClick={() => avanzar('sabe')}
            type="button"
          >
            ✅ Lo sé
          </button>
        </div>

        <p className="jfc-hint-voltear">Tocá la tarjeta para verla del otro lado</p>
      </div>
    </div>
  )
}
