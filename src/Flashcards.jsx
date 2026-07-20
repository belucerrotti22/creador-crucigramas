import { useState, useRef } from 'react'
import { encodeFlashcardsParaJuego } from './juego'
import { useFlashcardsGuardados } from './useCrucigramasGuardados'
import MisCrucigramas from './MisCrucigramas'
import './Flashcards.css'

// ── Parser CSV ────────────────────────────────────────────────────
// Formato: Frente, Reverso
function parsearCSV(texto) {
  const lineas = texto.split(/\r?\n/).filter(l => l.trim())
  if (lineas.length < 2) throw new Error('El archivo no tiene tarjetas')

  const primera = lineas[0].toLowerCase()
  const tieneEncabezado =
    primera.includes('frente') ||
    primera.includes('front') ||
    primera.includes('pregunta') ||
    primera.includes('reverso') ||
    primera.includes('back') ||
    primera.includes('respuesta')
  const datos = tieneEncabezado ? lineas.slice(1) : lineas

  const tarjetas = []
  const errores = []

  datos.forEach((linea, idx) => {
    if (!linea.trim()) return
    const cols = parsearFilaCSV(linea)
    if (cols.length < 2) {
      errores.push(`Fila ${idx + 2}: necesita al menos 2 columnas (frente, reverso)`)
      return
    }
    const frente = cols[0].trim()
    const reverso = cols[1].trim()
    if (!frente) { errores.push(`Fila ${idx + 2}: falta el frente de la tarjeta`); return }
    if (!reverso) { errores.push(`Fila ${idx + 2}: falta el reverso de la tarjeta`); return }
    tarjetas.push({ frente, reverso })
  })

  return { tarjetas, errores }
}

function parsearFilaCSV(linea) {
  const cols = []
  let actual = ''
  let dentroComillas = false
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i]
    if (c === '"') {
      if (dentroComillas && linea[i + 1] === '"') { actual += '"'; i++ }
      else dentroComillas = !dentroComillas
    } else if (c === ',' && !dentroComillas) {
      cols.push(actual); actual = ''
    } else {
      actual += c
    }
  }
  cols.push(actual)
  return cols
}

// ── Formulario una tarjeta ────────────────────────────────────────
function TarjetaForm({ onAgregar }) {
  const [frente, setFrente] = useState('')
  const [reverso, setReverso] = useState('')
  const [error, setError] = useState('')

  const handleAgregar = () => {
    const f = frente.trim()
    const r = reverso.trim()
    if (!f) { setError('Escribí el frente de la tarjeta'); return }
    if (!r) { setError('Escribí el reverso de la tarjeta'); return }
    setError('')
    onAgregar({ frente: f, reverso: r })
    setFrente('')
    setReverso('')
  }

  return (
    <div className="fc-form-tarjeta">
      <div className="fc-form-campos">
        <div className="fc-campo">
          <label>
            <span className="fc-label-text">Frente</span>
            <span className="fc-requerido">*</span>
          </label>
          <textarea
            className="fc-textarea"
            placeholder="Ej: ¿Cuál es la capital de Francia?"
            value={frente}
            onChange={e => setFrente(e.target.value)}
            rows={2}
          />
        </div>
        <div className="fc-campo">
          <label>
            <span className="fc-label-text">Reverso</span>
            <span className="fc-requerido">*</span>
          </label>
          <textarea
            className="fc-textarea"
            placeholder="Ej: París"
            value={reverso}
            onChange={e => setReverso(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      {error && <p className="fc-error">{error}</p>}

      <button className="fc-btn-agregar-tarjeta" onClick={handleAgregar} type="button">
        ✚ Agregar tarjeta
      </button>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────
export default function Flashcards() {
  const [nombre, setNombre] = useState('')
  const [tarjetas, setTarjetas] = useState([])
  const [tarjetaExpandida, setTarjetaExpandida] = useState(null)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [errorLink, setErrorLink] = useState('')

  // Importación
  const [csvMsg, setCsvMsg] = useState(null)
  const csvInputRef = useRef(null)

  // Guardados
  const [mostrarGuardados, setMostrarGuardados] = useState(false)
  const [actualId, setActualId] = useState(null)
  const { guardados, guardar, actualizar, eliminar, duplicar } = useFlashcardsGuardados()

  // ── Tarjetas ──
  const handleAgregar = (nueva) => setTarjetas(prev => [...prev, nueva])
  const handleEliminar = (i) => {
    setTarjetas(prev => prev.filter((_, idx) => idx !== i))
    if (tarjetaExpandida === i) setTarjetaExpandida(null)
  }
  const handleMoverArriba = (i) => {
    if (i === 0) return
    const nuevas = [...tarjetas]
    ;[nuevas[i - 1], nuevas[i]] = [nuevas[i], nuevas[i - 1]]
    setTarjetas(nuevas)
  }
  const handleMoverAbajo = (i) => {
    if (i === tarjetas.length - 1) return
    const nuevas = [...tarjetas]
    ;[nuevas[i], nuevas[i + 1]] = [nuevas[i + 1], nuevas[i]]
    setTarjetas(nuevas)
  }

  // ── Guardar / Cargar / Nuevo ──
  const handleGuardar = () => {
    if (tarjetas.length === 0) return
    const datos = { nombre, tarjetas, palabras: tarjetas.map(t => t.frente) }
    if (actualId) { actualizar(actualId, datos) }
    else { const id = guardar(datos); setActualId(id) }
  }
  const handleCargar = (g) => {
    setNombre(g.nombre || '')
    setTarjetas(g.tarjetas)
    setActualId(g.id)
    setMostrarGuardados(false)
    setTarjetaExpandida(null)
    setErrorLink('')
    setCsvMsg(null)
  }
  const handleNuevo = () => {
    setNombre(''); setTarjetas([]); setActualId(null)
    setTarjetaExpandida(null); setErrorLink(''); setCsvMsg(null)
  }

  // ── CSV ──
  const handleCsvImport = (e) => {
    const archivo = e.target.files?.[0]
    if (!csvInputRef.current) return
    csvInputRef.current.value = ''
    if (!archivo) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const { tarjetas: nuevas, errores } = parsearCSV(ev.target.result)
        if (nuevas.length === 0) {
          setCsvMsg({ tipo: 'error', texto: 'No se encontraron tarjetas válidas.' + (errores.length ? ' ' + errores.join(' | ') : '') })
          return
        }
        setTarjetas(prev => [...prev, ...nuevas])
        setCsvMsg({
          tipo: 'ok',
          texto: `✅ Se importaron ${nuevas.length} tarjeta${nuevas.length !== 1 ? 's' : ''}${errores.length ? ` (${errores.length} fila${errores.length !== 1 ? 's' : ''} omitida${errores.length !== 1 ? 's' : ''})` : ''}.`,
        })
        setTimeout(() => setCsvMsg(null), 5000)
      } catch (err) {
        setCsvMsg({ tipo: 'error', texto: 'Error al leer el archivo: ' + err.message })
      }
    }
    reader.readAsText(archivo, 'UTF-8')
  }

  // ── Links ──
  const getEncoded = () => encodeFlashcardsParaJuego({ nombre, tarjetas })
  const getUrl = () => `${window.location.origin}${window.location.pathname}#flashcards=${getEncoded()}`

  const handleCopiarLink = () => {
    if (tarjetas.length === 0) { setErrorLink('Agregá al menos una tarjeta antes de generar el link'); return }
    setErrorLink('')
    navigator.clipboard.writeText(getUrl()).then(() => {
      setLinkCopiado(true)
      setTimeout(() => setLinkCopiado(false), 2500)
    })
  }
  const handleHacer = () => {
    if (tarjetas.length === 0) { setErrorLink('Agregá al menos una tarjeta antes de hacer el juego'); return }
    setErrorLink('')
    window.open(getUrl(), '_blank')
  }

  return (
    <>
    <div className="fc-wrapper">
      <div className="fc-card">

        {/* Header */}
        <div className="fc-header">
          <div className="fc-header-top">
            <h1 className="titulo">Flashcards</h1>
            <div className="fc-top-acciones">
              <button className="fc-btn-top" onClick={() => setMostrarGuardados(true)} title="Mis juegos guardados">
                📂 <span>{guardados.length}</span>
              </button>
              <button className="fc-btn-top" onClick={handleNuevo} title="Nuevo">
                ➕ Nuevo
              </button>
            </div>
          </div>
          <p className="fc-subtitulo">
            Creá tarjetas con frente y reverso y compartí el link para estudiar
          </p>
        </div>

        {/* Nombre */}
        <div className="fc-campo">
          <label>
            <span className="fc-label-text">Nombre del mazo</span>
            <span className="fc-opcional"> (opcional)</span>
          </label>
          <input
            className="input-nombre"
            type="text"
            placeholder='Ej: "Capitales del mundo", "Vocabulario inglés"…'
            value={nombre}
            onChange={e => setNombre(e.target.value)}
          />
        </div>

        {/* Importar CSV */}
        <div className="fc-import-section">
          <p className="fc-import-titulo">📂 Importar desde CSV</p>
          <p className="fc-import-hint">
            Formato: <code>Frente, Reverso</code><br />
            La primera fila puede ser un encabezado (se omite automáticamente).
          </p>
          <input ref={csvInputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={handleCsvImport} />
          <button className="fc-btn-import" type="button" onClick={() => csvInputRef.current?.click()}>
            Seleccionar archivo CSV
          </button>
          {csvMsg && <p className={`fc-import-msg fc-import-msg-${csvMsg.tipo}`}>{csvMsg.texto}</p>}
        </div>

        <div className="fc-separador" />

        {/* Lista de tarjetas */}
        {tarjetas.length > 0 && (
          <div className="fc-lista-tarjetas">
            <p className="fc-lista-titulo">
              Tarjetas
              <span className="fc-badge">{tarjetas.length}</span>
            </p>
            {tarjetas.map((t, i) => (
              <div key={i} className="fc-tarjeta-item">
                <div
                  className="fc-tarjeta-header"
                  onClick={() => setTarjetaExpandida(tarjetaExpandida === i ? null : i)}
                >
                  <span className="fc-tarjeta-num">{i + 1}</span>
                  <span className="fc-tarjeta-texto">{t.frente}</span>
                  <span className="fc-chevron">{tarjetaExpandida === i ? '▲' : '▼'}</span>
                </div>

                {tarjetaExpandida === i && (
                  <div className="fc-tarjeta-detalle">
                    <div className="fc-detalle-fila">
                      <span className="fc-detalle-label">Frente:</span>
                      <span className="fc-detalle-valor">{t.frente}</span>
                    </div>
                    <div className="fc-detalle-fila">
                      <span className="fc-detalle-label">Reverso:</span>
                      <span className="fc-detalle-valor">{t.reverso}</span>
                    </div>
                  </div>
                )}

                <div className="fc-tarjeta-acciones">
                  <button className="fc-btn-mover" onClick={() => handleMoverArriba(i)} disabled={i === 0} title="Mover arriba">↑</button>
                  <button className="fc-btn-mover" onClick={() => handleMoverAbajo(i)} disabled={i === tarjetas.length - 1} title="Mover abajo">↓</button>
                  <button className="fc-btn-eliminar" onClick={() => handleEliminar(i)} title="Eliminar">🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tarjetas.length > 0 && <div className="fc-separador" />}

        {/* Formulario nueva tarjeta */}
        <div className="fc-nueva-titulo">
          {tarjetas.length === 0 ? '📝 Primera tarjeta' : `📝 Tarjeta ${tarjetas.length + 1}`}
        </div>
        <TarjetaForm onAgregar={handleAgregar} />

        {/* Acciones finales */}
        {tarjetas.length > 0 && (
          <>
            <div className="fc-separador" />
            <div className="fc-acciones-finales">
              {errorLink && <p className="fc-error">{errorLink}</p>}
              <button className="fc-btn-link" onClick={handleCopiarLink}>
                {linkCopiado ? '✅ ¡Link copiado!' : '🔗 Generar y copiar link'}
              </button>
              <button className="fc-btn-hacer" onClick={handleHacer}>
                ▶ Estudiar flashcards
              </button>
              <button className="fc-btn-guardar" onClick={handleGuardar}>
                {actualId ? '💾 Guardar cambios' : '💾 Guardar'}
              </button>
              <p className="fc-hint-link">
                El link incluye todas las tarjetas. Quienes lo abran podrán estudiarlas.
              </p>
            </div>
          </>
        )}

      </div>
    </div>

    {mostrarGuardados && (
      <MisCrucigramas
        guardados={guardados}
        onCargar={handleCargar}
        onEliminar={eliminar}
        onDuplicar={duplicar}
        onCerrar={() => setMostrarGuardados(false)}
        titulo="📂 Mis mazos de flashcards"
        mensajeVacio="Todavía no guardaste ningún mazo."
        itemLabel="tarjetas"
      />
    )}
    </>
  )
}
