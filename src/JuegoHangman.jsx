import { useState, useEffect, useCallback } from 'react'
import './Hangman.css'

// ── Teclado QWERTY español ───────────────────────────────────────
const FILAS_TECLADO = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L','Ñ'],
  ['Z','X','C','V','B','N','M'],
]

// Normaliza para comparar ignorando tildes
function normalizar(str) {
  return str
    .toUpperCase()
    .replace(/Á/g,'A').replace(/É/g,'E').replace(/Í/g,'I')
    .replace(/Ó/g,'O').replace(/Ú/g,'U').replace(/Ü/g,'U')
}

// Partes del dibujo SVG
const PARTES_SVG = [
  <circle key="head" cx="110" cy="35" r="18" stroke="currentColor" strokeWidth="3" fill="none" />,
  <line key="body" x1="110" y1="53" x2="110" y2="110" stroke="currentColor" strokeWidth="3" />,
  <line key="arm-l" x1="110" y1="68" x2="80" y2="95" stroke="currentColor" strokeWidth="3" />,
  <line key="arm-r" x1="110" y1="68" x2="140" y2="95" stroke="currentColor" strokeWidth="3" />,
  <line key="leg-l" x1="110" y1="110" x2="80" y2="145" stroke="currentColor" strokeWidth="3" />,
  <line key="leg-r" x1="110" y1="110" x2="140" y2="145" stroke="currentColor" strokeWidth="3" />,
  <g key="face">
    <circle cx="104" cy="31" r="2.5" fill="currentColor" />
    <circle cx="116" cy="31" r="2.5" fill="currentColor" />
    <path d="M104 42 Q110 37 116 42" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
  </g>,
]

function Horca({ errores, maxIntentos }) {
  const partesMostradas = Math.round((errores / maxIntentos) * PARTES_SVG.length)
  return (
    <svg className="hangman-svg" viewBox="0 0 160 170" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="165" x2="140" y2="165" stroke="currentColor" strokeWidth="3" />
      <line x1="60" y1="165" x2="60" y2="5"  stroke="currentColor" strokeWidth="3" />
      <line x1="60" y1="5"   x2="110" y2="5"  stroke="currentColor" strokeWidth="3" />
      <line x1="110" y1="5"  x2="110" y2="17" stroke="currentColor" strokeWidth="3" />
      {PARTES_SVG.slice(0, partesMostradas)}
    </svg>
  )
}

export default function JuegoHangman({ nombre, palabra, pista, intentos: maxIntentos }) {
  const palabraNorm  = normalizar(palabra)
  const letrasUnicas = [...new Set(palabraNorm.replace(/[^A-ZÑ]/g,'').split(''))]

  const [letrasUsadas, setLetrasUsadas] = useState(new Set())
  const [terminado, setTerminado]       = useState(false) // 'ganaste' | 'perdiste' | false

  const errores = [...letrasUsadas].filter(l => !letrasUnicas.includes(normalizar(l))).length
  const adivinadas = letrasUnicas.filter(l => [...letrasUsadas].map(normalizar).includes(l))

  const gano = letrasUnicas.every(l => [...letrasUsadas].map(normalizar).includes(l))
  const perdio = errores >= maxIntentos

  // Detectar fin de juego
  useEffect(() => {
    if (!terminado) {
      if (gano)   setTerminado('ganaste')
      if (perdio) setTerminado('perdiste')
    }
  }, [gano, perdio, terminado])

  const handleLetra = useCallback((letra) => {
    if (terminado) return
    if (letrasUsadas.has(letra)) return
    setLetrasUsadas(prev => new Set([...prev, letra]))
  }, [terminado, letrasUsadas])

  // Teclado físico
  useEffect(() => {
    const onKey = (e) => {
      const key = e.key.toUpperCase().replace(/[ÁÄÂÀ]/g,'A').replace(/[ÉËÊÈ]/g,'E')
        .replace(/[ÍÏÎÌ]/g,'I').replace(/[ÓÖÔÒ]/g,'O').replace(/[ÚÜÛÙ]/g,'U')
      if (/^[A-ZÑ]$/.test(key)) handleLetra(key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleLetra])

  const handleReintentar = () => {
    setLetrasUsadas(new Set())
    setTerminado(false)
  }

  return (
    <div className="hangman-juego-wrapper">
      <div className="hangman-juego-card">

        {/* Título */}
        <h1 className="titulo" style={{ marginBottom: pista ? 4 : 16 }}>
          {nombre || 'Ahorcado'}
        </h1>
        {pista && <p className="hangman-pista">💡 {pista}</p>}

        <div className="hangman-juego-main">

          {/* Dibujo + contador */}
          <div className="hangman-juego-izq">
            <Horca errores={errores} maxIntentos={maxIntentos} />
            <p className={`hangman-errores-label${errores >= maxIntentos ? ' hangman-errores-maximo' : ''}`}>
              {errores} / {maxIntentos} errores
            </p>
          </div>

          {/* Palabra + teclado */}
          <div className="hangman-juego-der">

            {/* Letras de la palabra */}
            <div className="hangman-palabra">
              {palabra.split('').map((letra, i) => {
                const letraNorm = normalizar(letra)
                const esSep = /[^A-ZÁÉÍÓÚÜÑ]/i.test(letra)
                const revelada = esSep || [...letrasUsadas].map(normalizar).includes(letraNorm) || terminado === 'perdiste'
                return (
                  <span
                    key={i}
                    className={`hangman-letra-caja${esSep ? ' hangman-letra-sep' : ''}${
                      terminado === 'perdiste' && !esSep && !adivinadas.includes(letraNorm) ? ' hangman-letra-fallida' : ''
                    }`}
                  >
                    {esSep ? letra : (revelada ? letra : '')}
                  </span>
                )
              })}
            </div>

            {/* Letras incorrectas usadas */}
            {[...letrasUsadas].filter(l => !letrasUnicas.includes(normalizar(l))).length > 0 && !terminado && (
              <div className="hangman-incorrectas">
                <span className="hangman-incorrectas-label">Letras incorrectas: </span>
                {[...letrasUsadas]
                  .filter(l => !letrasUnicas.includes(normalizar(l)))
                  .join(' · ')}
              </div>
            )}

            {/* Resultado */}
            {terminado && (
              <div className={`hangman-resultado hangman-resultado-${terminado}`}>
                {terminado === 'ganaste'
                  ? '🎉 ¡Ganaste! Adivinaste la palabra.'
                  : `😢 ¡Perdiste! La palabra era "${palabra}".`}
                <button className="hangman-btn-reintentar" onClick={handleReintentar}>
                  🔄 Jugar de nuevo
                </button>
              </div>
            )}

            {/* Teclado virtual */}
            {!terminado && (
              <div className="hangman-teclado">
                {FILAS_TECLADO.map((fila, fi) => (
                  <div key={fi} className="hangman-teclado-fila">
                    {fila.map(letra => {
                      const letraNorm = normalizar(letra)
                      const usada = letrasUsadas.has(letra)
                      const correcta = usada && letrasUnicas.includes(letraNorm)
                      const incorrecta = usada && !letrasUnicas.includes(letraNorm)
                      return (
                        <button
                          key={letra}
                          className={`hangman-tecla${correcta ? ' hangman-tecla-correcta' : incorrecta ? ' hangman-tecla-incorrecta' : ''}`}
                          onClick={() => handleLetra(letra)}
                          disabled={usada}
                        >
                          {letra}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}
