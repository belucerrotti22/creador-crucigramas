import { useState, useRef } from 'react'
import { encodeCuestionarioParaJuego } from './juego'
import './Cuestionario.css'

// ── Parser CSV ───────────────────────────────────────────────────
// Formato esperado:
//   Question, Option 1, Option 2, ..., Option 5, Correct Answer
//   (la respuesta correcta es un número 1-indexado; puede haber de 2 a 5 opciones)
function parsearCSV(texto) {
  const lineas = texto.split(/\r?\n/).filter(l => l.trim())
  if (lineas.length < 2) throw new Error('El archivo no tiene preguntas')

  // Detectar si la primera línea es encabezado (contiene "question" o "pregunta")
  const primeraLinea = lineas[0].toLowerCase()
  const tieneEncabezado = primeraLinea.includes('question') || primeraLinea.includes('pregunta') || primeraLinea.includes('option')
  const datos = tieneEncabezado ? lineas.slice(1) : lineas

  const preguntas = []
  const errores = []

  datos.forEach((linea, idx) => {
    if (!linea.trim()) return
    const cols = parsearFilaCSV(linea)
    // Necesitamos al menos: pregunta + 2 opciones + respuesta = 4 cols
    if (cols.length < 4) {
      errores.push(`Fila ${idx + 2}: no tiene suficientes columnas`)
      return
    }
    const pregunta = cols[0].trim()
    if (!pregunta) { errores.push(`Fila ${idx + 2}: falta el enunciado`); return }

    // La última columna es la respuesta correcta
    const respuestaRaw = cols[cols.length - 1].trim()
    // Las columnas intermedias son las opciones
    const opcionesCrudas = cols.slice(1, cols.length - 1).map(o => o.trim()).filter(o => o !== '')

    if (opcionesCrudas.length < 2) {
      errores.push(`Fila ${idx + 2}: necesita al menos 2 opciones`)
      return
    }

    // La respuesta puede ser "1", "2", etc. (1-indexado) o una letra "A", "B"…
    let idxCorrecta = -1
    if (/^\d+$/.test(respuestaRaw)) {
      idxCorrecta = parseInt(respuestaRaw, 10) - 1
    } else if (/^[a-eA-E]$/.test(respuestaRaw)) {
      idxCorrecta = respuestaRaw.toUpperCase().charCodeAt(0) - 65
    }

    if (idxCorrecta < 0 || idxCorrecta >= opcionesCrudas.length) {
      errores.push(`Fila ${idx + 2}: respuesta correcta inválida ("${respuestaRaw}")`)
      return
    }

    preguntas.push({
      pregunta,
      opciones: opcionesCrudas,
      correctas: [idxCorrecta],
    })
  })

  return { preguntas, errores }
}

// Parsea una fila CSV respetando comillas dobles
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
      cols.push(actual)
      actual = ''
    } else {
      actual += c
    }
  }
  cols.push(actual)
  return cols
}

const MIN_OPCIONES = 2
const MAX_OPCIONES = 5

function PreguntaForm({ onAgregar }) {
  const [pregunta, setPregunta] = useState('')
  const [opciones, setOpciones] = useState(['', ''])
  const [correctas, setCorrectas] = useState([])
  const [error, setError] = useState('')

  const handleOpcionChange = (i, valor) => {
    const nuevas = [...opciones]
    nuevas[i] = valor
    setOpciones(nuevas)
  }

  const handleAgregarOpcion = () => {
    if (opciones.length < MAX_OPCIONES) setOpciones([...opciones, ''])
  }

  const handleQuitarOpcion = (i) => {
    if (opciones.length <= MIN_OPCIONES) return
    const nuevas = opciones.filter((_, idx) => idx !== i)
    setOpciones(nuevas)
    setCorrectas(correctas.filter(c => c !== i).map(c => (c > i ? c - 1 : c)))
  }

  const handleToggleCorrecta = (i) => {
    if (correctas.includes(i)) {
      setCorrectas(correctas.filter(c => c !== i))
    } else {
      setCorrectas([...correctas, i])
    }
  }

  const handleAgregar = () => {
    const p = pregunta.trim()
    if (!p) { setError('Escribí el enunciado de la pregunta'); return }
    const opsFiltradas = opciones.map(o => o.trim())
    if (opsFiltradas.some(o => !o)) { setError('Completá todas las opciones'); return }
    // Verificar opciones únicas
    const unicas = new Set(opsFiltradas.map(o => o.toLowerCase()))
    if (unicas.size !== opsFiltradas.length) { setError('Las opciones deben ser distintas'); return }
    if (correctas.length === 0) { setError('Marcá al menos una opción como correcta'); return }
    setError('')
    onAgregar({ pregunta: p, opciones: opsFiltradas, correctas: [...correctas].sort((a, b) => a - b) })
    setPregunta('')
    setOpciones(['', ''])
    setCorrectas([])
  }

  return (
    <div className="cuest-form-pregunta">
      <div className="cuest-campo">
        <label>
          <span className="cuest-label-text">Enunciado de la pregunta</span>
          <span className="cuest-requerido">*</span>
        </label>
        <textarea
          className="cuest-textarea"
          placeholder="Escribí la pregunta aquí..."
          value={pregunta}
          onChange={e => setPregunta(e.target.value)}
          rows={2}
        />
      </div>

      <div className="cuest-campo">
        <label>
          <span className="cuest-label-text">Opciones</span>
          <span className="cuest-hint-inline"> · Marcá las correctas con ✔</span>
        </label>

        <div className="cuest-opciones-lista">
          {opciones.map((op, i) => (
            <div key={i} className={`cuest-opcion-row${correctas.includes(i) ? ' cuest-opcion-correcta' : ''}`}>
              <button
                className={`cuest-opcion-check${correctas.includes(i) ? ' cuest-check-on' : ''}`}
                onClick={() => handleToggleCorrecta(i)}
                title={correctas.includes(i) ? 'Quitar como correcta' : 'Marcar como correcta'}
                type="button"
              >
                {correctas.includes(i) ? '✔' : '○'}
              </button>
              <input
                className="cuest-opcion-input"
                type="text"
                placeholder={`Opción ${i + 1}…`}
                value={op}
                onChange={e => handleOpcionChange(i, e.target.value)}
              />
              {opciones.length > MIN_OPCIONES && (
                <button
                  className="cuest-opcion-quitar"
                  onClick={() => handleQuitarOpcion(i)}
                  title="Quitar esta opción"
                  type="button"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {opciones.length < MAX_OPCIONES && (
          <button className="cuest-btn-agregar-opcion" onClick={handleAgregarOpcion} type="button">
            + Agregar opción
          </button>
        )}
      </div>

      {error && <p className="cuest-error">{error}</p>}

      <button className="cuest-btn-agregar-pregunta" onClick={handleAgregar} type="button">
        ✚ Agregar pregunta al cuestionario
      </button>
    </div>
  )
}

export default function Cuestionario() {
  const [nombre, setNombre] = useState('')
  const [preguntas, setPreguntas] = useState([])
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [errorLink, setErrorLink] = useState('')
  const [preguntaExpandida, setPreguntaExpandida] = useState(null)
  const [csvMsg, setCsvMsg] = useState(null) // { tipo: 'ok'|'error', texto: string }
  const csvInputRef = useRef(null)

  const handleAgregarPregunta = (nueva) => {
    setPreguntas(prev => [...prev, nueva])
  }

  const handleEliminarPregunta = (i) => {
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
          setCsvMsg({ tipo: 'error', texto: 'No se encontraron preguntas válidas en el archivo.' + (errores.length ? ' ' + errores.join(' | ') : '') })
          return
        }
        setPreguntas(prev => [...prev, ...nuevas])
        setCsvMsg({
          tipo: 'ok',
          texto: `✅ Se importaron ${nuevas.length} pregunta${nuevas.length !== 1 ? 's' : ''}${errores.length ? ` (${errores.length} fila${errores.length !== 1 ? 's' : ''} con error omitida${errores.length !== 1 ? 's' : ''})` : ''}.`,
        })
        setTimeout(() => setCsvMsg(null), 5000)
      } catch (err) {
        setCsvMsg({ tipo: 'error', texto: 'Error al leer el archivo: ' + err.message })
      }
    }
    reader.readAsText(archivo, 'UTF-8')
  }

  const handleCopiarLink = () => {
    if (preguntas.length === 0) {
      setErrorLink('Agregá al menos una pregunta antes de generar el link')
      return
    }
    setErrorLink('')
    const encoded = encodeCuestionarioParaJuego({ nombre, preguntas })
    const url = `${window.location.origin}${window.location.pathname}?cuestionario=${encoded}`
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopiado(true)
      setTimeout(() => setLinkCopiado(false), 2500)
    })
  }

  return (
    <div className="cuest-wrapper">
      <div className="cuest-card">

        <div className="cuest-header">
          <h1 className="titulo">Cuestionario</h1>
          <p className="cuest-subtitulo">
            Creá un cuestionario multiple choice y compartí el link para que otros lo respondan
          </p>
        </div>

        {/* Nombre del cuestionario */}
        <div className="cuest-campo">
          <label>
            <span className="cuest-label-text">Nombre del cuestionario</span>
            <span className="cuest-opcional"> (opcional)</span>
          </label>
          <input
            className="input-nombre"
            type="text"
            placeholder='Ej: "Historia Argentina", "Biología celular"…'
            value={nombre}
            onChange={e => setNombre(e.target.value)}
          />
        </div>

        {/* Importar CSV */}
        <div className="cuest-csv-section">
          <div className="cuest-csv-header">
            <span className="cuest-csv-icono">📂</span>
            <div>
              <p className="cuest-csv-titulo">Importar preguntas desde CSV</p>
              <p className="cuest-csv-hint">
                Formato: <code>Pregunta, Opción 1, …, Opción 5, Respuesta correcta</code><br />
                La respuesta correcta es el número de opción (1, 2, 3…). Las columnas vacías se ignoran.
              </p>
            </div>
          </div>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={handleCsvImport}
          />
          <button
            className="cuest-btn-csv"
            type="button"
            onClick={() => csvInputRef.current?.click()}
          >
            Seleccionar archivo CSV
          </button>
          {csvMsg && (
            <p className={`cuest-csv-msg cuest-csv-msg-${csvMsg.tipo}`}>{csvMsg.texto}</p>
          )}
        </div>

        {/* Separador */}
        <div className="cuest-separador" />

        {/* Lista de preguntas ya agregadas */}
        {preguntas.length > 0 && (
          <div className="cuest-lista-preguntas">
            <p className="cuest-lista-titulo">
              Preguntas del cuestionario
              <span className="cuest-badge">{preguntas.length}</span>
            </p>
            {preguntas.map((preg, i) => (
              <div key={i} className="cuest-pregunta-item">
                <div
                  className="cuest-pregunta-header"
                  onClick={() => setPreguntaExpandida(preguntaExpandida === i ? null : i)}
                >
                  <span className="cuest-pregunta-num">{i + 1}</span>
                  <span className="cuest-pregunta-texto">{preg.pregunta}</span>
                  <span className="cuest-pregunta-badge-ops">
                    {preg.opciones.length} opciones · {preg.correctas.length} correcta{preg.correctas.length !== 1 ? 's' : ''}
                  </span>
                  <span className="cuest-chevron">{preguntaExpandida === i ? '▲' : '▼'}</span>
                </div>

                {preguntaExpandida === i && (
                  <div className="cuest-pregunta-detalle">
                    {preg.opciones.map((op, j) => (
                      <div
                        key={j}
                        className={`cuest-detalle-opcion${preg.correctas.includes(j) ? ' cuest-detalle-correcta' : ''}`}
                      >
                        <span className="cuest-detalle-check">
                          {preg.correctas.includes(j) ? '✔' : '○'}
                        </span>
                        {op}
                      </div>
                    ))}
                  </div>
                )}

                <div className="cuest-pregunta-acciones">
                  <button
                    className="cuest-btn-mover"
                    onClick={() => handleMoverArriba(i)}
                    disabled={i === 0}
                    title="Mover arriba"
                  >↑</button>
                  <button
                    className="cuest-btn-mover"
                    onClick={() => handleMoverAbajo(i)}
                    disabled={i === preguntas.length - 1}
                    title="Mover abajo"
                  >↓</button>
                  <button
                    className="cuest-btn-eliminar-preg"
                    onClick={() => handleEliminarPregunta(i)}
                    title="Eliminar pregunta"
                  >🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Separador */}
        {preguntas.length > 0 && <div className="cuest-separador" />}

        {/* Formulario nueva pregunta */}
        <div className="cuest-nueva-pregunta-titulo">
          {preguntas.length === 0
            ? '📝 Primera pregunta'
            : `📝 Pregunta ${preguntas.length + 1}`}
        </div>
        <PreguntaForm onAgregar={handleAgregarPregunta} />

        {/* Separador */}
        {preguntas.length > 0 && (
          <>
            <div className="cuest-separador" />
            <div className="cuest-acciones-finales">
              {errorLink && <p className="cuest-error">{errorLink}</p>}
              <button className="cuest-btn-link" onClick={handleCopiarLink}>
                {linkCopiado ? '✅ ¡Link copiado!' : '🔗 Generar y copiar link del cuestionario'}
              </button>
              <p className="cuest-hint-link">
                El link incluye todas las preguntas y respuestas correctas. Quienes lo abran podrán responder el cuestionario.
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
