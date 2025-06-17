import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Toaster } from '@/components/ui/sonner.jsx'
import CotizacionForm from './components/CotizacionForm.jsx'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img 
                src="/placacentro-logo.png" 
                alt="Placacentro" 
                className="h-10 w-auto"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
              <h1 className="text-xl font-bold text-gray-900">Placacentro</h1>
            </div>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => window.open('https://wa.me/1234567890', '_blank')}
            >
              WhatsApp
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Cotizaciones</h2>
          <p className="text-gray-600">Solicita tu cotización de planchas de madera</p>
        </div>

        <CotizacionForm />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Placacentro. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  )
}

export default App

