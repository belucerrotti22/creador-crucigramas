import { useState } from 'react'
import './JuegoFlashcards.css'

/**
 * Pesos por calificación: cuántas veces aparece la tarjeta en la siguiente ronda.
 * ★5 = dominada → no aparece.
 */
const WEIGHTS = { 1: 4, 2: 3, 3: 2, 4: 1, 5: 0 }

const RATING_LABELS = {
  1: 'No la recuerdo',
  2: 'Apenas',
  3: 'A medias',
  4: 'Casi bien',
  5: '¡La domino!',
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Construye el mazo ponderado para la siguiente ronda. */
function buildWeightedDeck(ratings, total) {
  const pool = []
  for (let i = 0; i < total; i++) {
    const r = ratings[i]
    if (!r) continue
    const w = WEIGHTS[r] ?? 0
    for (let j = 0; j < w; j++) pool.push(i)
  }
  return shuffle(pool)
}

/** Cuántas apariciones habrá en el próximo mazo (sin construirlo). */
function calcNextDeckSize(ratings, total) {
  let size = 0
  for (let i = 0; i < total; i++) {
    const r = ratings[i]
    if (r) size += WEIGHTS[r] ?? 0
  }
  return size
}

/**
 * Props:
 *   nombre: string
 *   tarjetas: Array<{ frente: string, reverso: string }>
 */
export default function JuegoFlashcards({ nombre, tarjetas }) {
  const total = tarjetas.length

  // ratings: { originalIdx: 1-5 } — siempre la calificación MÁS RECIENTE de cada tarjeta
  const [ratings, setRatings] = useState({})
  // deck: array de índices originales (con repeticiones en rondas 2+)
  const [deck, setDeck] = useState(() => shuffle(tarjetas.map((_, i) => i)))
  const [deckPos, setDeckPos] = useState(0)
  const [roundNum, setRoundNum] = useState(1)
  const [roundDone, setRoundDone] = useState(false)
  const [finished, setFinished] = useState(false)
  const [volteada, setVolteada] = useState(false)

  const currentCardIdx = deck[deckPos]
  const currentCard = tarjetas[currentCardIdx]

  // ── Calificar tarjeta actual ──
  const handleRate = (score) => {
    const newRatings = { ...ratings, [currentCardIdx]: score }
    setRatings(newRatings)
    setVolteada(false)
    if (deckPos + 1 >= deck.length) {
      setRoundDone(true)
    } else {
      setDeckPos(pos => pos + 1)
    }
  }

  // ── Iniciar siguiente ronda ──
  const handleNextRound = () => {
    const nextDeck = buildWeightedDeck(ratings, total)
    setDeck(nextDeck)
    setDeckPos(0)
    setRoundNum(r => r + 1)
    setRoundDone(false)
    setVolteada(false)
  }

  const handleFinish = () => setFinished(true)

  const handleReiniciar = () => {
    setRatings({})
    setDeck(shuffle(tarjetas.map((_, i) => i)))
    setDeckPos(0)
    setRoundNum(1)
    setRoundDone(false)
    setFinished(false)
    setVolteada(false)
  }

  // ════════════════════════════════════════════════════════════
  // Pantalla entre rondas
  // ════════════════════════════════════════════════════════════
  if (roundDone && !finished) {
    const masteredCount = Object.values(ratings).filter(v => v === 5).length
    const toRepeatCount = total - masteredCount
    const nextDeckSize = calcNextDeckSize(ratings, total)
    const allMastered = toRepeatCount === 0

    const dist = [5, 4, 3, 2, 1]
      .map(r => ({ rating: r, count: Object.values(ratings).filter(v => v === r).length }))
      .filter(d => d.count > 0)

    return (
      <div className="jfc-wrapper">
        <div className="jfc-card">
          <div className="jfc-titulo-wrapper">
            <h1 className="jfc-titulo">{nombre || 'Flashcards'}</h1>
            <p className="jfc-round-done-badge">Ronda {roundNum} completada ✓</p>
          </div>

          <div className="jfc-between-card">
            <p className="jfc-between-titulo">Tus calificaciones</p>
            <div className="jfc-dist-summary">
              {dist.map(({ rating, count }) => (
                <div key={rating} className={`jfc-dist-row jfc-dist-r${rating}`}>
                  <span className="jfc-dist-stars">
                    {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                  </span>
                  <span className="jfc-dist-count">{count} tarjeta{count !== 1 ? 's' : ''}</span>
                  <span className="jfc-dist-label">{RATING_LABELS[rating]}</span>
                </div>
              ))}
            </div>
          </div>

          {allMastered ? (
            <div className="jfc-all-mastered-msg">
              <p className="jfc-all-mastered-emoji">🏆</p>
              <p className="jfc-all-mastered-texto">¡Dominás todas las tarjetas!</p>
              <button className="jfc-btn-reiniciar" onClick={handleReiniciar}>
                🔄 Empezar de nuevo
              </button>
            </div>
          ) : (
            <>

              <div className="jfc-between-acciones">
                <button className="jfc-btn-siguiente-ronda" onClick={handleNextRound}>
                  ▶ Comenzar Ronda {roundNum + 1}
                </button>
                <button className="jfc-btn-terminar-ya" onClick={handleFinish}>
                  Terminar y ver resumen
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════
  // Pantalla final
  // ════════════════════════════════════════════════════════════
  if (finished) {
    const masteredCount = Object.values(ratings).filter(v => v === 5).length
    const porcentaje = total > 0 ? Math.round((masteredCount / total) * 100) : 0
    const emoji = porcentaje === 100 ? '🏆' : porcentaje >= 70 ? '🎉' : porcentaje >= 40 ? '📚' : '💪'

    return (
      <div className="jfc-wrapper">
        <div className="jfc-card">
          <div className="jfc-titulo-wrapper">
            <h1 className="jfc-titulo">{nombre || 'Flashcards'}</h1>
          </div>

          <div className="jfc-resultado-final">
            <div className="jfc-resultado-emoji">{emoji}</div>
            <p className="jfc-resultado-rondas">{roundNum} ronda{roundNum !== 1 ? 's' : ''} completada{roundNum !== 1 ? 's' : ''}</p>
            <div className="jfc-resultado-stats">
              <div className="jfc-stat jfc-stat-sabe">
                <span className="jfc-stat-num">{masteredCount}</span>
                <span className="jfc-stat-label">Dominadas ⭐</span>
              </div>
              <div className="jfc-stat jfc-stat-repasar">
                <span className="jfc-stat-num">{total - masteredCount}</span>
                <span className="jfc-stat-label">Para repasar</span>
              </div>
            </div>
            <p className="jfc-resultado-porcentaje">{porcentaje}% dominado</p>
          </div>

          <div className="jfc-repaso">
            <p className="jfc-repaso-titulo">Resumen por tarjeta</p>
            {tarjetas.map((t, i) => {
              const r = ratings[i]
              return (
                <div key={i} className={`jfc-repaso-item jfc-repaso-r${r ?? 0}`}>
                  <div className="jfc-repaso-header">
                    <span className="jfc-repaso-rating-stars">
                      {r ? '★'.repeat(r) + '☆'.repeat(5 - r) : '—'}
                    </span>
                    <span className="jfc-repaso-frente">{t.frente}</span>
                  </div>
                  <div className="jfc-repaso-reverso">{t.reverso}</div>
                </div>
              )
            })}
          </div>

          <button className="jfc-btn-reiniciar" onClick={handleReiniciar}>
            🔄 Empezar de nuevo
          </button>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════
  // Pantalla de juego
  // ════════════════════════════════════════════════════════════
  return (
    <div className="jfc-wrapper">
      <div className="jfc-card">
        <div className="jfc-titulo-wrapper">
          <h1 className="jfc-titulo">{nombre || 'Flashcards'}</h1>
          <div className="jfc-progress-row">
            <span className="jfc-round-label">Ronda {roundNum}</span>
            <span className="jfc-progreso-text">{deckPos + 1} / {deck.length}</span>
          </div>
          <div className="jfc-barra-progreso">
            <div className="jfc-barra-fill" style={{ width: `${(deckPos / deck.length) * 100}%` }} />
          </div>
        </div>

        {/* Tarjeta con flip */}
        <div
          className={`jfc-flip-container${volteada ? ' jfc-flipped' : ''}`}
          onClick={() => setVolteada(v => !v)}
        >
          <div className="jfc-flip-inner">
            <div className="jfc-cara jfc-cara-frente">
              <span className="jfc-cara-label">Frente</span>
              <p className="jfc-cara-texto">{currentCard.frente}</p>
              <span className="jfc-tap-hint">Tocá para ver el reverso →</span>
            </div>
            <div className="jfc-cara jfc-cara-reverso">
              <span className="jfc-cara-label">Reverso</span>
              <p className="jfc-cara-texto">{currentCard.reverso}</p>
              <span className="jfc-tap-hint">Tocá para volver al frente ←</span>
            </div>
          </div>
        </div>

        {/* Antes de voltear: botón para ver respuesta */}
        {!volteada ? (
          <button
            className="jfc-btn-ver-respuesta"
            onClick={() => setVolteada(true)}
            type="button"
          >
            Ver respuesta
          </button>
        ) : (
          /* Después de voltear: escala 1-5 */
          <div className="jfc-rating-panel">
            <p className="jfc-rating-pregunta">¿Qué tan bien la sabías?</p>
            <div className="jfc-rating-buttons">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  className={`jfc-rating-btn jfc-rating-btn-${n}`}
                  onClick={() => handleRate(n)}
                  type="button"
                >
                  <span className="jfc-rating-num">{n}</span>
                  <span className="jfc-rating-stars-mini">{'★'.repeat(n)}</span>
                  <span className="jfc-rating-desc">{RATING_LABELS[n]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
