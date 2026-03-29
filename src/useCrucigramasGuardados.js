/**
 * Hook para guardar/cargar/eliminar crucigramas en localStorage
 */
import { useState, useEffect } from 'react'

const STORAGE_KEY = 'crucigramas_guardados'

export function useCrucigramasGuardados() {
  const [guardados, setGuardados] = useState([])

  // Cargar al iniciar
  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (data) setGuardados(JSON.parse(data))
    } catch {
      setGuardados([])
    }
  }, [])

  const guardar = ({ nombre, palabras, crucigrama, descripciones }) => {
    const ahora = new Date()
    const fecha = ahora.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const hora = ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

    const nuevo = {
      id: Date.now(),
      nombre: nombre || `Crucigrama ${fecha}`,
      fecha: `${fecha} ${hora}`,
      palabras,
      crucigrama,
      descripciones,
    }

    const nuevos = [nuevo, ...guardados]
    setGuardados(nuevos)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos))
    return nuevo.id
  }

  const actualizar = (id, { nombre, palabras, crucigrama, descripciones }) => {
    const ahora = new Date()
    const fecha = ahora.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const hora = ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

    const nuevos = guardados.map(g =>
      g.id === id
        ? { ...g, nombre, palabras, crucigrama, descripciones, fecha: `${fecha} ${hora}` }
        : g
    )
    setGuardados(nuevos)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos))
  }

  const eliminar = (id) => {
    const nuevos = guardados.filter(g => g.id !== id)
    setGuardados(nuevos)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos))
  }

  return { guardados, guardar, actualizar, eliminar }
}
