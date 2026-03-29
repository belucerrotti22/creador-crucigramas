/**
 * Motor de generación de crucigramas
 */

const GRID_SIZE = 50

function emptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null))
}

/** Devuelve true si la palabra colocada `pw` pasa por la celda (r, c) */
function isWordAtCell(pw, r, c) {
  if (pw.horizontal) {
    return pw.row === r && c >= pw.col && c < pw.col + pw.word.length
  } else {
    return pw.col === c && r >= pw.row && r < pw.row + pw.word.length
  }
}

/**
 * Verifica si una palabra puede colocarse en (row, col) con la dirección dada.
 */
function canPlace(grid, word, row, col, horizontal, placedWords) {
  const len = word.length

  if (row < 0 || col < 0) return false
  if (horizontal && col + len > GRID_SIZE) return false
  if (!horizontal && row + len > GRID_SIZE) return false

  // No debe haber letra justo antes ni después (en su propia dirección)
  if (horizontal) {
    if (col > 0 && grid[row][col - 1] !== null) return false
    if (col + len < GRID_SIZE && grid[row][col + len] !== null) return false
  } else {
    if (row > 0 && grid[row - 1][col] !== null) return false
    if (row + len < GRID_SIZE && grid[row + len][col] !== null) return false
  }

  let intersections = 0

  for (let i = 0; i < len; i++) {
    const r = horizontal ? row : row + i
    const c = horizontal ? col + i : col
    const cell = grid[r][c]

    if (cell !== null) {
      // La letra debe coincidir
      if (cell.letter !== word[i]) return false

      // La celda existente debe pertenecer a una palabra en dirección opuesta
      const crossWords = placedWords.filter(pw => pw.horizontal !== horizontal && isWordAtCell(pw, r, c))
      if (crossWords.length === 0) return false

      intersections++
    } else {
      // Celda vacía: no debe tener letras adyacentes perpendiculares
      if (horizontal) {
        if (r > 0 && grid[r - 1][c] !== null) return false
        if (r < GRID_SIZE - 1 && grid[r + 1][c] !== null) return false
      } else {
        if (c > 0 && grid[r][c - 1] !== null) return false
        if (c < GRID_SIZE - 1 && grid[r][c + 1] !== null) return false
      }
    }
  }

  return intersections >= 1
}

function placeWord(grid, word, row, col, horizontal, wordIndex) {
  const newGrid = grid.map(r => r.map(c => (c ? { ...c, wordIndices: [...c.wordIndices] } : null)))
  for (let i = 0; i < word.length; i++) {
    const r = horizontal ? row : row + i
    const c = horizontal ? col + i : col
    if (newGrid[r][c] === null) {
      newGrid[r][c] = { letter: word[i], wordIndices: [wordIndex] }
    } else {
      newGrid[r][c].wordIndices.push(wordIndex)
    }
  }
  return newGrid
}

function findPlacements(grid, word, wordIndex, placedWords) {
  const placements = []
  const seen = new Set()

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = grid[r][c]
      if (cell === null) continue

      for (let wi = 0; wi < word.length; wi++) {
        if (cell.letter !== word[wi]) continue

        const candidates = [
          { row: r,      col: c - wi, horizontal: true  },
          { row: r - wi, col: c,      horizontal: false },
        ]

        for (const { row, col, horizontal } of candidates) {
          const key = `${row},${col},${horizontal}`
          if (seen.has(key)) continue
          seen.add(key)

          if (canPlace(grid, word, row, col, horizontal, placedWords)) {
            let score = 0
            for (let k = 0; k < word.length; k++) {
              const tr = horizontal ? row : row + k
              const tc = horizontal ? col + k : col
              if (grid[tr][tc] !== null) score++
            }
            placements.push({ row, col, horizontal, score })
          }
        }
      }
    }
  }

  return placements.sort((a, b) => b.score - a.score)
}

function trimGrid(grid, placed) {
  let minR = GRID_SIZE, maxR = 0, minC = GRID_SIZE, maxC = 0
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] !== null) {
        minR = Math.min(minR, r)
        maxR = Math.max(maxR, r)
        minC = Math.min(minC, c)
        maxC = Math.max(maxC, c)
      }
    }
  }
  const trimmed = []
  for (let r = minR; r <= maxR; r++) {
    trimmed.push(grid[r].slice(minC, maxC + 1))
  }
  const adjusted = placed.map(p => ({
    ...p,
    row: p.row - minR,
    col: p.col - minC,
  }))
  return { grid: trimmed, placements: adjusted }
}

/**
 * Intenta colocar todas las palabras dadas (con índices originales) sobre `grid`.
 * Hace múltiples pasadas para aprovechar palabras recién colocadas.
 * Devuelve { grid, placed, unplaced }.
 */
function buildLayout(words) {
  // words = [{ word, originalIndex }], primer elemento ya fijo como horizontal al centro
  let grid = emptyGrid()
  const placed = []

  // Primera palabra horizontal centrada
  const first = words[0]
  const startRow = Math.floor(GRID_SIZE / 2)
  const startCol = Math.floor((GRID_SIZE - first.word.length) / 2)
  grid = placeWord(grid, first.word, startRow, startCol, true, first.originalIndex)
  placed.push({ word: first.word, row: startRow, col: startCol, horizontal: true, originalIndex: first.originalIndex })

  let remaining = words.slice(1)

  // Hasta 8 pasadas para aprovechar intersecciones de palabras recién colocadas
  for (let pass = 0; pass < 8 && remaining.length > 0; pass++) {
    const stillRemaining = []
    for (const { word, originalIndex } of remaining) {
      const placements = findPlacements(grid, word, originalIndex, placed)
      if (placements.length === 0) {
        stillRemaining.push({ word, originalIndex })
        continue
      }
      const best = placements[0]
      grid = placeWord(grid, word, best.row, best.col, best.horizontal, originalIndex)
      placed.push({ word, row: best.row, col: best.col, horizontal: best.horizontal, originalIndex })
    }
    if (stillRemaining.length === remaining.length) break
    remaining = stillRemaining
  }

  return { grid, placed, unplaced: remaining.map(w => w.word) }
}

export function generarCrucigrama(palabras) {
  const words = palabras.map(p => p.toUpperCase())

  // Generar múltiples permutaciones del orden de palabras y quedarse con el mejor resultado
  // (el que logra colocar más palabras)
  const indexed = words.map((word, originalIndex) => ({ word, originalIndex }))

  // Estrategias de ordenamiento a probar
  const strategies = [
    // 1. Mayor a menor longitud
    [...indexed].sort((a, b) => b.word.length - a.word.length),
    // 2. Menor a mayor longitud
    [...indexed].sort((a, b) => a.word.length - b.word.length),
    // 3. Por cantidad de letras únicas (más diversas primero)
    [...indexed].sort((a, b) => new Set(b.word).size - new Set(a.word).size),
    // 4. Orden original
    [...indexed],
    // 5. Orden inverso
    [...indexed].reverse(),
  ]

  let bestResult = null

  for (const strategy of strategies) {
    const result = buildLayout(strategy)
    if (!bestResult || result.placed.length > bestResult.placed.length) {
      bestResult = result
    }
    if (bestResult.unplaced.length === 0) break // perfecto, no hace falta seguir
  }

  const { grid, placed, unplaced } = bestResult

  if (placed.length === 0) {
    return { success: false, unplaced: words, grid: [], placements: [], wordNumbers: {}, numberedCells: {} }
  }

  const { grid: trimmedGrid, placements: trimmedPlacements } = trimGrid(grid, placed)

  // Numerar celdas de inicio (orden: arriba→abajo, izq→der)
  const numberedCells = {}
  let numCounter = 1

  const sortedByPos = [...trimmedPlacements].sort((a, b) =>
    a.row !== b.row ? a.row - b.row : a.col - b.col
  )

  const wordNumbers = {}
  for (const p of sortedByPos) {
    const key = `${p.row},${p.col}`
    if (!numberedCells[key]) {
      numberedCells[key] = numCounter++
    }
    wordNumbers[p.originalIndex] = numberedCells[key]
  }

  return {
    success: true,
    unplaced,
    grid: trimmedGrid,
    placements: trimmedPlacements,
    wordNumbers,
    numberedCells,
  }
}
