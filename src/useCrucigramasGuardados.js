/**
 * Hook genérico para guardar/cargar/eliminar items en localStorage.
 * Usado tanto para crucigramas como para sopas de letras.
 */
import { useState, useEffect } from 'react'

function ahora() {
  const d = new Date()
  const fecha = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  return { fecha, hora, fechaHora: `${fecha} ${hora}` }
}

export function useItemsGuardados(storageKey, defaultNombre = 'Item') {
  const [guardados, setGuardados] = useState([])

  useEffect(() => {
    try {
      const data = localStorage.getItem(storageKey)
      if (data) setGuardados(JSON.parse(data))
    } catch {
      setGuardados([])
    }
  }, [storageKey])

  const persist = (nuevos) => {
    setGuardados(nuevos)
    localStorage.setItem(storageKey, JSON.stringify(nuevos))
  }

  const guardar = (datos) => {
    const { fecha, fechaHora } = ahora()
    const nuevo = {
      id: Date.now(),
      nombre: datos.nombre || `${defaultNombre} ${fecha}`,
      fecha: fechaHora,
      palabras: datos.palabras,
      ...datos,
    }
    persist([nuevo, ...guardados])
    return nuevo.id
  }

  const actualizar = (id, datos) => {
    const { fechaHora } = ahora()
    persist(guardados.map(g =>
      g.id === id ? { ...g, ...datos, fecha: fechaHora } : g
    ))
  }

  const eliminar = (id) => persist(guardados.filter(g => g.id !== id))

  const duplicar = (id) => {
    const original = guardados.find(g => g.id === id)
    if (!original) return
    const { fechaHora } = ahora()
    persist([
      { ...original, id: Date.now(), nombre: `${original.nombre} (copia)`, fecha: fechaHora },
      ...guardados,
    ])
  }

  return { guardados, guardar, actualizar, eliminar, duplicar }
}

// ── Wrappers específicos ─────────────────────────────────────────
export function useCrucigramasGuardados() {
  return useItemsGuardados('crucigramas_guardados', 'Crucigrama')
}

export function useSopasGuardadas() {
  return useItemsGuardados('sopas_guardadas', 'Sopa de letras')
}

export function useCuestionariosGuardados() {
  return useItemsGuardados('cuestionarios_guardados', 'Cuestionario')
}
