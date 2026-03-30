/**
 * Motor de generación de sopa de letras
 */

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function letraAleatoria() {
  return LETRAS[Math.floor(Math.random() * LETRAS.length)]
}

/**
 * Todas las direcciones posibles.
 * Normal: →, ↓, ↘
 * Reversibles: ←, ↑, ↖, ↗, ↙
 */
const DIRS_NORMAL = [
  { dr: 0,  dc: 1,  nombre: '→'  }, // horizontal derecha
  { dr: 1,  dc: 0,  nombre: '↓'  }, // vertical abajo
  { dr: 1,  dc: 1,  nombre: '↘'  }, // diagonal abajo-derecha
]

const DIRS_REVERSIBLES = [
  { dr: 0,  dc: -1, nombre: '←'  }, // horizontal izquierda
  { dr: -1, dc: 0,  nombre: '↑'  }, // vertical arriba
  { dr: -1, dc: -1, nombre: '↖'  }, // diagonal arriba-izquierda
  { dr: 1,  dc: -1, nombre: '↙'  }, // diagonal abajo-izquierda
  { dr: -1, dc: 1,  nombre: '↗'  }, // diagonal arriba-derecha
]

function canPlace(grid, word, row, col, dr, dc, size) {
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i
    const c = col + dc * i
    if (r < 0 || r >= size || c < 0 || c >= size) return false
    if (grid[r][c] !== null && grid[r][c] !== word[i]) return false
  }
  return true
}

function placeWord(grid, word, row, col, dr, dc) {
  const celdas = []
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i
    const c = col + dc * i
    grid[r][c] = word[i]
    celdas.push({ r, c })
  }
  return celdas
}

/**
 * Genera una sopa de letras.
 * @param {string[]} palabras - palabras a colocar (ya normalizadas a mayúsculas)
 * @param {number} size - tamaño de la grilla (size x size)
 * @param {boolean} permitirReversas - si true, también se usan direcciones inversas
 * @returns {{ grid: string[][], placements: Array, unplaced: string[] }}
 */
export function generarSopaLetras(palabras, size, permitirReversas) {
  // Normalizar y ordenar de más larga a más corta para mejorar el placement
  const words = [...palabras]
    .map(p => p.toUpperCase().replace(/\s/g, ''))
    .filter(p => p.length > 0)
  words.sort((a, b) => b.length - a.length)

  const dirs = permitirReversas
    ? [...DIRS_NORMAL, ...DIRS_REVERSIBLES]
    : DIRS_NORMAL

  // Inicializar grilla vacía
  const grid = Array.from({ length: size }, () => Array(size).fill(null))

  const placements = [] // { word, row, col, dr, dc, celdas }
  const unplaced = []

  const MAX_INTENTOS = 200

  for (const word of words) {
    let colocada = false

    for (let intento = 0; intento < MAX_INTENTOS && !colocada; intento++) {
      const { dr, dc } = dirs[Math.floor(Math.random() * dirs.length)]
      const row = Math.floor(Math.random() * size)
      const col = Math.floor(Math.random() * size)

      if (canPlace(grid, word, row, col, dr, dc, size)) {
        const celdas = placeWord(grid, word, row, col, dr, dc)
        placements.push({ word, row, col, dr, dc, celdas })
        colocada = true
      }
    }

    if (!colocada) unplaced.push(word)
  }

  // Rellenar celdas vacías con letras aleatorias
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === null) grid[r][c] = letraAleatoria()
    }
  }

  return { grid, placements, unplaced }
}
