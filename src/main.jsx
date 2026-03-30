import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import JuegoCrucigrama from './JuegoCrucigrama.jsx'
import JuegoWordle from './JuegoWordle.jsx'
import JuegoHangman from './JuegoHangman.jsx'
import { decodeCrucigramaDeJuego, decodeWordleDeJuego, decodeAhorcadoDeJuego } from './juego.js'

const params = new URLSearchParams(window.location.search)

const encodedCrucigrama = params.get('jugar')
const encodedWordle     = params.get('wordle')
const encodedAhorcado   = params.get('ahorcado')

const datosCrucigrama = encodedCrucigrama ? decodeCrucigramaDeJuego(encodedCrucigrama) : null
const datosWordle     = encodedWordle     ? decodeWordleDeJuego(encodedWordle)         : null
const datosAhorcado   = encodedAhorcado   ? decodeAhorcadoDeJuego(encodedAhorcado)     : null

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
    ) : (
      <App />
    )}
  </StrictMode>,
)
