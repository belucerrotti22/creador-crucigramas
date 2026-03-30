import { useState, useEffect, useRef, useCallback } from 'react'
import './JuegoCrucigrama.css'

/**
 * Vista de juego interactiva.
 * Props: nombre, grid, placements, wordNumbers, numberedCells, descripciones
 */
export default function JuegoCrucigrama({ nombre, grid, placements, wordNumbers, numberedCells, descripciones }) {
  const filas = grid.length
  const cols = grid[0]?.length || 1

  // Letras escritas por el jugador: { "r,c": letra }
  const [celdas, setCeldas] = useState({})
  // Celda seleccionada actualmente
  const [seleccionada, setSeleccionada] = useState(null)
  // Dirección activa: 'h' | 'v'
  const [direccion, setDireccion] = useState('h')
  // Estado de verificación: null | 'correcto' | 'incompleto' | mapa de errores
  const [verificacion, setVerificacion] = useState(null)
  // Celebración al completar
  const [completado, setCompletado] = useState(false)

  const inputsRef = useRef({})

  // ── Calcular palabras que pasan por una celda ────────────────
  const palabrasEnCelda = useCallback((r, c) => {
    return placements.filter(p => {
      if (p.horizontal) return p.row === r && c >= p.col && c < p.col + p.word.length
      else return p.col === c && r >= p.row && r < p.row + p.word.length
    })
  }, [placements])

  // Palabra activa (la que contiene la celda seleccionada en la dirección actual)
  const palabraActiva = seleccionada
    ? placements.find(p =>
        p.horizontal === (direccion === 'h') &&
        palabrasEnCelda(seleccionada.r, seleccionada.c).includes(p)
      )
    : null

  // Celdas de la palabra activa
  const celdasPalabraActiva = new Set()
  if (palabraActiva) {
    for (let i = 0; i < palabraActiva.word.length; i++) {
      const r = palabraActiva.horizontal ? palabraActiva.row : palabraActiva.row + i
      const c = palabraActiva.horizontal ? palabraActiva.col + i : palabraActiva.col
      celdasPalabraActiva.add(`${r},${c}`)
    }
  }

  // ── Clic en celda ────────────────────────────────────────────
  const handleClickCelda = (r, c) => {
    const key = `${r},${c}`
    if (seleccionada?.r === r && seleccionada?.c === c) {
      // Misma celda: cambiar dirección si hay palabra en ambas
      const words = palabrasEnCelda(r, c)
      const tieneH = words.some(p => p.horizontal)
      const tieneV = words.some(p => !p.horizontal)
      if (tieneH && tieneV) {
        setDireccion(d => d === 'h' ? 'v' : 'h')
      }
    } else {
      setSeleccionada({ r, c })
      setVerificacion(null)
      // Elegir dirección: preferir la dirección actual si hay palabra, sino la otra
      const words = palabrasEnCelda(r, c)
      const tieneH = words.some(p => p.horizontal)
      const tieneV = words.some(p => !p.horizontal)
      if (direccion === 'h' && !tieneH && tieneV) setDireccion('v')
      if (direccion === 'v' && !tieneV && tieneH) setDireccion('h')
    }
    setTimeout(() => inputsRef.current[key]?.focus(), 0)
  }

  // ── Escritura ────────────────────────────────────────────────
  const handleKeyDown = (r, c, e) => {
    const key = `${r},${c}`

    if (e.key === 'Backspace') {
      e.preventDefault()
      if (celdas[key]) {
        setCeldas(prev => { const n = { ...prev }; delete n[key]; return n })
      } else {
        moverA(r, c, -1)
      }
      setVerificacion(null)
      return
    }

    if (e.key === 'ArrowRight') { e.preventDefault(); setDireccion('h'); moverA(r, c, 1, 'h'); return }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); setDireccion('h'); moverA(r, c, -1, 'h'); return }
    if (e.key === 'ArrowDown')  { e.preventDefault(); setDireccion('v'); moverA(r, c, 1, 'v'); return }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setDireccion('v'); moverA(r, c, -1, 'v'); return }

    if (e.key === 'Tab') {
      e.preventDefault()
      irSiguientePalabra(e.shiftKey ? -1 : 1)
      return
    }

    // Letra
    const letra = e.key.toUpperCase()
    if (/^[A-ZÁÉÍÓÚÜÑ]$/.test(letra)) {
      e.preventDefault()
      setCeldas(prev => ({ ...prev, [key]: letra }))
      setVerificacion(null)
      moverA(r, c, 1)
    }
  }

  const moverA = (r, c, delta, dir) => {
    const d = dir || direccion
    let nr = r + (d === 'v' ? delta : 0)
    let nc = c + (d === 'h' ? delta : 0)
    while (nr >= 0 && nr < filas && nc >= 0 && nc < cols) {
      if (grid[nr][nc]) {
        setSeleccionada({ r: nr, c: nc })
        setTimeout(() => inputsRef.current[`${nr},${nc}`]?.focus(), 0)
        return
      }
      nr += (d === 'v' ? delta : 0)
      nc += (d === 'h' ? delta : 0)
    }
  }

  const irSiguientePalabra = (delta) => {
    if (!palabraActiva) return
    const ordenadas = [...placements].sort((a, b) => {
      const na = wordNumbers[a.originalIndex]
      const nb = wordNumbers[b.originalIndex]
      return na !== nb ? na - nb : (a.horizontal ? 0 : 1) - (b.horizontal ? 0 : 1)
    })
    const idx = ordenadas.indexOf(palabraActiva)
    const next = ordenadas[(idx + delta + ordenadas.length) % ordenadas.length]
    setDireccion(next.horizontal ? 'h' : 'v')
    setSeleccionada({ r: next.row, c: next.col })
    setTimeout(() => inputsRef.current[`${next.row},${next.col}`]?.focus(), 0)
  }

  // ── Verificar ────────────────────────────────────────────────
  // Conjunto de todas las claves de celdas activas (sin duplicados por cruces)
  const todasLasCeldas = new Set()
  for (const p of placements) {
    for (let i = 0; i < p.word.length; i++) {
      const r = p.horizontal ? p.row : p.row + i
      const c = p.horizontal ? p.col + i : p.col
      todasLasCeldas.add(`${r},${c}`)
    }
  }

  const crucigamaCompleto = [...todasLasCeldas].every(k => celdas[k])

  const verificar = () => {
    if (!crucigamaCompleto) {
      setVerificacion('incompleto')
      return
    }

    const errores = {}
    let todasCorrectas = true

    for (const p of placements) {
      for (let i = 0; i < p.word.length; i++) {
        const r = p.horizontal ? p.row : p.row + i
        const c = p.horizontal ? p.col + i : p.col
        const k = `${r},${c}`
        if (celdas[k] !== p.word[i]) {
          todasCorrectas = false
          errores[k] = true
        }
      }
    }

    setVerificacion(todasCorrectas ? 'correcto' : errores)
    if (todasCorrectas) setCompletado(true)
  }

  const limpiar = () => {
    setCeldas({})
    setVerificacion(null)
    setCompletado(false)
  }

  // ── Pistas organizadas ───────────────────────────────────────
  const horizontal = placements
    .filter(p => p.horizontal)
    .sort((a, b) => wordNumbers[a.originalIndex] - wordNumbers[b.originalIndex])

  const vertical = placements
    .filter(p => !p.horizontal)
    .sort((a, b) => wordNumbers[a.originalIndex] - wordNumbers[b.originalIndex])

  // ── Celda activa para label accesibilidad ────────────────────
  const numPalabraActiva = palabraActiva ? wordNumbers[palabraActiva.originalIndex] : null

  return (
    <div className="juego-wrapper">
      {completado && (
        <div className="juego-completado-banner">
          🎉 ¡Felicitaciones! ¡Crucigrama completado correctamente!
        </div>
      )}

      <header className="juego-header">
        <h1 className="juego-titulo">{nombre}</h1>
        <div className="juego-acciones">
          <button
            className={`juego-btn-verificar${!crucigamaCompleto ? ' juego-btn-verificar-disabled' : ''}`}
            onClick={verificar}
            title={!crucigamaCompleto ? 'Completá todos los casilleros primero' : ''}
          >
            ✅ Verificar
          </button>
          <button className="juego-btn-limpiar" onClick={limpiar}>🗑️ Limpiar</button>
        </div>
      </header>

      {verificacion === 'correcto' && (
        <p className="juego-msg juego-msg-ok">✅ ¡Todo correcto!</p>
      )}
      {verificacion === 'incompleto' && (
        <p className="juego-msg juego-msg-warn">⚠️ Completá todos los casilleros antes de verificar.</p>
      )}
      {verificacion && typeof verificacion === 'object' && (
        <p className="juego-msg juego-msg-error">❌ Hay letras incorrectas marcadas en rojo.</p>
      )}

      <div className="juego-cuerpo">
        {/* ── Grilla ── */}
        <div className="juego-grilla-wrap">
          {numPalabraActiva && (
            <div className="juego-pista-flotante">
              <strong>{numPalabraActiva}.</strong>{' '}
              {descripciones[palabraActiva.originalIndex] || <em>Sin pista</em>}
              <span className="juego-pista-dir">{palabraActiva.horizontal ? '→' : '↓'}</span>
            </div>
          )}

          <div
            className="juego-grilla"
            style={{ gridTemplateColumns: `repeat(${cols}, var(--jcell))` }}
          >
            {grid.map((fila, r) =>
              fila.map((celda, c) => {
                const key = `${r},${c}`
                const numero = numberedCells[key]
                const estaActiva = celda !== null
                const esSel = seleccionada?.r === r && seleccionada?.c === c
                const esPalActiva = celdasPalabraActiva.has(key)
                const esError = verificacion && typeof verificacion === 'object' && verificacion[key]

                if (!estaActiva) return (
                  <div key={key} className="jcelda jcelda-vacia" />
                )

                return (
                  <div
                    key={key}
                    className={[
                      'jcelda jcelda-activa',
                      esSel ? 'jcelda-sel' : '',
                      esPalActiva && !esSel ? 'jcelda-pal' : '',
                      esError ? 'jcelda-error' : '',
                    ].join(' ')}
                    onClick={() => handleClickCelda(r, c)}
                  >
                    {numero && <span className="jcelda-num">{numero}</span>}
                    <input
                      ref={el => { inputsRef.current[key] = el }}
                      className="jcelda-input"
                      type="text"
                      maxLength={1}
                      value={celdas[key] || ''}
                      onChange={() => {}} // controlado por onKeyDown
                      onKeyDown={e => handleKeyDown(r, c, e)}
                      onFocus={() => {
                        setSeleccionada({ r, c })
                        const words = palabrasEnCelda(r, c)
                        const tieneDir = words.some(p => p.horizontal === (direccion === 'h'))
                        if (!tieneDir) setDireccion(direccion === 'h' ? 'v' : 'h')
                      }}
                      readOnly
                      aria-label={`Celda ${r},${c}`}
                    />
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── Pistas ── */}
        <div className="juego-pistas">
          <div className="juego-pistas-col">
            <h3>→ Horizontales</h3>
            {horizontal.map(p => {
              const num = wordNumbers[p.originalIndex]
              const activa = palabraActiva === p
              return (
                <p
                  key={p.originalIndex}
                  className={`juego-pista-item${activa ? ' juego-pista-activa' : ''}`}
                  onClick={() => {
                    setDireccion('h')
                    setSeleccionada({ r: p.row, c: p.col })
                    setTimeout(() => inputsRef.current[`${p.row},${p.col}`]?.focus(), 0)
                  }}
                >
                  <strong>{num}.</strong> {descripciones[p.originalIndex] || <em>Sin pista</em>}
                </p>
              )
            })}
          </div>
          <div className="juego-pistas-col">
            <h3>↓ Verticales</h3>
            {vertical.map(p => {
              const num = wordNumbers[p.originalIndex]
              const activa = palabraActiva === p
              return (
                <p
                  key={p.originalIndex}
                  className={`juego-pista-item${activa ? ' juego-pista-activa' : ''}`}
                  onClick={() => {
                    setDireccion('v')
                    setSeleccionada({ r: p.row, c: p.col })
                    setTimeout(() => inputsRef.current[`${p.row},${p.col}`]?.focus(), 0)
                  }}
                >
                  <strong>{num}.</strong> {descripciones[p.originalIndex] || <em>Sin pista</em>}
                </p>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
