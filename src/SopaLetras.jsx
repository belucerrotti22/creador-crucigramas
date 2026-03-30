import { useState } from 'react'
import { generarSopaLetras } from './sopaLetras'
import { useSopasGuardadas } from './useCrucigramasGuardados'
import MisCrucigramas from './MisCrucigramas'
import './SopaLetras.css'

export default function SopaLetras() {
  const [palabra, setPalabra] = useState('')
  const [palabras, setPalabras] = useState([])
  const [error, setError] = useState('')
  const [sopa, setSopa] = useState(null)
  const [advertencias, setAdvertencias] = useState([])
  const [nombreSopa, setNombreSopa] = useState('')
  const [sopaActualId, setSopaActualId] = useState(null)

  // ── Configuración ────────────────────────────────────────────
  const longitudMaxima = palabras.length > 0 ? Math.max(...palabras.map(p => p.length)) : 10
  const [tamañoGrilla, setTamañoGrilla] = useState(15)
  const [permitirReversas, setPermitirReversas] = useState(false)
  const tamañoMin = longitudMaxima

  // ── Guardado ─────────────────────────────────────────────────
  const { guardados, guardar, actualizar, eliminar, duplicar } = useSopasGuardadas()
  const [mostrarGuardados, setMostrarGuardados] = useState(false)

  // ── Agregar palabra ──────────────────────────────────────────
  const handleAgregar = () => {
    const nueva = palabra.trim().toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ]/g, '')
    if (!nueva) { setError('Escribí una palabra antes de agregar'); return }
    if (palabras.includes(nueva)) { setError('Esa palabra ya fue agregada'); return }
    if (nueva.length > tamañoGrilla) {
      setError(`La palabra "${nueva}" es más larga que el tamaño de la grilla (${tamañoGrilla})`)
      return
    }
    setPalabras([...palabras, nueva])
    setPalabra('')
    setError('')
  }

  const handleEliminar = (i) => setPalabras(palabras.filter((_, idx) => idx !== i))

  // ── Generar ──────────────────────────────────────────────────
  const handleGenerar = () => {
    if (palabras.length < 1) { setError('Agregá al menos 1 palabra'); return }
    const tamañoEfectivo = Math.max(tamañoGrilla, longitudMaxima)
    const resultado = generarSopaLetras(palabras, tamañoEfectivo, permitirReversas)
    setSopa(resultado)
    setError('')
    setAdvertencias(
      resultado.unplaced.length > 0
        ? [`No se pudieron colocar: ${resultado.unplaced.join(', ')}. Probá con una grilla más grande.`]
        : []
    )
  }

  // ── Guardar / actualizar ─────────────────────────────────────
  const handleGuardar = () => {
    if (!sopa) return
    const datos = { nombre: nombreSopa, palabras, sopa, tamañoGrilla, permitirReversas }
    if (sopaActualId) {
      actualizar(sopaActualId, datos)
    } else {
      const id = guardar(datos)
      setSopaActualId(id)
    }
  }

  // ── Cargar guardada ──────────────────────────────────────────
  const handleCargar = (guardada) => {
    setPalabras(guardada.palabras)
    setSopa(guardada.sopa)
    setNombreSopa(guardada.nombre)
    setSopaActualId(guardada.id)
    setTamañoGrilla(guardada.tamañoGrilla ?? 15)
    setPermitirReversas(guardada.permitirReversas ?? false)
    setAdvertencias([])
    setError('')
    setMostrarGuardados(false)
  }

  // ── Nueva sopa ───────────────────────────────────────────────
  const handleNueva = () => {
    setPalabras([])
    setSopa(null)
    setNombreSopa('')
    setSopaActualId(null)
    setTamañoGrilla(15)
    setPermitirReversas(false)
    setAdvertencias([])
    setError('')
  }

  const handleTamañoChange = (val) => setTamañoGrilla(Math.max(val, tamañoMin))

  // ── Celdas resaltadas en preview ─────────────────────────────
  const celdasPalabras = new Set()
  if (sopa) sopa.placements.forEach(pl => pl.celdas.forEach(({ r, c }) => celdasPalabras.add(`${r},${c}`)))

  return (
    <>
    <div className="app-wrapper">
      {/* ===== Panel izquierdo ===== */}
      <aside className="panel-controles no-print">

        <div className="top-bar">
          <h1 className="titulo">Generador de sopa de letras</h1>
          <div className="top-acciones">
            <button className="btn-top" onClick={() => setMostrarGuardados(true)} title="Mis sopas">
              📂 <span>{guardados.length}</span>
            </button>
            <button className="btn-top" onClick={handleNueva} title="Nueva sopa">
              ➕ Nueva
            </button>
          </div>
        </div>

        <input
          className="input-nombre"
          type="text"
          placeholder="Nombre de la sopa (opcional)..."
          value={nombreSopa}
          onChange={e => setNombreSopa(e.target.value)}
        />

        <div className="input-group">
          <input
            type="text"
            placeholder="Escribí una palabra..."
            value={palabra}
            onChange={e => setPalabra(e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ]/g, ''))}
            onKeyDown={e => e.key === 'Enter' && handleAgregar()}
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

        {/* ── Configuración ── */}
        <div className="sopa-config">
          <p className="palabras-titulo">Configuración</p>

          <div className="sopa-config-fila">
            <label>
              Tamaño de grilla
              <span className="sopa-config-hint">mín. {tamañoMin}</span>
            </label>
            <div className="sopa-config-slider-wrap">
              <input
                type="range"
                min={Math.max(tamañoMin, 5)}
                max={30}
                step={1}
                value={tamañoGrilla}
                onChange={e => handleTamañoChange(Number(e.target.value))}
              />
              <span className="sopa-config-valor">{tamañoGrilla}×{tamañoGrilla}</span>
            </div>
          </div>

          <div className="sopa-config-toggle-row">
            <div>
              <span className="sopa-config-toggle-label">Palabras en reversa</span>
              <span className="sopa-config-toggle-hint">
                Permite colocar palabras de derecha a izquierda, de abajo hacia arriba y en diagonales inversas
              </span>
            </div>
            <button
              className={`toggle-btn${permitirReversas ? ' toggle-on' : ''}`}
              onClick={() => setPermitirReversas(v => !v)}
              aria-pressed={permitirReversas}
            >
              <span className="toggle-thumb" />
            </button>
          </div>
        </div>

        {palabras.length >= 1 && (
          <button className="btn-generar" onClick={handleGenerar}>
            ⚡ Generar sopa de letras
          </button>
        )}

        {advertencias.length > 0 && (
          <div className="advertencias">
            {advertencias.map((a, i) => <p key={i}>⚠️ {a}</p>)}
          </div>
        )}

        {sopa && (
          <>
            <button className="btn-imprimir" onClick={() => window.print()}>
              🖨️ Imprimir sopa de letras
            </button>
            <button className="btn-guardar" onClick={handleGuardar}>
              {sopaActualId ? '💾 Guardar cambios' : '💾 Guardar sopa'}
            </button>
          </>
        )}
      </aside>

      {/* ===== Panel derecho ===== */}
      <main className="panel-crucigrama">
        {!sopa && (
          <div className="placeholder">
            <span>La sopa de letras aparecerá aquí</span>
          </div>
        )}

        {sopa && (
          <div className="sopa-resultado">
            <h2 className="sopa-titulo-impresion">
              {nombreSopa.trim() || 'Sopa de letras'}
            </h2>

            <div className="sopa-grilla" style={{ '--sopa-cols': sopa.grid[0].length }}>
              {sopa.grid.map((fila, r) =>
                fila.map((letra, c) => {
                  const esPalabra = celdasPalabras.has(`${r},${c}`)
                  return (
                    <div key={`${r},${c}`} className={`sopa-celda${esPalabra ? ' sopa-celda-palabra' : ''}`}>
                      {letra}
                    </div>
                  )
                })
              )}
            </div>

            <div className="sopa-palabras-lista">
              <p className="sopa-palabras-lista-titulo">Encontrá estas palabras:</p>
              <div className="sopa-palabras-chips">
                {sopa.placements.map((pl, i) => (
                  <span key={i} className="sopa-palabra-chip">{pl.word}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>

    {mostrarGuardados && (
      <MisCrucigramas
        guardados={guardados}
        onCargar={handleCargar}
        onEliminar={eliminar}
        onDuplicar={duplicar}
        onCerrar={() => setMostrarGuardados(false)}
        titulo="📂 Mis Sopas de Letras"
        mensajeVacio="Todavía no guardaste ninguna sopa de letras."
      />
    )}
    </>
  )
}
