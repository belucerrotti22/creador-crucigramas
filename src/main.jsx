import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import JuegoCrucigrama from './JuegoCrucigrama.jsx'
import JuegoWordle from './JuegoWordle.jsx'
import JuegoHangman from './JuegoHangman.jsx'
import JuegoCuestionario from './JuegoCuestionario.jsx'
import JuegoVerdaderoFalso from './JuegoVerdaderoFalso.jsx'
import JuegoFlashcards from './JuegoFlashcards.jsx'
import { decodeCrucigramaDeJuego, decodeWordleDeJuego, decodeAhorcadoDeJuego, decodeCuestionarioDeJuego, decodeVFDeJuego, decodeFlashcardsDeJuego } from './juego.js'

// Lee un parámetro del hash (#key=valor) con fallback al query string para links viejos
function getParam(key) {
  const hash = window.location.hash.slice(1)  // elimina el '#'
  const eqIdx = hash.indexOf('=')
  if (eqIdx !== -1 && hash.slice(0, eqIdx) === key) {
    return hash.slice(eqIdx + 1)
  }
  return new URLSearchParams(window.location.search).get(key)
}

const encodedCrucigrama   = getParam('jugar')
const encodedWordle       = getParam('wordle')
const encodedAhorcado     = getParam('ahorcado')
const encodedCuestionario = getParam('cuestionario')
const encodedVF           = getParam('vf')
const encodedFlashcards   = getParam('flashcards')

const datosCrucigrama   = encodedCrucigrama   ? decodeCrucigramaDeJuego(encodedCrucigrama)         : null
const datosWordle       = encodedWordle       ? decodeWordleDeJuego(encodedWordle)                 : null
const datosAhorcado     = encodedAhorcado     ? decodeAhorcadoDeJuego(encodedAhorcado)             : null
const datosCuestionario = encodedCuestionario ? decodeCuestionarioDeJuego(encodedCuestionario)     : null
const datosVF           = encodedVF           ? decodeVFDeJuego(encodedVF)                         : null
const datosFlashcards   = encodedFlashcards   ? decodeFlashcardsDeJuego(encodedFlashcards)         : null

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {datosCrucigrama ? (
      <JuegoCrucigrama
        nombre={datosCrucigrama.nombre}
        grid={datosCrucigrama.grid}
        placements={datosCrucigrama.placements}
        wordNumbers={datosCrucigrama.wordNumbers}
        numberedCells={datosCrucigrama.numberedCells}
        descripciones={datosCrucigrama.descripciones}
      />
    ) : datosWordle ? (
      <JuegoWordle
        nombre={datosWordle.nombre}
        palabra={datosWordle.palabra}
        pista={datosWordle.pista}
        intentos={datosWordle.intentos}
      />
    ) : datosAhorcado ? (
      <JuegoHangman
        nombre={datosAhorcado.nombre}
        palabra={datosAhorcado.palabra}
        pista={datosAhorcado.pista}
        intentos={datosAhorcado.intentos}
      />
    ) : datosCuestionario ? (
      <JuegoCuestionario
        nombre={datosCuestionario.nombre}
        preguntas={datosCuestionario.preguntas}
      />
    ) : datosVF ? (
      <JuegoVerdaderoFalso
        nombre={datosVF.nombre}
        preguntas={datosVF.preguntas}
      />
    ) : datosFlashcards ? (
      <JuegoFlashcards
        nombre={datosFlashcards.nombre}
        tarjetas={datosFlashcards.tarjetas}
      />
    ) : (
      <App />
    )}
  </StrictMode>,
)
