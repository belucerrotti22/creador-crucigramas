import { useState } from 'react'
import './JuegoCuestionario.css'

/**
 * Props:
 *   nombre: string
 *   preguntas: Array<{ pregunta: string, opciones: string[], correctas: number[] }>
 */
export default function JuegoCuestionario({ nombre, preguntas }) {
  // respuestas: { [preguntaIdx]: Set<opcionIdx> }
  const [respuestas, setRespuestas] = useState({})
  // confirmadas: Set<preguntaIdx> — preguntas ya respondidas y confirmadas
  const [confirmadas, setConfirmadas] = useState(new Set())
  // finalizado: mostrar resumen
  const [finalizado, setFinalizado] = useState(false)

  const totalPreguntas = preguntas.length

  const handleToggleOpcion = (pregIdx, opIdx) => {
    if (confirmadas.has(pregIdx)) return // ya confirmada
    setRespuestas(prev => {
      const sel = new Set(prev[pregIdx] || [])
      if (sel.has(opIdx)) sel.delete(opIdx)
      else sel.add(opIdx)
      return { ...prev, [pregIdx]: sel }
    })
  }

  const handleConfirmar = (pregIdx) => {
    const sel = respuestas[pregIdx]
    if (!sel || sel.size === 0) return
    setConfirmadas(prev => new Set([...prev, pregIdx]))
  }

  const isCorrecta = (pregIdx) => {
    const preg = preguntas[pregIdx]
    const sel = respuestas[pregIdx]
    if (!sel) return false
    const selArr = [...sel].sort((a, b) => a - b)
    const corrArr = [...preg.correctas].sort((a, b) => a - b)
    return JSON.stringify(selArr) === JSON.stringify(corrArr)
  }

  const preguntasCorrectas = [...confirmadas].filter(i => isCorrecta(i)).length
  const todasConfirmadas = confirmadas.size === totalPreguntas

  const handleFinalizar = () => setFinalizado(true)

  const handleReiniciar = () => {
    setRespuestas({})
    setConfirmadas(new Set())
    setFinalizado(false)
  }

  const puntaje = [...Array(totalPreguntas).keys()].filter(i => isCorrecta(i)).length

  if (finalizado) {
    const porcentaje = Math.round((puntaje / totalPreguntas) * 100)
    const emoji = porcentaje === 100 ? '🏆' : porcentaje >= 70 ? '🎉' : porcentaje >= 40 ? '😅' : '😬'

    return (
      <div className="jcuest-wrapper">
        <div className="jcuest-card">
          <div className="jcuest-titulo-wrapper">
            <h1 className="jcuest-titulo">{nombre || 'Cuestionario'}</h1>
          </div>

          <div className="jcuest-resultado-final">
            <div className="jcuest-resultado-emoji">{emoji}</div>
            <div className="jcuest-resultado-score">
              {puntaje} / {totalPreguntas}
            </div>
            <div className="jcuest-resultado-porcentaje">
              {porcentaje}% de respuestas correctas
            </div>
            <p className="jcuest-resultado-mensaje">
              {porcentaje === 100
                ? '¡Perfecto! Respondiste todo correctamente.'
                : porcentaje >= 70
                  ? '¡Muy bien! Casi perfecta.'
                  : porcentaje >= 40
                    ? 'No estuvo mal, pero hay cosas para repasar.'
                    : 'Hay bastante para estudiar. ¡No te rindas!'}
            </p>
          </div>

          {/* Repaso de respuestas */}
          <div className="jcuest-repaso">
            <p className="jcuest-repaso-titulo">Repaso de respuestas</p>
            {preguntas.map((preg, i) => {
              const sel = respuestas[i] || new Set()
              const correcta = isCorrecta(i)
              return (
                <div key={i} className={`jcuest-repaso-item ${correcta ? 'jcuest-repaso-ok' : 'jcuest-repaso-mal'}`}>
                  <div className="jcuest-repaso-header">
                    <span className="jcuest-repaso-icon">{correcta ? '✅' : '❌'}</span>
                    <span className="jcuest-repaso-pregunta">{i + 1}. {preg.pregunta}</span>
                  </div>
                  <div className="jcuest-repaso-opciones">
                    {preg.opciones.map((op, j) => {
                      const esCorrecta = preg.correctas.includes(j)
                      const seleccionada = sel.has(j)
                      return (
                        <div
                          key={j}
                          className={`jcuest-repaso-opcion
                            ${esCorrecta ? 'jcuest-repaso-opcion-correcta' : ''}
                            ${seleccionada && !esCorrecta ? 'jcuest-repaso-opcion-incorrecta' : ''}
                          `}
                        >
                          <span className="jcuest-repaso-op-icon">
                            {esCorrecta ? '✔' : seleccionada ? '✘' : '○'}
                          </span>
                          {op}
                          {esCorrecta && <span className="jcuest-repaso-tag">Correcta</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <button className="jcuest-btn-reiniciar" onClick={handleReiniciar}>
            🔄 Volver a intentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="jcuest-wrapper">
      <div className="jcuest-card">

        <div className="jcuest-titulo-wrapper">
          <h1 className="jcuest-titulo">{nombre || 'Cuestionario'}</h1>
          <p className="jcuest-progreso-text">
            {confirmadas.size} de {totalPreguntas} respondida{totalPreguntas !== 1 ? 's' : ''}
          </p>
          <div className="jcuest-barra-progreso">
            <div
              className="jcuest-barra-progreso-fill"
              style={{ width: `${(confirmadas.size / totalPreguntas) * 100}%` }}
            />
          </div>
        </div>

        <div className="jcuest-preguntas-lista">
          {preguntas.map((preg, pregIdx) => {
            const sel = respuestas[pregIdx] || new Set()
            const conf = confirmadas.has(pregIdx)
            const esCor = conf && isCorrecta(pregIdx)
            const esInc = conf && !isCorrecta(pregIdx)

            return (
              <div
                key={pregIdx}
                className={`jcuest-pregunta
                  ${conf ? (esCor ? 'jcuest-pregunta-ok' : 'jcuest-pregunta-mal') : ''}
                `}
              >
                <div className="jcuest-pregunta-enunciado">
                  <span className="jcuest-pregunta-num">{pregIdx + 1}</span>
                  <span className="jcuest-pregunta-texto">{preg.pregunta}</span>
                  {conf && (
                    <span className={`jcuest-pregunta-estado ${esCor ? 'jcuest-estado-ok' : 'jcuest-estado-mal'}`}>
                      {esCor ? '✅ ¡Correcto!' : '❌ Incorrecto'}
                    </span>
                  )}
                </div>

                <div className="jcuest-opciones">
                  {preg.opciones.map((op, opIdx) => {
                    const seleccionada = sel.has(opIdx)
                    const esCorrecta = preg.correctas.includes(opIdx)

                    let claseExtra = ''
                    if (conf) {
                      if (esCorrecta) claseExtra = 'jcuest-op-correcta'
                      else if (seleccionada) claseExtra = 'jcuest-op-incorrecta'
                    } else if (seleccionada) {
                      claseExtra = 'jcuest-op-seleccionada'
                    }

                    return (
                      <button
                        key={opIdx}
                        className={`jcuest-opcion ${claseExtra}`}
                        onClick={() => handleToggleOpcion(pregIdx, opIdx)}
                        disabled={conf}
                        type="button"
                      >
                        <span className="jcuest-op-indicador">
                          {conf
                            ? esCorrecta
                              ? '✔'
                              : seleccionada
                                ? '✘'
                                : '○'
                            : seleccionada
                              ? '●'
                              : '○'}
                        </span>
                        <span className="jcuest-op-texto">{op}</span>
                        {conf && esCorrecta && (
                          <span className="jcuest-op-tag-correcta">Correcta</span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {!conf && (
                  <div className="jcuest-confirmar-wrapper">
                    <span className="jcuest-instruccion">
                      {preg.correctas.length > 1
                        ? `Seleccioná ${preg.correctas.length} opciones`
                        : 'Seleccioná una opción'}
                    </span>
                    <button
                      className="jcuest-btn-confirmar"
                      onClick={() => handleConfirmar(pregIdx)}
                      disabled={sel.size === 0}
                      type="button"
                    >
                      Confirmar respuesta
                    </button>
                  </div>
                )}

                {conf && esInc && (
                  <p className="jcuest-feedback-incorrecto">
                    La{preg.correctas.length > 1 ? 's' : ''} respuesta{preg.correctas.length > 1 ? 's' : ''} correcta{preg.correctas.length > 1 ? 's' : ''} está{preg.correctas.length > 1 ? 'n' : ''} marcada{preg.correctas.length > 1 ? 's' : ''} en verde.
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {todasConfirmadas && (
          <div className="jcuest-finalizar-wrapper">
            <div className="jcuest-puntaje-parcial">
              Respondiste {preguntasCorrectas} de {totalPreguntas} preguntas correctamente
            </div>
            <button className="jcuest-btn-finalizar" onClick={handleFinalizar} type="button">
              Ver resultado final 🏁
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
