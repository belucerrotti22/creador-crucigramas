/**
 * Utilidades para codificar/decodificar datos para juegos en la URL.
 * Usa lz-string para comprimir + Base64 URL-safe, soportando unicode.
 */

import LZString from 'lz-string'

// ── Helpers Base64 (con compresión lz-string) ────────────────────

function b64encode(obj) {
  const json = JSON.stringify(obj)
  return LZString.compressToEncodedURIComponent(json)
}

function b64decode(encoded) {
  // Intentar descompresión lz-string primero
  const json = LZString.decompressFromEncodedURIComponent(encoded)
  if (json) return JSON.parse(json)

  // Fallback: Base64 manual (para links generados antes de la actualización)
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

// ── Crucigrama ───────────────────────────────────────────────────

export function encodeCrucigramaParaJuego({ nombre, crucigrama, descripciones }) {
  return b64encode({
    n: nombre || 'Crucigrama',
    g: crucigrama.grid.map(fila => fila.map(celda => celda ? celda.letter : null)),
    pl: crucigrama.placements.map(p => ({
      w: p.word, r: p.row, c: p.col, h: p.horizontal ? 1 : 0, i: p.originalIndex,
    })),
    wn: crucigrama.wordNumbers,
    nc: crucigrama.numberedCells,
    d: descripciones,
  })
}

export function decodeCrucigramaDeJuego(encoded) {
  try {
    const payload = b64decode(encoded)
    return {
      nombre: payload.n,
      grid: payload.g.map(fila => fila.map(letter => letter ? { letter } : null)),
      placements: payload.pl.map(p => ({
        word: p.w, row: p.r, col: p.c, horizontal: p.h === 1, originalIndex: p.i,
      })),
      wordNumbers: payload.wn,
      numberedCells: payload.nc,
      descripciones: payload.d,
    }
  } catch {
    return null
  }
}

// ── Wordle ───────────────────────────────────────────────────────

export function encodeWordleParaJuego({ nombre, palabra, pista, intentos }) {
  return b64encode({ n: nombre || 'Adiviná la palabra', p: palabra.toUpperCase(), h: pista || '', i: intentos })
}

export function decodeWordleDeJuego(encoded) {
  try {
    const payload = b64decode(encoded)
    return { nombre: payload.n, palabra: payload.p, pista: payload.h, intentos: payload.i }
  } catch {
    return null
  }
}

// ── Ahorcado ─────────────────────────────────────────────────────

export function encodeAhorcadoParaJuego({ nombre, palabra, pista, intentos }) {
  return b64encode({ n: nombre || 'Ahorcado', p: palabra.toUpperCase(), h: pista || '', i: intentos })
}

export function decodeAhorcadoDeJuego(encoded) {
  try {
    const payload = b64decode(encoded)
    return { nombre: payload.n, palabra: payload.p, pista: payload.h, intentos: payload.i }
  } catch {
    return null
  }
}

// ── Cuestionario ─────────────────────────────────────────────────

/**
 * preguntas: Array de { pregunta, opciones: string[], correctas: number[] }
 * nombre: string
 */
export function encodeCuestionarioParaJuego({ nombre, preguntas }) {
  return b64encode({
    n: nombre || 'Cuestionario',
    q: preguntas.map(p => ({
      p: p.pregunta,
      o: p.opciones,
      c: p.correctas,
    })),
  })
}

export function decodeCuestionarioDeJuego(encoded) {
  try {
    const payload = b64decode(encoded)
    return {
      nombre: payload.n,
      preguntas: payload.q.map(p => ({
        pregunta: p.p,
        opciones: p.o,
        correctas: p.c,
      })),
    }
  } catch {
    return null
  }
}
