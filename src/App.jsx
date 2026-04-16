import { useState, useRef } from 'react'
import { generarCrucigrama } from './crucigrama'
import { useCrucigramasGuardados } from './useCrucigramasGuardados'
import { encodeCrucigramaParaJuego } from './juego'
import MisCrucigramas from './MisCrucigramas'
import SopaLetras from './SopaLetras'
import Wordle from './Wordle'
import Hangman from './Hangman'
import Cuestionario from './Cuestionario'
import './App.css'

function App() {
  const [tab, setTab] = useState('crucigrama') // 'crucigrama' | 'sopa' | 'wordle' | 'hangman' | 'cuestionario'

  const [palabra, setPalabra] = useState('')
  const [palabras, setPalabras] = useState([])
  const [error, setError] = useState('')

  const [crucigrama, setCrucigrama] = useState(null)
  const [descripciones, setDescripciones] = useState({})
  const [advertencias, setAdvertencias] = useState([])
  const [pendienteRegenerar, setPendienteRegenerar] = useState(false)

  const [imprimiendo, setImprimiendo] = useState(false)
  const [mostrarGuardados, setMostrarGuardados] = useState(false)
  const [crucigramaActualId, setCrucigramaActualId] = useState(null)
  const [nombreCrucigrama, setNombreCrucigrama] = useState('')
  const printRef = useRef(null)

  // ── Tamaño de celda ──────────────────────────────────────────
  const [tamañoCelda, setTamañoCelda] = useState(36)

  // ── Resaltado de palabra ─────────────────────────────────────
  const [palabraResaltada, setPalabraResaltada] = useState(null)

  // Calcula el set de claves "fila,col" que ocupa un placement
  const celdasDePalabra = (placement) => {
    const celdas = new Set()
    for (let i = 0; i < placement.word.length; i++) {
      const r = placement.horizontal ? placement.row : placement.row + i
      const c = placement.horizontal ? placement.col + i : placement.col
      celdas.add(`${r},${c}`)
    }
    return celdas
  }

  const celdasResaltadas = palabraResaltada !== null && crucigrama
    ? celdasDePalabra(crucigrama.placements.find(pl => pl.originalIndex === palabraResaltada))
    : new Set()

  // ── Opciones de impresión ────────────────────────────────────
  const [mostrarOpcionesImpresion, setMostrarOpcionesImpresion] = useState(false)
  const [opcionesImpresion, setOpcionesImpresion] = useState({
    titulo: '',
    pistasHojaSeparada: true,
  })

  const { guardados, guardar, actualizar, eliminar, duplicar } = useCrucigramasGuardados()

  // ── Agregar palabra ──────────────────────────────────────────
  const handleAgregar = () => {
    const nueva = palabra.trim()
    if (!nueva) {
      setError('Escribe una palabra antes de agregar')
      return
    }
    if (palabras.includes(nueva)) {
      setError('Esa palabra ya fue agregada')
      return
    }
    setPalabras([...palabras, nueva])
    setPalabra('')
    setError('')
    if (crucigrama) setPendienteRegenerar(true) // avisar que hay que regenerar
  }

  const handleEliminar = (index) => {
    setPalabras(palabras.filter((_, i) => i !== index))
    if (crucigrama) setPendienteRegenerar(true)
  }

  // ── Generar crucigrama ───────────────────────────────────────
  const handleGenerar = () => {
    if (palabras.length < 2) {
      setError('Necesitás al menos 2 palabras para generar el crucigrama')
      return
    }
    setError('')
    const resultado = generarCrucigrama(palabras)

    if (!resultado.success) {
      setError('No fue posible generar el crucigrama con estas palabras.')
      return
    }

    // Conservar descripciones previas mapeando por nombre de palabra
    const descPorPalabra = {}
    if (crucigrama) {
      palabras.forEach((p, i) => {
        // Buscar si esta palabra ya tenía descripción en el crucigrama anterior
        const oldIndex = crucigrama.placements.find(pl => pl.word === p)?.originalIndex
        if (oldIndex !== undefined && descripciones[oldIndex]) {
          descPorPalabra[p] = descripciones[oldIndex]
        }
      })
    }

    // Reconstruir descripciones con los nuevos índices
    const nuevasDescripciones = {}
    palabras.forEach((p, i) => {
      if (descPorPalabra[p]) nuevasDescripciones[i] = descPorPalabra[p]
    })

    setCrucigrama(resultado)
    setDescripciones(nuevasDescripciones)
    setPendienteRegenerar(false)

    const avisos = []
    if (resultado.unplaced.length > 0) {
      avisos.push(`Palabras que no pudieron conectarse y quedaron fuera: ${resultado.unplaced.join(', ')}`)
      avisos.push('Tip: probá palabras que compartan más letras en común.')
    }
    setAdvertencias(avisos)
  }

  const handleGuardar = () => {
    if (!crucigrama) return
    const datos = { nombre: nombreCrucigrama, palabras, crucigrama, descripciones }
    if (crucigramaActualId) {
      actualizar(crucigramaActualId, datos)
    } else {
      const id = guardar(datos)
      setCrucigramaActualId(id)
    }
  }

  const handleCargar = (guardado) => {
    setPalabras(guardado.palabras)
    setCrucigrama(guardado.crucigrama)
    setDescripciones(guardado.descripciones)
    setNombreCrucigrama(guardado.nombre)
    setCrucigramaActualId(guardado.id)
    setPendienteRegenerar(false)
    setAdvertencias([])
    setError('')
    setMostrarGuardados(false)
  }

  const handleNuevo = () => {
    setPalabras([])
    setCrucigrama(null)
    setDescripciones({})
    setNombreCrucigrama('')
    setCrucigramaActualId(null)
    setPendienteRegenerar(false)
    setAdvertencias([])
    setError('')
  }

  const handleImprimir = () => {
    setMostrarOpcionesImpresion(true)
  }

  // ── Copiar link de juego ─────────────────────────────────────
  const [linkCopiado, setLinkCopiado] = useState(false)

  const handleCopiarLink = () => {
    if (!crucigrama) return
    const encoded = encodeCrucigramaParaJuego({ nombre: nombreCrucigrama, crucigrama, descripciones })
    const url = `${window.location.origin}${window.location.pathname}?jugar=${encoded}`
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopiado(true)
      setTimeout(() => setLinkCopiado(false), 2500)
    })
  }

  const handleConfirmarImpresion = () => {
    setMostrarOpcionesImpresion(false)
    setImprimiendo(true)
    setTimeout(() => {
      window.print()
      setImprimiendo(false)
    }, 100)
  }

  return (
    <>
    {/* ── Tabs ── */}
    <div className="app-tabs no-print">
      <button
        className={`app-tab${tab === 'crucigrama' ? ' app-tab-activa' : ''}`}
        onClick={() => setTab('crucigrama')}
      >
        🔤 Crucigrama
      </button>
      <button
        className={`app-tab${tab === 'sopa' ? ' app-tab-activa' : ''}`}
        onClick={() => setTab('sopa')}
      >
        🔍 Sopa de letras
      </button>
      <button
        className={`app-tab${tab === 'wordle' ? ' app-tab-activa' : ''}`}
        onClick={() => setTab('wordle')}
      >
        🟩 Wordle
      </button>
      <button
        className={`app-tab${tab === 'hangman' ? ' app-tab-activa' : ''}`}
        onClick={() => setTab('hangman')}
      >
        🪢 Ahorcado
      </button>
      <button
        className={`app-tab${tab === 'cuestionario' ? ' app-tab-activa' : ''}`}
        onClick={() => setTab('cuestionario')}
      >
        📋 Cuestionario
      </button>
    </div>

    {tab === 'sopa' && <SopaLetras />}
    {tab === 'wordle' && <Wordle />}
    {tab === 'hangman' && <Hangman />}
    {tab === 'cuestionario' && <Cuestionario />}

    {tab === 'crucigrama' && (
    <div className="app-wrapper">

      {/* ===== Panel izquierdo: controles ===== */}
      <aside className="panel-controles no-print">
        <div className="top-bar">
          <h1 className="titulo">Generador de crucigramas</h1>
          <div className="top-acciones">
            <button className="btn-top" onClick={() => setMostrarGuardados(true)} title="Mis crucigramas">
              📂 <span>{guardados.length}</span>
            </button>
            <button className="btn-top" onClick={handleNuevo} title="Nuevo crucigrama">
              ➕ Nuevo
            </button>
          </div>
        </div>

        {/* Nombre del crucigrama */}
        <input
          className="input-nombre"
          type="text"
          placeholder="Nombre del crucigrama (opcional)..."
          value={nombreCrucigrama}
          onChange={(e) => setNombreCrucigrama(e.target.value)}
        />

        <div className="input-group">
          <input
            type="text"
            placeholder="Escribe una palabra..."
            value={palabra}
            onChange={(e) => setPalabra(e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleAgregar()}
          />
          <button className="btn-agregar" onClick={handleAgregar}>+ Agregar</button>
        </div>

        {error && <p className="error">{error}</p>}

        {palabras.length > 0 && (
          <div className="palabras-container">
            <p className="palabras-titulo">Palabras ({palabras.length})</p>
            <div className="chips">
              {palabras.map((p, i) => (
                <span key={i} className="chip">
                  {p}
                  <button className="chip-eliminar" onClick={() => handleEliminar(i)}>×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {palabras.length >= 2 && (
          <button className="btn-generar" onClick={handleGenerar}>
            {pendienteRegenerar ? '🔄 Regenerar crucigrama' : '⚡ Generar crucigrama'}
          </button>
        )}

        {pendienteRegenerar && (
          <p className="aviso-regenerar">⚠️ Agregaste o quitaste palabras. Regenerá el crucigrama para actualizarlo. Tus pistas ya escritas se conservarán.</p>
        )}

        {advertencias.length > 0 && (
          <div className="advertencias">
            {advertencias.map((a, i) => <p key={i}>⚠️ {a}</p>)}
          </div>
        )}

        {/* Descripciones / pistas */}
        {crucigrama && (
          <div className="descripciones-panel">
            <p className="palabras-titulo">Pistas / Descripciones</p>
            {palabras
              .map((p, i) => ({ palabra: p, originalIndex: i }))
              .filter(({ originalIndex }) => crucigrama.wordNumbers[originalIndex] !== undefined)
              .sort((a, b) => crucigrama.wordNumbers[a.originalIndex] - crucigrama.wordNumbers[b.originalIndex])
              .map(({ palabra: p, originalIndex }) => (
                <div
                  key={originalIndex}
                  className={`descripcion-item${palabraResaltada === originalIndex ? ' descripcion-item-activa' : ''}`}
                  onMouseEnter={() => setPalabraResaltada(originalIndex)}
                  onMouseLeave={() => setPalabraResaltada(null)}
                >
                  <label>
                    <span className="desc-numero">{crucigrama.wordNumbers[originalIndex]}.</span> {p}
                  </label>
                  <input
                    type="text"
                    placeholder="Escribí la pista..."
                    value={descripciones[originalIndex] || ''}
                    onChange={(e) => setDescripciones({ ...descripciones, [originalIndex]: e.target.value })}
                  />
                </div>
              ))}

            <button className="btn-imprimir" onClick={handleImprimir}>
              🖨️ Imprimir crucigrama
            </button>
            <button className="btn-copiar-link" onClick={handleCopiarLink}>
              {linkCopiado ? '✅ ¡Link copiado!' : '🔗 Copiar link de juego'}
            </button>
            <button className="btn-guardar" onClick={handleGuardar}>
              {crucigramaActualId ? '💾 Guardar cambios' : '💾 Guardar crucigrama'}
            </button>
          </div>
        )}
      </aside>

      {/* ===== Panel derecho: crucigrama ===== */}
      <main className="panel-crucigrama" ref={printRef}>
        {!crucigrama && (
          <div className="placeholder">
            <span>El crucigrama aparecerá aquí</span>
          </div>
        )}

        {crucigrama && (
          <div className="crucigrama-resultado">
            <h2 className="crucigrama-titulo">
              {opcionesImpresion.titulo.trim() || nombreCrucigrama.trim() || 'Crucigrama'}
            </h2>

            {/* Slider tamaño de celda */}
            <div className="celda-slider no-print">
              <span className="celda-slider-label">Tamaño</span>
              <input
                type="range"
                min={20}
                max={56}
                step={2}
                value={tamañoCelda}
                onChange={e => setTamañoCelda(Number(e.target.value))}
              />
              <span className="celda-slider-valor">{tamañoCelda}px</span>
            </div>

            {/* Grilla */}
            {(() => {
              const cols = crucigrama.grid[0]?.length || 1
              const maxPrintWidth = 700
              const cellSize = imprimiendo
                ? Math.min(36, Math.floor(maxPrintWidth / cols))
                : tamañoCelda
              return (
                <div
                  className="grilla"
                  style={{ gridTemplateColumns: `repeat(${cols}, ${cellSize}px)` }}
                >
                  {crucigrama.grid.map((fila, r) =>
                    fila.map((celda, c) => {
                      const key = `${r},${c}`
                      const numero = crucigrama.numberedCells[key]
                      const resaltada = celdasResaltadas.has(key)
                      return (
                        <div
                          key={key}
                          className={`celda ${celda ? 'celda-activa' : 'celda-vacia'}${resaltada ? ' celda-resaltada' : ''}`}
                          style={{ width: cellSize, height: cellSize }}
                        >
                          {celda && numero && <span className="celda-numero">{numero}</span>}
                          {celda && !imprimiendo && <span className="celda-letra">{celda.letter}</span>}
                        </div>
                      )
                    })
                  )}
                </div>
              )
            })()}

            {/* Pistas */}
            <div className={`pistas-impresion${opcionesImpresion.pistasHojaSeparada ? ' pistas-hoja-separada' : ''}`}>
              {(() => {
                const horizontal = []
                const vertical = []
                crucigrama.placements.forEach(p => {
                  const num = crucigrama.wordNumbers[p.originalIndex]
                  const desc = descripciones[p.originalIndex] || '___________________________'
                  const entry = { num, text: `${num}. ${desc}` }
                  if (p.horizontal) horizontal.push(entry)
                  else vertical.push(entry)
                })
                horizontal.sort((a, b) => a.num - b.num)
                vertical.sort((a, b) => a.num - b.num)
                return (
                  <>
                    {horizontal.length > 0 && (
                      <div className="pistas-grupo">
                        <h3>→ Horizontales</h3>
                        {horizontal.map((e, i) => <p key={i}>{e.text}</p>)}
                      </div>
                    )}
                    {vertical.length > 0 && (
                      <div className="pistas-grupo">
                        <h3>↓ Verticales</h3>
                        {vertical.map((e, i) => <p key={i}>{e.text}</p>)}
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        )}
      </main>
    </div>
    )} {/* fin tab crucigrama */}

    {mostrarGuardados && (
      <MisCrucigramas
        guardados={guardados}
        onCargar={handleCargar}
        onEliminar={eliminar}
        onDuplicar={duplicar}
        onCerrar={() => setMostrarGuardados(false)}
      />
    )}

    {mostrarOpcionesImpresion && (
      <div className="modal-overlay no-print" onClick={() => setMostrarOpcionesImpresion(false)}>
        <div className="modal-opciones-impresion" onClick={(e) => e.stopPropagation()}>
          <h2 className="modal-opciones-titulo">🖨️ Opciones de impresión</h2>

          <div className="modal-opciones-campo">
            <label htmlFor="print-titulo">Título en la impresión</label>
            <input
              id="print-titulo"
              type="text"
              placeholder={nombreCrucigrama.trim() || 'Crucigrama'}
              value={opcionesImpresion.titulo}
              onChange={(e) => setOpcionesImpresion({ ...opcionesImpresion, titulo: e.target.value })}
            />
            <span className="modal-opciones-hint">
              Si lo dejás vacío, se usará {nombreCrucigrama.trim() ? `"${nombreCrucigrama.trim()}"` : '"Crucigrama"'}.
            </span>
          </div>

          <div className="modal-opciones-toggle-row">
            <div>
              <span className="modal-opciones-toggle-label">Pistas en hoja separada</span>
              <span className="modal-opciones-hint">Las pistas se imprimirán en una segunda hoja</span>
            </div>
            <button
              className={`toggle-btn${opcionesImpresion.pistasHojaSeparada ? ' toggle-on' : ''}`}
              onClick={() => setOpcionesImpresion({ ...opcionesImpresion, pistasHojaSeparada: !opcionesImpresion.pistasHojaSeparada })}
              aria-pressed={opcionesImpresion.pistasHojaSeparada}
            >
              <span className="toggle-thumb" />
            </button>
          </div>

          <div className="modal-opciones-acciones">
            <button className="btn-cancelar-impresion" onClick={() => setMostrarOpcionesImpresion(false)}>
              Cancelar
            </button>
            <button className="btn-confirmar-impresion" onClick={handleConfirmarImpresion}>
              🖨️ Imprimir
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  )
}

export default App
