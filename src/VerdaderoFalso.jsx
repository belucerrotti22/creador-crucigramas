import { useState, useRef } from 'react'
import { encodeVFParaJuego } from './juego'
import { useVFGuardados } from './useCrucigramasGuardados'
import MisCrucigramas from './MisCrucigramas'
import './VerdaderoFalso.css'

// ── Parser CSV ────────────────────────────────────────────────────
// Formato: Pregunta, Respuesta (verdadero/falso / true/false / v/f / 1/0)
function parsearCSV(texto) {
  const lineas = texto.split(/\r?\n/).filter(l => l.trim())
  if (lineas.length < 2) throw new Error('El archivo no tiene preguntas')

  const primera = lineas[0].toLowerCase()
  const tieneEncabezado = primera.includes('pregunta') || primera.includes('question') || primera.includes('respuesta')
  const datos = tieneEncabezado ? lineas.slice(1) : lineas

  const preguntas = []
  const errores = []

  datos.forEach((linea, idx) => {
    if (!linea.trim()) return
    const cols = parsearFilaCSV(linea)
    if (cols.length < 2) {
      errores.push(`Fila ${idx + 2}: necesita al menos 2 columnas (pregunta, respuesta)`)
      return
    }
    const pregunta = cols[0].trim()
    if (!pregunta) { errores.push(`Fila ${idx + 2}: falta el enunciado`); return }

    const rawResp = cols[1].trim().toLowerCase()
    let respuesta = null
    if (['verdadero', 'true', 'v', '1', 'sí', 'si', 'yes'].includes(rawResp)) respuesta = true
    else if (['falso', 'false', 'f', '0', 'no'].includes(rawResp)) respuesta = false

    if (respuesta === null) {
      errores.push(`Fila ${idx + 2}: respuesta inválida ("${cols[1].trim()}"). Usá: verdadero/falso, true/false, V/F, 1/0`)
      return
    }

    preguntas.push({ pregunta, respuesta })
  })

  return { preguntas, errores }
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

// ── Parser JSON ───────────────────────────────────────────────────
// Acepta: [{ pregunta, respuesta }] o [{ question, answer }] o { preguntas: [...] }
function parsearJSON(texto) {
  let parsed
  try { parsed = JSON.parse(texto) } catch { throw new Error('JSON inválido. Revisá la sintaxis.') }

  const arr = Array.isArray(parsed) ? parsed : (parsed.preguntas || parsed.questions || null)
  if (!Array.isArray(arr)) throw new Error('El JSON debe ser un array de preguntas o un objeto con "preguntas".')

  const preguntas = []
  const errores = []

  arr.forEach((item, idx) => {
    const pregunta = (item.pregunta || item.question || item.enunciado || '').toString().trim()
    if (!pregunta) { errores.push(`Ítem ${idx + 1}: falta el enunciado`); return }

    const rawResp = item.respuesta ?? item.answer ?? item.response ?? null
    let respuesta = null
    if (typeof rawResp === 'boolean') {
      respuesta = rawResp
    } else if (typeof rawResp === 'string') {
      const v = rawResp.toLowerCase().trim()
      if (['verdadero', 'true', 'v', '1', 'sí', 'si', 'yes'].includes(v)) respuesta = true
      else if (['falso', 'false', 'f', '0', 'no'].includes(v)) respuesta = false
    } else if (typeof rawResp === 'number') {
      respuesta = rawResp !== 0
    }

    if (respuesta === null) {
      errores.push(`Ítem ${idx + 1}: respuesta inválida ("${rawResp}"). Usá true/false o "verdadero"/"falso"`)
      return
    }

    preguntas.push({ pregunta, respuesta })
  })

  return { preguntas, errores }
}

// ── Formulario una pregunta ───────────────────────────────────────
function PreguntaVFForm({ onAgregar }) {
  const [pregunta, setPregunta] = useState('')
  const [respuesta, setRespuesta] = useState(null) // true | false | null
  const [error, setError] = useState('')

  const handleAgregar = () => {
    const p = pregunta.trim()
    if (!p) { setError('Escribí el enunciado de la pregunta'); return }
    if (respuesta === null) { setError('Indicá si la afirmación es Verdadera o Falsa'); return }
    setError('')
    onAgregar({ pregunta: p, respuesta })
    setPregunta('')
    setRespuesta(null)
  }

  return (
    <div className="vf-form-pregunta">
      <div className="vf-campo">
        <label>
          <span className="vf-label-text">Enunciado</span>
          <span className="vf-requerido">*</span>
        </label>
        <textarea
          className="vf-textarea"
          placeholder="Escribí una afirmación (verdadera o falsa)..."
          value={pregunta}
          onChange={e => setPregunta(e.target.value)}
          rows={2}
        />
      </div>

      <div className="vf-campo">
        <label><span className="vf-label-text">¿Es verdadera o falsa?</span></label>
        <div className="vf-toggle-respuesta">
          <button
            type="button"
            className={`vf-toggle-btn vf-toggle-v${respuesta === true ? ' vf-toggle-on' : ''}`}
            onClick={() => setRespuesta(true)}
          >
            ✔ Verdadero
          </button>
          <button
            type="button"
            className={`vf-toggle-btn vf-toggle-f${respuesta === false ? ' vf-toggle-on-f' : ''}`}
            onClick={() => setRespuesta(false)}
          >
            ✘ Falso
          </button>
        </div>
      </div>

      {error && <p className="vf-error">{error}</p>}

      <button className="vf-btn-agregar-pregunta" onClick={handleAgregar} type="button">
        ✚ Agregar pregunta
      </button>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────
export default function VerdaderoFalso() {
  const [nombre, setNombre] = useState('')
  const [preguntas, setPreguntas] = useState([])
  const [preguntaExpandida, setPreguntaExpandida] = useState(null)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [errorLink, setErrorLink] = useState('')

  // Importación
  const [csvMsg, setCsvMsg] = useState(null)
  const [jsonTexto, setJsonTexto] = useState('')
  const [jsonMsg, setJsonMsg] = useState(null)
  const [tabImport, setTabImport] = useState('csv') // 'csv' | 'json'
  const csvInputRef = useRef(null)

  // Guardados
  const [mostrarGuardados, setMostrarGuardados] = useState(false)
  const [actualId, setActualId] = useState(null)
  const { guardados, guardar, actualizar, eliminar, duplicar } = useVFGuardados()

  // ── Preguntas ──
  const handleAgregar = (nueva) => setPreguntas(prev => [...prev, nueva])
  const handleEliminar = (i) => {
    setPreguntas(prev => prev.filter((_, idx) => idx !== i))
    if (preguntaExpandida === i) setPreguntaExpandida(null)
  }
  const handleMoverArriba = (i) => {
    if (i === 0) return
    const nuevas = [...preguntas]
    ;[nuevas[i - 1], nuevas[i]] = [nuevas[i], nuevas[i - 1]]
    setPreguntas(nuevas)
  }
  const handleMoverAbajo = (i) => {
    if (i === preguntas.length - 1) return
    const nuevas = [...preguntas]
    ;[nuevas[i], nuevas[i + 1]] = [nuevas[i + 1], nuevas[i]]
    setPreguntas(nuevas)
  }

  // ── Guardar / Cargar / Nuevo ──
  const handleGuardar = () => {
    if (preguntas.length === 0) return
    const datos = { nombre, preguntas, palabras: preguntas.map(p => p.pregunta) }
    if (actualId) { actualizar(actualId, datos) }
    else { const id = guardar(datos); setActualId(id) }
  }
  const handleCargar = (g) => {
    setNombre(g.nombre || '')
    setPreguntas(g.preguntas)
    setActualId(g.id)
    setMostrarGuardados(false)
    setPreguntaExpandida(null)
    setErrorLink('')
  }
  const handleNuevo = () => {
    setNombre(''); setPreguntas([]); setActualId(null)
    setPreguntaExpandida(null); setErrorLink(''); setCsvMsg(null); setJsonMsg(null); setJsonTexto('')
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
        const { preguntas: nuevas, errores } = parsearCSV(ev.target.result)
        if (nuevas.length === 0) {
          setCsvMsg({ tipo: 'error', texto: 'No se encontraron preguntas válidas.' + (errores.length ? ' ' + errores.join(' | ') : '') })
          return
        }
        setPreguntas(prev => [...prev, ...nuevas])
        setCsvMsg({
          tipo: 'ok',
          texto: `✅ Se importaron ${nuevas.length} pregunta${nuevas.length !== 1 ? 's' : ''}${errores.length ? ` (${errores.length} fila${errores.length !== 1 ? 's' : ''} omitida${errores.length !== 1 ? 's' : ''})` : ''}.`,
        })
        setTimeout(() => setCsvMsg(null), 5000)
      } catch (err) {
        setCsvMsg({ tipo: 'error', texto: 'Error al leer el archivo: ' + err.message })
      }
    }
    reader.readAsText(archivo, 'UTF-8')
  }

  // ── JSON ──
  const handleJsonImport = () => {
    setJsonMsg(null)
    const texto = jsonTexto.trim()
    if (!texto) { setJsonMsg({ tipo: 'error', texto: 'Pegá el JSON antes de importar.' }); return }
    try {
      const { preguntas: nuevas, errores } = parsearJSON(texto)
      if (nuevas.length === 0) {
        setJsonMsg({ tipo: 'error', texto: 'No se encontraron preguntas válidas.' + (errores.length ? ' ' + errores.join(' | ') : '') })
        return
      }
      setPreguntas(prev => [...prev, ...nuevas])
      setJsonTexto('')
      setJsonMsg({
        tipo: 'ok',
        texto: `✅ Se importaron ${nuevas.length} pregunta${nuevas.length !== 1 ? 's' : ''}${errores.length ? ` (${errores.length} omitida${errores.length !== 1 ? 's' : ''})` : ''}.`,
      })
      setTimeout(() => setJsonMsg(null), 5000)
    } catch (err) {
      setJsonMsg({ tipo: 'error', texto: err.message })
    }
  }

  // ── Links ──
  const getEncoded = () => encodeVFParaJuego({ nombre, preguntas })
  const getUrl = () => `${window.location.origin}${window.location.pathname}#vf=${getEncoded()}`

  const handleCopiarLink = () => {
    if (preguntas.length === 0) { setErrorLink('Agregá al menos una pregunta antes de generar el link'); return }
    setErrorLink('')
    navigator.clipboard.writeText(getUrl()).then(() => {
      setLinkCopiado(true)
      setTimeout(() => setLinkCopiado(false), 2500)
    })
  }
  const handleHacer = () => {
    if (preguntas.length === 0) { setErrorLink('Agregá al menos una pregunta antes de hacer el juego'); return }
    setErrorLink('')
    window.open(getUrl(), '_blank')
  }

  return (
    <>
    <div className="vf-wrapper">
      <div className="vf-card">

        {/* Header */}
        <div className="vf-header">
          <div className="vf-header-top">
            <h1 className="titulo">Verdadero o Falso</h1>
            <div className="vf-top-acciones">
              <button className="vf-btn-top" onClick={() => setMostrarGuardados(true)} title="Mis juegos guardados">
                📂 <span>{guardados.length}</span>
              </button>
              <button className="vf-btn-top" onClick={handleNuevo} title="Nuevo">
                ➕ Nuevo
              </button>
            </div>
          </div>
          <p className="vf-subtitulo">
            Creá preguntas de verdadero o falso y compartí el link para que otros las respondan
          </p>
        </div>

        {/* Nombre */}
        <div className="vf-campo">
          <label>
            <span className="vf-label-text">Nombre del juego</span>
            <span className="vf-opcional"> (opcional)</span>
          </label>
          <input
            className="input-nombre"
            type="text"
            placeholder='Ej: "Historia Argentina", "Biología celular"…'
            value={nombre}
            onChange={e => setNombre(e.target.value)}
          />
        </div>

        {/* Importar */}
        <div className="vf-import-section">
          <div className="vf-import-tabs">
            <button
              type="button"
              className={`vf-import-tab${tabImport === 'csv' ? ' vf-import-tab-activa' : ''}`}
              onClick={() => setTabImport('csv')}
            >📂 CSV</button>
            <button
              type="button"
              className={`vf-import-tab${tabImport === 'json' ? ' vf-import-tab-activa' : ''}`}
              onClick={() => setTabImport('json')}
            >{ '{ }' } JSON</button>
          </div>

          {tabImport === 'csv' && (
            <div className="vf-import-body">
              <p className="vf-import-hint">
                Formato: <code>Enunciado, Respuesta</code><br />
                Respuesta: <code>verdadero</code>/<code>falso</code>, <code>true</code>/<code>false</code>, <code>V</code>/<code>F</code>, <code>1</code>/<code>0</code>
              </p>
              <input ref={csvInputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={handleCsvImport} />
              <button className="vf-btn-import" type="button" onClick={() => csvInputRef.current?.click()}>
                Seleccionar archivo CSV
              </button>
              {csvMsg && <p className={`vf-import-msg vf-import-msg-${csvMsg.tipo}`}>{csvMsg.texto}</p>}
            </div>
          )}

          {tabImport === 'json' && (
            <div className="vf-import-body">
              <p className="vf-import-hint">
                Pegá un array JSON: <code>{`[{"pregunta":"...", "respuesta": true}, ...]`}</code>
              </p>
              <textarea
                className="vf-json-textarea"
                rows={5}
                placeholder={'[\n  { "pregunta": "El agua hierve a 100°C", "respuesta": true },\n  { "pregunta": "La Tierra es plana", "respuesta": false }\n]'}
                value={jsonTexto}
                onChange={e => setJsonTexto(e.target.value)}
              />
              <button className="vf-btn-import" type="button" onClick={handleJsonImport}>
                Importar JSON
              </button>
              {jsonMsg && <p className={`vf-import-msg vf-import-msg-${jsonMsg.tipo}`}>{jsonMsg.texto}</p>}
            </div>
          )}
        </div>

        <div className="vf-separador" />

        {/* Lista de preguntas */}
        {preguntas.length > 0 && (
          <div className="vf-lista-preguntas">
            <p className="vf-lista-titulo">
              Preguntas
              <span className="vf-badge">{preguntas.length}</span>
            </p>
            {preguntas.map((preg, i) => (
              <div key={i} className="vf-pregunta-item">
                <div
                  className="vf-pregunta-header"
                  onClick={() => setPreguntaExpandida(preguntaExpandida === i ? null : i)}
                >
                  <span className="vf-pregunta-num">{i + 1}</span>
                  <span className="vf-pregunta-texto">{preg.pregunta}</span>
                  <span className={`vf-resp-badge${preg.respuesta ? ' vf-resp-v' : ' vf-resp-f'}`}>
                    {preg.respuesta ? '✔ V' : '✘ F'}
                  </span>
                  <span className="vf-chevron">{preguntaExpandida === i ? '▲' : '▼'}</span>
                </div>

                {preguntaExpandida === i && (
                  <div className="vf-pregunta-detalle">
                    <span className={`vf-detalle-resp${preg.respuesta ? ' vf-detalle-v' : ' vf-detalle-f'}`}>
                      {preg.respuesta ? '✔ Verdadero' : '✘ Falso'}
                    </span>
                  </div>
                )}

                <div className="vf-pregunta-acciones">
                  <button className="vf-btn-mover" onClick={() => handleMoverArriba(i)} disabled={i === 0} title="Mover arriba">↑</button>
                  <button className="vf-btn-mover" onClick={() => handleMoverAbajo(i)} disabled={i === preguntas.length - 1} title="Mover abajo">↓</button>
                  <button className="vf-btn-eliminar" onClick={() => handleEliminar(i)} title="Eliminar">🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {preguntas.length > 0 && <div className="vf-separador" />}

        {/* Formulario nueva pregunta */}
        <div className="vf-nueva-titulo">
          {preguntas.length === 0 ? '📝 Primera pregunta' : `📝 Pregunta ${preguntas.length + 1}`}
        </div>
        <PreguntaVFForm onAgregar={handleAgregar} />

        {/* Acciones finales */}
        {preguntas.length > 0 && (
          <>
            <div className="vf-separador" />
            <div className="vf-acciones-finales">
              {errorLink && <p className="vf-error">{errorLink}</p>}
              <button className="vf-btn-link" onClick={handleCopiarLink}>
                {linkCopiado ? '✅ ¡Link copiado!' : '🔗 Generar y copiar link'}
              </button>
              <button className="vf-btn-hacer" onClick={handleHacer}>
                ▶ Hacer verdadero o falso
              </button>
              <button className="vf-btn-guardar" onClick={handleGuardar}>
                {actualId ? '💾 Guardar cambios' : '💾 Guardar'}
              </button>
              <p className="vf-hint-link">
                El link incluye todas las preguntas y respuestas. Quienes lo abran podrán responder el juego.
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
        titulo="📂 Mis juegos de V/F"
        mensajeVacio="Todavía no guardaste ningún juego."
        itemLabel="preguntas"
      />
    )}
    </>
  )
}
