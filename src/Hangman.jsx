import { useState } from 'react'
import { encodeAhorcadoParaJuego } from './juego'
import './Hangman.css'

const MIN_INTENTOS = 3
const MAX_INTENTOS = 10

// Partes del dibujo SVG según cantidad de errores (hasta 7 partes)
const PARTES_SVG = [
  // 1 – cabeza
  <circle key="head" cx="110" cy="35" r="18" stroke="currentColor" strokeWidth="3" fill="none" />,
  // 2 – cuerpo
  <line key="body" x1="110" y1="53" x2="110" y2="110" stroke="currentColor" strokeWidth="3" />,
  // 3 – brazo izq
  <line key="arm-l" x1="110" y1="68" x2="80" y2="95" stroke="currentColor" strokeWidth="3" />,
  // 4 – brazo der
  <line key="arm-r" x1="110" y1="68" x2="140" y2="95" stroke="currentColor" strokeWidth="3" />,
  // 5 – pierna izq
  <line key="leg-l" x1="110" y1="110" x2="80" y2="145" stroke="currentColor" strokeWidth="3" />,
  // 6 – pierna der
  <line key="leg-r" x1="110" y1="110" x2="140" y2="145" stroke="currentColor" strokeWidth="3" />,
  // 7 – cara triste
  <g key="face">
    <circle cx="104" cy="31" r="2.5" fill="currentColor" />
    <circle cx="116" cy="31" r="2.5" fill="currentColor" />
    <path d="M104 42 Q110 37 116 42" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
  </g>,
]

function HorcaPreview({ errores, maxIntentos }) {
  // cuántas partes mostrar según progreso
  const partesMostradas = Math.round((errores / maxIntentos) * PARTES_SVG.length)
  return (
    <svg className="hangman-preview-svg" viewBox="0 0 160 170" xmlns="http://www.w3.org/2000/svg">
      {/* estructura */}
      <line x1="20" y1="165" x2="140" y2="165" stroke="currentColor" strokeWidth="3" />
      <line x1="60" y1="165" x2="60" y2="5"  stroke="currentColor" strokeWidth="3" />
      <line x1="60" y1="5"   x2="110" y2="5"  stroke="currentColor" strokeWidth="3" />
      <line x1="110" y1="5"  x2="110" y2="17" stroke="currentColor" strokeWidth="3" />
      {/* partes del cuerpo */}
      {PARTES_SVG.slice(0, partesMostradas)}
    </svg>
  )
}

export default function Hangman() {
  const [nombre, setNombre] = useState('')
  const [palabra, setPalabra] = useState('')
  const [pista, setPista]   = useState('')
  const [intentos, setIntentos] = useState(6)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [error, setError] = useState('')

  const palabraValida = palabra.trim().length >= 2

  const handleCopiarLink = () => {
    const p = palabra.trim().toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ]/g, '')
    if (!p) { setError('Escribí una palabra antes de generar el link'); return }
    if (p.length < 2) { setError('La palabra debe tener al menos 2 letras'); return }
    setError('')

    const encoded = encodeAhorcadoParaJuego({ nombre, palabra: p, pista, intentos })
    const url = `${window.location.origin}${window.location.pathname}?ahorcado=${encoded}`
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopiado(true)
      setTimeout(() => setLinkCopiado(false), 2500)
    })
  }

  // para preview de la horca mostramos la mitad de errores
  const erroresPreview = Math.ceil(intentos / 2)

  return (
    <div className="hangman-creator-wrapper">
      <div className="hangman-creator-card">

        <h1 className="titulo" style={{ marginBottom: 4 }}>Ahorcado</h1>
        <p className="hangman-creator-subtitulo">
          Creá tu propio juego de Ahorcado y compartí el link con quien quieras
        </p>

        {/* Nombre */}
        <div className="hangman-creator-campo">
          <label>Nombre del juego <span className="hangman-creator-opcional">(opcional)</span></label>
          <input
            className="input-nombre"
            type="text"
            placeholder='Ej: "Animales del zoológico"'
            value={nombre}
            onChange={e => setNombre(e.target.value)}
          />
        </div>

        {/* Palabra */}
        <div className="hangman-creator-campo">
          <label>Palabra a adivinar <span className="hangman-creator-requerido">*</span></label>
          <input
            className="input-nombre hangman-creator-input-palabra"
            type="text"
            placeholder="Escribí la palabra secreta..."
            value={palabra}
            onChange={e => {
              setPalabra(e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ]/g, ''))
              setError('')
            }}
            maxLength={20}
          />
          {palabra && (
            <span className="hangman-creator-largo">{palabra.length} letra{palabra.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Pista */}
        <div className="hangman-creator-campo">
          <label>Pista para el jugador <span className="hangman-creator-opcional">(opcional)</span></label>
          <input
            className="input-nombre"
            type="text"
            placeholder='Ej: "Es un país de América del Sur"'
            value={pista}
            onChange={e => setPista(e.target.value)}
          />
          <span className="hangman-creator-hint">
            Se mostrará debajo del título para ayudar al jugador
          </span>
        </div>

        {/* Intentos */}
        <div className="hangman-creator-campo">
          <label>
            Errores permitidos
            <span className="hangman-creator-valor-intentos">{intentos}</span>
          </label>
          <input
            type="range"
            min={MIN_INTENTOS}
            max={MAX_INTENTOS}
            step={1}
            value={intentos}
            onChange={e => setIntentos(Number(e.target.value))}
            className="hangman-creator-slider"
          />
          <div className="hangman-creator-slider-labels">
            <span>{MIN_INTENTOS}</span>
            <span>{MAX_INTENTOS}</span>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        {/* Preview */}
        <div className="hangman-preview">
          <p className="palabras-titulo">Vista previa</p>
          <div className="hangman-preview-inner">
            <HorcaPreview errores={erroresPreview} maxIntentos={intentos} />
            <div className="hangman-preview-letras">
              {Array.from({ length: Math.max(palabra.length, 5) }).map((_, i) => (
                <span key={i} className="hangman-preview-guion">
                  {palabra[i] && i < 2 ? palabra[i] : '_'}
                </span>
              ))}
              <div className="hangman-preview-info">
                {intentos} errores permitidos
              </div>
            </div>
          </div>
        </div>

        <button
          className={`btn-generar hangman-creator-btn${!palabraValida ? ' hangman-creator-btn-disabled' : ''}`}
          onClick={handleCopiarLink}
          title={!palabraValida ? 'Escribí una palabra primero' : ''}
        >
          {linkCopiado ? '✅ ¡Link copiado!' : '🔗 Generar y copiar link de juego'}
        </button>

      </div>
    </div>
  )
}
