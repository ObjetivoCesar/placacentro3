import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'

const BordoSelector = ({ value, onChange }) => {
  const opciones = [
    {
      id: '1-largo',
      nombre: '1 Largo',
      descripcion: 'Un lado largo con bordo'
    },
    {
      id: '1-largo-1-corto',
      nombre: '1 Largo y 1 Corto',
      descripcion: 'Un lado largo y un lado corto con bordo'
    },
    {
      id: '1-largo-2-cortos',
      nombre: '1 Largo y 2 Cortos',
      descripcion: 'Un lado largo y dos lados cortos con bordo'
    },
    {
      id: '4-lados',
      nombre: '4 Lados',
      descripcion: 'Todos los lados con bordo'
    }
  ]

  const renderVisualizacion = (opcionId) => {
    const baseStyle = "w-16 h-12 border-2 border-gray-300 relative bg-white"
    
    switch (opcionId) {
      case '1-largo':
        return (
          <div className={baseStyle}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
          </div>
        )
      case '1-largo-1-corto':
        return (
          <div className={baseStyle}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
            <div className="absolute top-0 right-0 bottom-0 w-1 bg-green-500"></div>
          </div>
        )
      case '1-largo-2-cortos':
        return (
          <div className={baseStyle}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
            <div className="absolute top-0 right-0 bottom-0 w-1 bg-green-500"></div>
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-green-500"></div>
          </div>
        )
      case '4-lados':
        return (
          <div className={baseStyle}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500"></div>
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-green-500"></div>
            <div className="absolute top-0 right-0 bottom-0 w-1 bg-green-500"></div>
          </div>
        )
      default:
        return <div className={baseStyle}></div>
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 mt-2">
      {opciones.map((opcion) => (
        <button
          key={opcion.id}
          type="button"
          onClick={() => onChange(opcion.id)}
          className={`p-3 border-2 rounded-lg transition-all hover:border-green-300 ${
            value === opcion.id 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            {renderVisualizacion(opcion.id)}
            <span className="text-xs font-medium text-center">{opcion.nombre}</span>
          </div>
        </button>
      ))}
    </div>
  )
}

export default BordoSelector

