import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import BordoSelector from './BordoSelector.jsx'
import VoiceRecorder from './VoiceRecorder.jsx'
import CameraCapture from './CameraCapture.jsx'
import FileUpload from './FileUpload.jsx'
import { processImageWithOpenAI, sendToWhatsApp } from '../lib/imageUtils.js'

const CotizacionForm = () => {
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    tipoPlancha: '',
    color: '',
    vendedora: '',
    comentarios: '',
    nombreCliente: '',
    telefono: '',
    direccionTaller: '',
    entrega: 'domicilio',
    fecha: new Date().toISOString().slice(0, 10)
  })

  // Estados para medidas
  const [medidaActual, setMedidaActual] = useState({
    largo: '',
    ancho: '',
    cantidad: 1,
    perforacion: 'ninguna',
    tipoBordo: '1-largo',
    cantoBordo: 'canto-suave'
  })
  const [medidas, setMedidas] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState(null)
  // Estado para guardar la transcripción de voz
  const [transcripcionVoz, setTranscripcionVoz] = useState('')
  const [webhookResponse, setWebhookResponse] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    let storedUserId = localStorage.getItem("placacentro_user_id")
    if (!storedUserId) {
      storedUserId = uuidv4()
      localStorage.setItem("placacentro_user_id", storedUserId)
    }
    setUserId(storedUserId)
  }, [])

  // Opciones para los selectores
  const tiposPlanchas = ['MDF', 'Melamina', 'Terciado', 'Aglomerado']
  const colores = ['Blanco', 'Negro', 'Madera Natural', 'Cerezo', 'Nogal', 'Haya']
  const vendedoras = ['Ana Martínez', 'María López', 'Carolina Rodríguez', 'Valentina Pérez']
  const perforaciones = ['ninguna', 'largo', 'ancho']
  const cantos = ['canto-suave', 'canto-duro']

  // Mapeo de tipos de bordo para mostrar texto legible
  const bordoTexto = {
    '1-largo': '1 Largo',
    '1-largo-1-corto': '1 Largo y 1 Corto',
    '1-largo-2-cortos': '1 Largo y 2 Cortos',
    '4-lados': '4 Lados'
  }

  // Función para agregar medida
  const agregarMedida = () => {
    if (!medidaActual.largo || !medidaActual.ancho) {
      toast.error("Largo y ancho son obligatorios")
      return
    }

    const nuevaMedida = {
      linea: medidas.length + 1,
      cantidad: parseInt(medidaActual.cantidad),
      largo: medidaActual.largo,
      ancho: medidaActual.ancho,
      perforacion: medidaActual.perforacion,
      tipoBordo: medidaActual.tipoBordo,
      cantoBordo: medidaActual.cantoBordo,
      descripcion: `Cant: ${medidaActual.cantidad}, L${medidaActual.largo}, A${medidaActual.ancho}, P-${medidaActual.perforacion}, Bordo-${bordoTexto[medidaActual.tipoBordo]}, B-${medidaActual.cantoBordo === 'canto-suave' ? 'Suave' : 'Duro'}`
    }

    setMedidas([...medidas, nuevaMedida])
    
    // Limpiar formulario de medida
    setMedidaActual({
      largo: '',
      ancho: '',
      cantidad: 1,
      perforacion: 'ninguna',
      tipoBordo: '1-largo',
      cantoBordo: 'canto-suave'
    })

    toast.success("La medida se ha agregado correctamente")
  }

  // Función para eliminar medida
  const eliminarMedida = (index) => {
    const nuevasMedidas = medidas.filter((_, i) => i !== index)
    // Reindexar las líneas
    const medidasReindexadas = nuevasMedidas.map((medida, i) => ({
      ...medida,
      linea: i + 1
    }))
    setMedidas(medidasReindexadas)
    
    toast.success("La medida se ha eliminado correctamente")
  }

  // Función para manejar transcripción de voz
  const manejarTranscripcionVoz = (transcribedMeasures, transcriptionText) => {
    setMedidas(prevMedidas => {
      const newMedidas = transcribedMeasures.map(medida => ({
        linea: prevMedidas.length + 1, // Esto se reindexará al final
        cantidad: medida.cantidad,
        largo: medida.largo.toString(),
        ancho: medida.ancho.toString(),
        perforacion: medida.perforacion,
        tipoBordo: medida.tipoBordo,
        cantoBordo: medida.cantoBordo,
        descripcion: `Cant: ${medida.cantidad}, L${medida.largo}, A${medida.ancho}, P-${medida.perforacion}, Bordo-${bordoTexto[medida.tipoBordo]}, B-${medida.cantoBordo === 'canto-suave' ? 'Suave' : 'Duro'}`
      }))
      const combinedMedidas = [...prevMedidas, ...newMedidas]
      // Reindexar todas las medidas
      return combinedMedidas.map((medida, index) => ({ ...medida, linea: index + 1 }))
    })
    setTranscripcionVoz(transcriptionText || '')
    toast.success(`Se agregaron ${transcribedMeasures.length} medidas desde el audio.`)
  }

  // Función para manejar análisis de imagen capturada
  const manejarAnalisisImagen = (analyzedMeasures, analysisText) => {
    setMedidas(prevMedidas => {
      const newMedidas = analyzedMeasures.map(medida => ({
        linea: prevMedidas.length + 1, // Esto se reindexará al final
        cantidad: medida.cantidad,
        largo: medida.largo.toString(),
        ancho: medida.ancho.toString(),
        perforacion: medida.perforacion,
        tipoBordo: medida.tipoBordo,
        cantoBordo: medida.cantoBordo,
        descripcion: `Cant: ${medida.cantidad}, L${medida.largo}, A${medida.ancho}, P-${medida.perforacion}, Bordo-${bordoTexto[medida.tipoBordo]}, B-${medida.cantoBordo === 'canto-suave' ? 'Suave' : 'Duro'}`
      }))
      const combinedMedidas = [...prevMedidas, ...newMedidas]
      // Reindexar todas las medidas
      return combinedMedidas.map((medida, index) => ({ ...medida, linea: index + 1 }))
    })
    toast.success(`Se agregaron ${analyzedMeasures.length} medidas desde la imagen.`)
  }

  // Función para enviar cotización
  const enviarCotizacion = async () => {
    // Validaciones
    if (!formData.tipoPlancha || !formData.color || !formData.vendedora || !formData.nombreCliente || !formData.telefono || !formData.direccionTaller) {
      toast.error("Todos los campos de información básica son obligatorios")
      return
    }

    if (medidas.length === 0) {
      toast.error("Debe agregar al menos una medida o una imagen")
      return
    }

    setIsLoading(true)

    try {
      const payload = {
        tipoPlancha: formData.tipoPlancha,
        color: formData.color,
        vendedora: formData.vendedora,
        nombreCliente: formData.nombreCliente,
        telefono: formData.telefono,
        direccionTaller: formData.direccionTaller,
        entrega: formData.entrega,
        fecha: formData.fecha,
        medidasTexto: medidas.map(m => m.descripcion).join('\n'),
        medidasArray: medidas.map(m => m.descripcion),
        medidasEstructuradas: medidas,
        totalMedidas: medidas.length,
        totalPiezas: medidas.reduce((total, medida) => total + medida.cantidad, 0),
        comentarios: formData.comentarios,
        userId: userId
      }

      const response = await fetch('https://hook.us2.make.com/ql05r0bkj8p9f5ddtyv0m3sq8muz487p', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      const text = await response.text()
      setWebhookResponse(text)
      if (response.ok) {
        toast.success("Su cotización se ha enviado correctamente")
        
        // Reset del formulario
        setFormData({
          tipoPlancha: '',
          color: '',
          vendedora: '',
          comentarios: '',
          nombreCliente: '',
          telefono: '',
          direccionTaller: '',
          entrega: 'domicilio',
          fecha: new Date().toISOString().slice(0, 10)
        })
        setMedidas([])
      } else {
        throw new Error('Error en el envío')
      }
    } catch (error) {
      toast.error("Error al enviar la cotización. Intente nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para enviar confirmación
  const enviarConfirmacion = async () => {
    setIsConfirming(true)
    try {
      const response = await fetch('https://hook.us2.make.com/ql05r0bkj8p9f5ddtyv0m3sq8muz487p', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirmacion: 'confirmado', userId })
      })
      if (response.ok) {
        toast.success('Confirmación enviada')
        setWebhookResponse('')
      } else {
        toast.error('Error al enviar confirmación')
      }
    } catch (e) {
      toast.error('Error al enviar confirmación')
    } finally {
      setIsConfirming(false)
    }
  }

   return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Formulario Principal (2/3) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Sección 1: Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tipoPlancha">Tipo de Plancha *</Label>
              <Select value={formData.tipoPlancha} onValueChange={(value) => setFormData({...formData, tipoPlancha: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo de plancha" />
                </SelectTrigger>
                <SelectContent>
                  {tiposPlanchas.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="color">Color *</Label>
              <Select value={formData.color} onValueChange={(value) => setFormData({...formData, color: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione color" />
                </SelectTrigger>
                <SelectContent>
                  {colores.map(color => (
                    <SelectItem key={color} value={color}>{color}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="vendedora">Vendedora *</Label>
              <Select value={formData.vendedora} onValueChange={(value) => setFormData({...formData, vendedora: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione vendedora" />
                </SelectTrigger>
                <SelectContent>
                  {vendedoras.map(vendedora => (
                    <SelectItem key={vendedora} value={vendedora}>{vendedora}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nuevos campos para información del cliente */}
            <div>
              <Label htmlFor="nombreCliente">Nombre del Cliente *</Label>
              <Input
                value={formData.nombreCliente}
                onChange={(e) => setFormData({...formData, nombreCliente: e.target.value})}
                placeholder="Ingrese el nombre del cliente"
              />
            </div>

            <div>
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                placeholder="Ingrese el teléfono de contacto"
              />
            </div>

            <div>
              <Label htmlFor="direccionTaller">Dirección del Taller *</Label>
              <Textarea
                value={formData.direccionTaller}
                onChange={(e) => setFormData({...formData, direccionTaller: e.target.value})}
                placeholder="Ingrese la dirección del taller"
              />
            </div>

            <div>
              <Label htmlFor="entrega">Tipo de Entrega</Label>
              <Select value={formData.entrega} onValueChange={(value) => setFormData({...formData, entrega: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domicilio">A Domicilio</SelectItem>
                  <SelectItem value="sucursal">En Sucursal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fecha">Fecha de Entrega</Label>
              <Input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({...formData, fecha: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sección 2: Ingreso de Medidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ingreso de Medidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nuevas opciones de entrada: Voz y Cámara */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <Label className="text-sm font-medium mb-2 block">Dictar Medidas</Label>
                <VoiceRecorder 
                  onTranscription={manejarTranscripcionVoz}
                  isDisabled={isLoading}
                />
              </div>
              <div className="text-center">
                <Label className="text-sm font-medium mb-2 block">Foto de Medidas</Label>
                <CameraCapture 
                  onImageAnalysis={manejarAnalisisImagen}
                  isDisabled={isLoading}
                />
              </div>
              <div className="text-center">
                <Label className="text-sm font-medium mb-2 block">Subir Foto</Label>
                <FileUpload 
                  onImageAnalysis={manejarAnalisisImagen}
                  isDisabled={isLoading}
                />
              </div>
            </div>

            {/* Separador */}
            <div className="flex items-center space-x-4">
              <hr className="flex-1" />
              <span className="text-sm text-gray-500">o ingresa manualmente</span>
              <hr className="flex-1" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="largo">Largo (cm)</Label>
                <Input
                  type="number"
                  value={medidaActual.largo}
                  onChange={(e) => setMedidaActual({...medidaActual, largo: e.target.value})}
                  placeholder="Ej: 120"
                />
              </div>
              <div>
                <Label htmlFor="ancho">Ancho (cm)</Label>
                <Input
                  type="number"
                  value={medidaActual.ancho}
                  onChange={(e) => setMedidaActual({...medidaActual, ancho: e.target.value})}
                  placeholder="Ej: 60"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input
                type="number"
                min="1"
                value={medidaActual.cantidad}
                onChange={(e) => setMedidaActual({...medidaActual, cantidad: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="perforacion">Perforación</Label>
              <Select value={medidaActual.perforacion} onValueChange={(value) => setMedidaActual({...medidaActual, perforacion: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {perforaciones.map(perf => (
                    <SelectItem key={perf} value={perf}>{perf === 'ninguna' ? 'Ninguna' : perf.charAt(0).toUpperCase() + perf.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Pegado de Bordo</Label>
              <BordoSelector 
                value={medidaActual.tipoBordo}
                onChange={(value) => setMedidaActual({...medidaActual, tipoBordo: value})}
              />
            </div>

            <div>
              <Label htmlFor="cantoBordo">Tipo de Canto</Label>
              <Select value={medidaActual.cantoBordo} onValueChange={(value) => setMedidaActual({...medidaActual, cantoBordo: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cantos.map(canto => (
                    <SelectItem key={canto} value={canto}>
                      {canto === 'canto-suave' ? 'Canto Suave' : 'Canto Duro'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={agregarMedida} className="w-full bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Medida
            </Button>
          </CardContent>
        </Card>

        {/* Sección de Resumen de Medidas */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Medidas ({medidas.length} líneas, {medidas.reduce((total, medida) => total + medida.cantidad, 0)} piezas)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {medidas.length === 0 ? (
              <p className="text-gray-500">No hay medidas agregadas aún.</p>
            ) : (
              medidas.map((medida, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                  <p className="text-sm font-medium">{medida.descripcion}</p>
                  <Button variant="ghost" size="icon" onClick={() => eliminarMedida(index)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Sección de Comentarios */}
        <Card>
          <CardHeader>
            <CardTitle>Comentarios Adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Cualquier comentario adicional sobre la cotización..."
              value={formData.comentarios}
              onChange={(e) => setFormData({...formData, comentarios: e.target.value})}
            />
          </CardContent>
        </Card>
      </div>
      {/* Resumen de Cotización (1/3) */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="sticky top-6 bg-[#23232a] text-white">
          <CardHeader>
            <CardTitle>Resumen de Cotización</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Información Básica */}
            <div>
              <h4 className="font-semibold mb-1">Información Básica</h4>
              <div className="text-sm" style={{color: 'white'}}>
                <div>Tipo: <span className="font-medium">{formData.tipoPlancha || <span className='text-gray-400'>-</span>}</span></div>
                <div>Color: <span className="font-medium">{formData.color || <span className='text-gray-400'>-</span>}</span></div>
                <div>Vendedora: <span className="font-medium">{formData.vendedora || <span className='text-gray-400'>-</span>}</span></div>
                <div>Cliente: <span className="font-medium">{formData.nombreCliente || <span className='text-gray-400'>-</span>}</span></div>
                <div>Teléfono: <span className="font-medium">{formData.telefono || <span className='text-gray-400'>-</span>}</span></div>
                <div>Dirección: <span className="font-medium">{formData.direccionTaller || <span className='text-gray-400'>-</span>}</span></div>
                <div>Entrega: <span className="font-medium">{formData.entrega === 'domicilio' ? 'A Domicilio' : 'En Sucursal'}</span></div>
                <div>Fecha: <span className="font-medium">{new Date(formData.fecha).toLocaleDateString('es-ES') || <span className='text-gray-400'>-</span>}</span></div>
              </div>
            </div>
            {/* Medidas */}
            <div>
              <h4 className="font-semibold mb-1">Medidas</h4>
              {medidas.length === 0 ? (
                <div className="text-gray-300 text-sm">No hay medidas agregadas.</div>
              ) : (
                <ul className="text-sm list-disc pl-5 space-y-1">
                  {medidas.map((medida, idx) => (
                    <li key={idx}>{medida.descripcion}</li>
                  ))}
                </ul>
              )}
            </div>
            {/* Transcripción de Voz */}
            {transcripcionVoz && (
              <div>
                <h4 className="font-semibold mb-1">Transcripción de Voz</h4>
                <div className="bg-gray-800 rounded p-2 text-xs text-white whitespace-pre-line">{transcripcionVoz}</div>
              </div>
            )}
            {/* Botón Enviar Cotización */}
            <Button onClick={enviarCotizacion} className="w-full py-3 text-lg bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar Cotización"}
            </Button>
          </CardContent>
        </Card>
        {/* Respuesta del webhook y botón de aprobación */}
        {webhookResponse && (
          <div className="mt-6 mb-4 max-h-96 overflow-y-auto bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="mb-2 text-sm text-blue-900 whitespace-pre-line break-words">{webhookResponse}</div>
            <Button onClick={enviarConfirmacion} disabled={isConfirming} className="bg-green-600 hover:bg-green-700 mt-2">
              {isConfirming ? 'Enviando...' : 'Aprobado'}
            </Button>
          </div>
        )}
      </div>
    </div>

  )
}

export default CotizacionForm