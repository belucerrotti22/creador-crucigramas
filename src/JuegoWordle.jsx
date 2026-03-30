import { useState, useEffect, useRef, useCallback } from 'react'
import './JuegoCrucigrama.css'
import './Wordle.css'

const ESTADO = { VACIA: 'vacia', CORRECTA: 'correcta', PRESENTE: 'presente', AUSENTE: 'ausente' }

function evaluarIntento(intento, objetivo) {
  const resultado = Array(objetivo.length).fill(ESTADO.AUSENTE)
  const disponibles = [...objetivo]

  // Primero: correctas (posición exacta)
  for (let i = 0; i < objetivo.length; i++) {
    if (intento[i] === objetivo[i]) {
      resultado[i] = ESTADO.CORRECTA
      disponibles[i] = null
    }
  }
  // Segundo: presentes (letra existe pero en otra posición)
  for (let i = 0; i < objetivo.length; i++) {
    if (resultado[i] === ESTADO.CORRECTA) continue
    const idx = disponibles.indexOf(intento[i])
    if (idx !== -1) {
      resultado[i] = ESTADO.PRESENTE
      disponibles[idx] = null
    }
  }
  return resultado
}

// Estado de cada tecla del teclado: la "mejor" pista que se conoce
function mergeEstadoTeclado(actual, intento, resultado) {
  const prioridad = { [ESTADO.CORRECTA]: 3, [ESTADO.PRESENTE]: 2, [ESTADO.AUSENTE]: 1 }
  const nuevo = { ...actual }
  intento.forEach((letra, i) => {
    const prev = nuevo[letra]
    if (!prev || prioridad[resultado[i]] > prioridad[prev]) {
      nuevo[letra] = resultado[i]
    }
  })
  return nuevo
}

const TECLADO = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L','Ñ'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
]

export default function JuegoWordle({ nombre, palabra, pista, intentos: maxIntentos }) {
  const largo = palabra.length
  const [filas, setFilas] = useState(
    Array.from({ length: maxIntentos }, () => Array(largo).fill(''))
  )
  const [resultados, setResultados] = useState(
    Array.from({ length: maxIntentos }, () => null)
  )
  const [filaActual, setFilaActual] = useState(0)
  const [colActual, setColActual] = useState(0)
  const [estadoTeclado, setEstadoTeclado] = useState({})
  const [fase, setFase] = useState('jugando') // 'jugando' | 'ganado' | 'perdido'
  const [errorMsg, setErrorMsg] = useState('')
  const [shake, setShake] = useState(false)

  // ── Foco al montar (para teclado físico en desktop) ─────────
  const inputRef = useRef(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  const ingresarLetra = useCallback((letra) => {
    if (fase !== 'jugando') return
    if (colActual >= largo) return
    setFilas(prev => {
      const n = prev.map(f => [...f])
      n[filaActual][colActual] = letra
      return n
    })
    setColActual(c => c + 1)
    setErrorMsg('')
  }, [fase, filaActual, colActual, largo])

  const borrar = useCallback(() => {
    if (fase !== 'jugando') return
    if (colActual === 0) return
    setFilas(prev => {
      const n = prev.map(f => [...f])
      n[filaActual][colActual - 1] = ''
      return n
    })
    setColActual(c => c - 1)
    setErrorMsg('')
  }, [fase, filaActual, colActual])

  const confirmar = useCallback(() => {
    if (fase !== 'jugando') return
    if (colActual < largo) {
      setErrorMsg(`Faltan ${largo - colActual} letra${largo - colActual !== 1 ? 's' : ''}`)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    const intento = filas[filaActual]
    const resultado = evaluarIntento(intento, [...palabra])
    const nuevosResultados = resultados.map((r, i) => i === filaActual ? resultado : r)
    setResultados(nuevosResultados)
    setEstadoTeclado(prev => mergeEstadoTeclado(prev, intento, resultado))

    const gano = resultado.every(r => r === ESTADO.CORRECTA)
    if (gano) {
      setFase('ganado')
    } else if (filaActual + 1 >= maxIntentos) {
      setFase('perdido')
    } else {
      setFilaActual(f => f + 1)
      setColActual(0)
    }
  }, [fase, filaActual, colActual, largo, filas, resultados, palabra, maxIntentos])

  // ── Teclado físico ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const k = e.key.toUpperCase()
      if (k === 'ENTER') { e.preventDefault(); confirmar(); return }
      if (k === 'BACKSPACE') { e.preventDefault(); borrar(); return }
      if (/^[A-ZÁÉÍÓÚÜÑ]$/.test(k)) ingresarLetra(k)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [confirmar, borrar, ingresarLetra])

  const claseEstado = (e) => {
    if (e === ESTADO.CORRECTA) return 'wc-correcta'
    if (e === ESTADO.PRESENTE) return 'wc-presente'
    if (e === ESTADO.AUSENTE)  return 'wc-ausente'
    return ''
  }

  return (
    <div className="wjuego-wrapper" tabIndex={0} ref={inputRef} style={{ outline: 'none' }}>

      <header className="juego-header">
        <div>
          <h1 className="juego-titulo">{nombre}</h1>
          {pista && <p className="wjuego-pista">💡 {pista}</p>}
        </div>
        <div className="wjuego-meta">
          <span>{largo} letras</span>
          <span>·</span>
          <span>{maxIntentos} intentos</span>
        </div>
      </header>

      {/* Mensajes */}
      {fase === 'ganado' && (
        <p className="juego-msg juego-msg-ok">
          🎉 ¡Ganaste en {filaActual + 1} intento{filaActual !== 0 ? 's' : ''}! La palabra era <strong>{palabra}</strong>
        </p>
      )}
      {fase === 'perdido' && (
        <p className="juego-msg juego-msg-error">
          😢 La palabra era <strong>{palabra}</strong>. ¡Mejor suerte la próxima!
        </p>
      )}
      {errorMsg && fase === 'jugando' && (
        <p className="juego-msg juego-msg-warn">⚠️ {errorMsg}</p>
      )}

      <div className="wjuego-cuerpo">
        {/* Grilla */}
        <div className="wjuego-grilla" style={{ '--wlen': largo }}>
          {filas.map((fila, fi) => {
            const evaluada = resultados[fi]
            const esActual = fi === filaActual && fase === 'jugando'
            return (
              <div
                key={fi}
                className={`wjuego-fila${esActual && shake ? ' wjuego-fila-shake' : ''}`}
              >
                {fila.map((letra, ci) => {
                  const estado = evaluada ? evaluada[ci] : ESTADO.VACIA
                  const tieneLetra = letra !== ''
                  return (
                    <div
                      key={ci}
                      className={[
                        'wjuego-celda',
                        claseEstado(estado),
                        evaluada ? 'wjuego-celda-revelada' : '',
                        esActual && tieneLetra ? 'wjuego-celda-llena' : '',
                        esActual && ci === colActual ? 'wjuego-celda-cursor' : '',
                      ].filter(Boolean).join(' ')}
                      style={evaluada ? { animationDelay: `${ci * 80}ms` } : {}}
                    >
                      {letra}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Teclado */}
        <div className="wjuego-teclado">
          {TECLADO.map((fila, fi) => (
            <div key={fi} className="wjuego-teclado-fila">
              {fila.map(tecla => (
                <button
                  key={tecla}
                  className={[
                    'wjuego-tecla',
                    tecla === 'ENTER' || tecla === '⌫' ? 'wjuego-tecla-ancha' : '',
                    claseEstado(estadoTeclado[tecla] || ''),
                  ].filter(Boolean).join(' ')}
                  onClick={() => {
                    if (tecla === 'ENTER') confirmar()
                    else if (tecla === '⌫') borrar()
                    else ingresarLetra(tecla)
                  }}
                >
                  {tecla}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
