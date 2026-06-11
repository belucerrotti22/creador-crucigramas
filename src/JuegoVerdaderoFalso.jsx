import { useState } from 'react'
import './JuegoVerdaderoFalso.css'

/**
 * Props:
 *   nombre: string
 *   preguntas: Array<{ pregunta: string, respuesta: boolean }>
 */
export default function JuegoVerdaderoFalso({ nombre, preguntas }) {
  const [respuestas, setRespuestas] = useState({})   // { idx: true | false }
  const [confirmadas, setConfirmadas] = useState(new Set())
  const [finalizado, setFinalizado] = useState(false)

  const total = preguntas.length

  const handleResponder = (idx, valor) => {
    if (confirmadas.has(idx)) return
    setRespuestas(prev => ({ ...prev, [idx]: valor }))
  }

  const handleConfirmar = (idx) => {
    if (respuestas[idx] === undefined) return
    setConfirmadas(prev => new Set([...prev, idx]))
  }

  const isCorrecta = (idx) => respuestas[idx] === preguntas[idx].respuesta

  const todasConfirmadas = confirmadas.size === total
  const puntaje = [...confirmadas].filter(i => isCorrecta(i)).length

  const handleReiniciar = () => {
    setRespuestas({})
    setConfirmadas(new Set())
    setFinalizado(false)
  }

  if (finalizado) {
    const porcentaje = Math.round((puntaje / total) * 100)
    const emoji = porcentaje === 100 ? '🏆' : porcentaje >= 70 ? '🎉' : porcentaje >= 40 ? '😅' : '😬'

    return (
      <div className="jvf-wrapper">
        <div className="jvf-card">
          <div className="jvf-titulo-wrapper">
            <h1 className="jvf-titulo">{nombre || 'Verdadero o Falso'}</h1>
          </div>

          <div className="jvf-resultado-final">
            <div className="jvf-resultado-emoji">{emoji}</div>
            <div className="jvf-resultado-score">{puntaje} / {total}</div>
            <div className="jvf-resultado-porcentaje">{porcentaje}% de respuestas correctas</div>
            <p className="jvf-resultado-mensaje">
              {porcentaje === 100
                ? '¡Perfecto! Respondiste todo correctamente.'
                : porcentaje >= 70
                  ? '¡Muy bien! Casi perfecto.'
                  : porcentaje >= 40
                    ? 'No estuvo mal, pero hay cosas para repasar.'
                    : 'Hay bastante para estudiar. ¡No te rindas!'}
            </p>
          </div>

          <div className="jvf-repaso">
            <p className="jvf-repaso-titulo">Repaso de respuestas</p>
            {preguntas.map((preg, i) => {
              const correcta = isCorrecta(i)
              const miResp = respuestas[i]
              return (
                <div key={i} className={`jvf-repaso-item ${correcta ? 'jvf-repaso-ok' : 'jvf-repaso-mal'}`}>
                  <div className="jvf-repaso-header">
                    <span className="jvf-repaso-icon">{correcta ? '✅' : '❌'}</span>
                    <span className="jvf-repaso-pregunta">{i + 1}. {preg.pregunta}</span>
                  </div>
                  <div className="jvf-repaso-detalle">
                    <span className="jvf-repaso-label">Tu respuesta:</span>
                    <span className={`jvf-repaso-resp ${miResp ? 'jvf-resp-v' : 'jvf-resp-f'}`}>
                      {miResp ? '✔ Verdadero' : '✘ Falso'}
                    </span>
                    {!correcta && (
                      <>
                        <span className="jvf-repaso-label">Correcta:</span>
                        <span className={`jvf-repaso-resp ${preg.respuesta ? 'jvf-resp-v' : 'jvf-resp-f'}`}>
                          {preg.respuesta ? '✔ Verdadero' : '✘ Falso'}
                        </span>
                      </>
                    )}
                  </div>
                  {!correcta && preg.explicacion && (
                    <p className="jvf-repaso-explicacion">
                      <span className="jvf-repaso-explicacion-label">💬</span> {preg.explicacion}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <button className="jvf-btn-reiniciar" onClick={handleReiniciar}>
            🔄 Volver a intentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="jvf-wrapper">
      <div className="jvf-card">

        <div className="jvf-titulo-wrapper">
          <h1 className="jvf-titulo">{nombre || 'Verdadero o Falso'}</h1>
          <p className="jvf-progreso-text">
            {confirmadas.size} de {total} respondida{total !== 1 ? 's' : ''}
          </p>
          <div className="jvf-barra-progreso">
            <div
              className="jvf-barra-fill"
              style={{ width: `${(confirmadas.size / total) * 100}%` }}
            />
          </div>
        </div>

        <div className="jvf-preguntas-lista">
          {preguntas.map((preg, idx) => {
            const conf = confirmadas.has(idx)
            const resp = respuestas[idx]
            const correcta = conf && isCorrecta(idx)
            const incorrecta = conf && !isCorrecta(idx)

            return (
              <div
                key={idx}
                className={`jvf-pregunta${conf ? (correcta ? ' jvf-pregunta-ok' : ' jvf-pregunta-mal') : ''}`}
              >
                <div className="jvf-pregunta-enunciado">
                  <span className="jvf-pregunta-num">{idx + 1}</span>
                  <span className="jvf-pregunta-texto">{preg.pregunta}</span>
                  {conf && (
                    <span className={`jvf-pregunta-estado ${correcta ? 'jvf-estado-ok' : 'jvf-estado-mal'}`}>
                      {correcta ? '✅ ¡Correcto!' : '❌ Incorrecto'}
                    </span>
                  )}
                </div>

                <div className="jvf-opciones">
                  <button
                    type="button"
                    className={`jvf-opcion jvf-op-v${resp === true ? ' jvf-op-seleccionada-v' : ''}${conf && preg.respuesta === true ? ' jvf-op-correcta' : ''}${conf && resp === true && !preg.respuesta ? ' jvf-op-incorrecta' : ''}`}
                    onClick={() => handleResponder(idx, true)}
                    disabled={conf}
                  >
                    <span className="jvf-op-indicador">
                      {conf && preg.respuesta === true ? '✔' : conf && resp === true ? '✘' : resp === true ? '●' : '○'}
                    </span>
                    Verdadero
                    {conf && preg.respuesta === true && <span className="jvf-op-tag">Correcta</span>}
                  </button>
                  <button
                    type="button"
                    className={`jvf-opcion jvf-op-f${resp === false ? ' jvf-op-seleccionada-f' : ''}${conf && preg.respuesta === false ? ' jvf-op-correcta' : ''}${conf && resp === false && preg.respuesta ? ' jvf-op-incorrecta' : ''}`}
                    onClick={() => handleResponder(idx, false)}
                    disabled={conf}
                  >
                    <span className="jvf-op-indicador">
                      {conf && preg.respuesta === false ? '✔' : conf && resp === false ? '✘' : resp === false ? '●' : '○'}
                    </span>
                    Falso
                    {conf && preg.respuesta === false && <span className="jvf-op-tag">Correcta</span>}
                  </button>
                </div>

                {!conf && (
                  <div className="jvf-confirmar-wrapper">
                    <button
                      className="jvf-btn-confirmar"
                      onClick={() => handleConfirmar(idx)}
                      disabled={resp === undefined}
                      type="button"
                    >
                      Confirmar respuesta
                    </button>
                  </div>
                )}

                {conf && incorrecta && (
                  <div className="jvf-feedback-incorrecto">
                    <p className="jvf-feedback-texto">
                      La respuesta correcta es <strong>{preg.respuesta ? 'Verdadero' : 'Falso'}</strong>.
                    </p>
                    {preg.explicacion && (
                      <p className="jvf-feedback-explicacion">
                        <span className="jvf-feedback-explicacion-label">💬</span> {preg.explicacion}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {todasConfirmadas && (
          <div className="jvf-finalizar-wrapper">
            <div className="jvf-puntaje-parcial">
              Respondiste {puntaje} de {total} preguntas correctamente
            </div>
            <button className="jvf-btn-finalizar" onClick={() => setFinalizado(true)} type="button">
              Ver resultado final 🏁
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
