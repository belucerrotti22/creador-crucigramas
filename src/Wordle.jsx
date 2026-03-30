import { useState } from 'react'
import { encodeWordleParaJuego } from './juego'
import './Wordle.css'

const MIN_INTENTOS = 3
const MAX_INTENTOS = 10

export default function Wordle() {
  const [palabra, setPalabra] = useState('')
  const [pista, setPista] = useState('')
  const [intentos, setIntentos] = useState(6)
  const [nombre, setNombre] = useState('')
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [error, setError] = useState('')

  const palabraValida = palabra.trim().length >= 2

  const handleCopiarLink = () => {
    const p = palabra.trim().toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ]/g, '')
    if (!p) { setError('Escribí una palabra antes de generar el link'); return }
    if (p.length < 2) { setError('La palabra debe tener al menos 2 letras'); return }
    setError('')

    const encoded = encodeWordleParaJuego({ nombre, palabra: p, pista, intentos })
    const url = `${window.location.origin}${window.location.pathname}?wordle=${encoded}`
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopiado(true)
      setTimeout(() => setLinkCopiado(false), 2500)
    })
  }

  // Preview de cómo se verá la grilla
  const letras = palabra.replace(/[^A-ZÁÉÍÓÚÜÑa-záéíóúüñ]/g, '').length || 5

  return (
    <div className="wordle-creator-wrapper">
      <div className="wordle-creator-card">

        <h1 className="titulo" style={{ marginBottom: 4 }}>Adiviná la palabra</h1>
        <p className="wordle-creator-subtitulo">
          Configurá tu propio Wordle y compartí el link con quien quieras
        </p>

        {/* Nombre */}
        <div className="wordle-creator-campo">
          <label>Nombre del juego <span className="wordle-creator-opcional">(opcional)</span></label>
          <input
            className="input-nombre"
            type="text"
            placeholder='Ej: "Vocabulario de ciencias"'
            value={nombre}
            onChange={e => setNombre(e.target.value)}
          />
        </div>

        {/* Palabra */}
        <div className="wordle-creator-campo">
          <label>Palabra a adivinar <span className="wordle-creator-requerido">*</span></label>
          <input
            className="input-nombre wordle-creator-input-palabra"
            type="text"
            placeholder="Escribí la palabra secreta..."
            value={palabra}
            onChange={e => {
              setPalabra(e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ]/g, ''))
              setError('')
            }}
            maxLength={15}
          />
          {palabra && (
            <span className="wordle-creator-largo">{palabra.length} letra{palabra.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Pista */}
        <div className="wordle-creator-campo">
          <label>Pista para el jugador <span className="wordle-creator-opcional">(opcional)</span></label>
          <input
            className="input-nombre"
            type="text"
            placeholder='Ej: "Es un animal marino"'
            value={pista}
            onChange={e => setPista(e.target.value)}
          />
          <span className="wordle-creator-hint">
            Se mostrará debajo del título para ayudar al jugador
          </span>
        </div>

        {/* Intentos */}
        <div className="wordle-creator-campo">
          <label>
            Cantidad de intentos
            <span className="wordle-creator-valor-intentos">{intentos}</span>
          </label>
          <input
            type="range"
            min={MIN_INTENTOS}
            max={MAX_INTENTOS}
            step={1}
            value={intentos}
            onChange={e => setIntentos(Number(e.target.value))}
            className="wordle-creator-slider"
          />
          <div className="wordle-creator-slider-labels">
            <span>{MIN_INTENTOS}</span>
            <span>{MAX_INTENTOS}</span>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        {/* Preview */}
        <div className="wordle-preview">
          <p className="palabras-titulo">Vista previa de la grilla</p>
          <div className="wordle-preview-grilla" style={{ '--wlen': letras }}>
            {Array.from({ length: Math.min(intentos, 4) }).map((_, fila) =>
              Array.from({ length: letras }).map((_, col) => (
                <div
                  key={`${fila}-${col}`}
                  className={`wordle-preview-celda ${
                    fila === 0 && col < palabra.length
                      ? col === 1 ? 'wp-verde'
                      : col === 3 ? 'wp-amarillo'
                      : 'wp-vacia'
                      : 'wp-vacia'
                  }`}
                >
                  {fila === 0 && palabra[col] ? palabra[col] : ''}
                </div>
              ))
            )}
            {intentos > 4 && (
              <div className="wordle-preview-mas">+{intentos - 4} filas más</div>
            )}
          </div>
        </div>

        <button
          className={`btn-generar wordle-creator-btn${!palabraValida ? ' wordle-creator-btn-disabled' : ''}`}
          onClick={handleCopiarLink}
          title={!palabraValida ? 'Escribí una palabra primero' : ''}
        >
          {linkCopiado ? '✅ ¡Link copiado!' : '🔗 Generar y copiar link de juego'}
        </button>

      </div>
    </div>
  )
}
