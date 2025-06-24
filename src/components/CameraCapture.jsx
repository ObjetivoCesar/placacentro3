import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Camera, Loader2, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const CameraCapture = ({ onImageAnalysis, isDisabled = false }) => {
  const [isCapturing, setIsCapturing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [error, setError] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const startCamera = async () => {
    try {
      setError(null)
      console.log('🎥 Iniciando acceso a la cámara...')
      
      // Verificar si getUserMedia está disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso a la cámara. Intenta con un navegador más reciente.')
      }

      // Verificar si estamos en un contexto seguro (HTTPS)
      console.log('🔒 Protocolo:', location.protocol, 'Host:', location.hostname)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        throw new Error('El acceso a la cámara requiere una conexión segura (HTTPS). Asegúrate de que tu sitio esté servido a través de HTTPS.')
      }

      // Verificar permisos antes de solicitar acceso
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' })
        console.log('📋 Estado de permisos de cámara:', permissionStatus.state)
        
        if (permissionStatus.state === 'denied') {
          throw new Error('Permisos de cámara denegados. Ve a la configuración de tu navegador y permite el acceso a la cámara para este sitio.')
        }
      } catch (permError) {
        console.warn('⚠️ No se pudo verificar permisos:', permError)
        // Continuar de todos modos, algunos navegadores no soportan permissions API
      }

      // Configuraciones de cámara con fallbacks para mejor compatibilidad
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Preferir cámara trasera
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      }

      console.log('📱 Solicitando acceso con configuración completa...')
      let stream
      try {
        // Intentar con configuración completa
        stream = await navigator.mediaDevices.getUserMedia(constraints)
        console.log('✅ Acceso a cámara exitoso con configuración completa')
      } catch (err) {
        console.warn('⚠️ Fallback: usando configuración básica de cámara', err)
        // Fallback a configuración más básica
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          })
          console.log('✅ Acceso a cámara exitoso con configuración básica')
        } catch (err2) {
          console.warn('⚠️ Segundo fallback: usando configuración mínima', err2)
          // Último fallback - solo video sin restricciones
          stream = await navigator.mediaDevices.getUserMedia({ video: true })
          console.log('✅ Acceso a cámara exitoso con configuración mínima')
        }
      }

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Manejar eventos del video
        videoRef.current.onloadedmetadata = () => {
          console.log('📹 Metadatos del video cargados')
          videoRef.current.play().then(() => {
            console.log('▶️ Video iniciado correctamente')
          }).catch(err => {
            console.error('❌ Error al reproducir video:', err)
            setError('Error al inicializar la vista previa de la cámara')
          })
        }

        videoRef.current.onerror = (err) => {
          console.error('❌ Error en el elemento video:', err)
          setError('Error en la reproducción del video')
        }
      }
      
      setShowCamera(true)
      setIsCapturing(true)
      toast.success("Cámara activada. Posiciona la imagen con las medidas.")
      
    } catch (error) {
      console.error('❌ Error al acceder a la cámara:', error)
      let errorMessage = 'No se pudo acceder a la cámara.'
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Acceso a la cámara denegado. Por favor, permite el acceso a la cámara en tu navegador y recarga la página.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No se encontró ninguna cámara en tu dispositivo.'
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Tu navegador no soporta acceso a la cámara.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'La cámara está siendo usada por otra aplicación. Cierra otras apps que puedan estar usando la cámara.'
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Las configuraciones de cámara solicitadas no son compatibles con tu dispositivo.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
      
      // Log adicional para debugging
      console.log('🔍 Información de debugging:')
      console.log('- User Agent:', navigator.userAgent)
      console.log('- Protocolo:', location.protocol)
      console.log('- Host:', location.hostname)
      console.log('- MediaDevices disponible:', !!navigator.mediaDevices)
      console.log('- getUserMedia disponible:', !!navigator.mediaDevices?.getUserMedia)
    }
  }

  const stopCamera = () => {
    console.log('🛑 Deteniendo cámara...')
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('🔇 Track detenido:', track.kind)
      })
      streamRef.current = null
    }
    setShowCamera(false)
    setIsCapturing(false)
    setCapturedImage(null)
    setError(null)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('❌ Referencias de video o canvas no disponibles')
      return
    }

    console.log('📸 Capturando foto...')
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    // Configurar el canvas con las dimensiones del video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    console.log('📐 Dimensiones de captura:', canvas.width, 'x', canvas.height)

    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convertir a blob
    canvas.toBlob(async (blob) => {
      if (blob) {
        console.log('💾 Imagen capturada, tamaño:', blob.size, 'bytes')
        const imageFile = new File([blob], 'captured_image.jpg', { type: 'image/jpeg' })
        const imageUrl = URL.createObjectURL(blob)
        
        setCapturedImage(imageUrl)
        stopCamera()
        setIsProcessing(true)
        
        try {
          await processImage(imageFile)
        } catch (error) {
          console.error('❌ Error procesando imagen:', error)
          toast.error("Error al procesar la imagen")
        } finally {
          setIsProcessing(false)
        }
      } else {
        console.error('❌ No se pudo generar blob de la imagen')
        toast.error("Error al capturar la imagen")
      }
    }, 'image/jpeg', 0.8)
  }

  const processImage = async (imageFile) => {
    try {
      console.log('🔍 Procesando imagen...')
      // Verificar si tenemos la API key de OpenAI
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      if (!apiKey) {
        console.warn('⚠️ API key de OpenAI no configurada')
        toast.warning("Análisis de imagen no disponible. Configura VITE_OPENAI_API_KEY.")
        onImageAnalysis([], "Análisis de imagen no disponible - falta configuración de API")
        return
      }

      // Analizar imagen con OpenAI Vision
      const analysis = await analyzeImageWithVision(imageFile)
      
      if (analysis) {
        console.log('📝 Análisis recibido:', analysis)
        // Parsear el análisis para extraer medidas
        const parsedMeasures = parseMeasuresFromText(analysis)
        
        if (parsedMeasures.length > 0) {
          console.log('📏 Medidas detectadas:', parsedMeasures)
          onImageAnalysis(parsedMeasures, analysis)
          toast.success(`Se detectaron ${parsedMeasures.length} medida(s) en la imagen`)
        } else {
          console.log('⚠️ No se detectaron medidas válidas')
          toast.warning("No se detectaron medidas válidas en la imagen")
          onImageAnalysis([], analysis)
        }
      }
      
    } catch (error) {
      console.error('❌ Error procesando imagen:', error)
      toast.error("Error al procesar la imagen: " + error.message)
    }
  }

  const analyzeImageWithVision = async (imageFile) => {
    // Convertir imagen a base64
    const base64Image = await fileToBase64(imageFile)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analiza esta imagen y extrae todas las medidas de muebles o materiales que puedas encontrar. 
                
                Busca específicamente:
                - Dimensiones (largo x ancho, o largo por ancho)
                - Cantidades o números de piezas
                - Especificaciones de bordes o cantos
                - Cualquier medida en centímetros, metros, o pulgadas
                
                Formato esperado: "X unidades de Y por Z" o "largo Y ancho Z cantidad X"
                
                Si encuentras medidas, devuélvelas en formato claro y estructurado. Si no encuentras medidas específicas, describe lo que ves en la imagen.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Error en el análisis de imagen: ${response.status} ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = error => reject(error)
    })
  }

  const parseMeasuresFromText = (text) => {
    const measures = []
    
    // Patrones para detectar medidas en texto OCR
    const patterns = [
      // "120 x 60" o "120 por 60"
      /(\d+(?:\.\d+)?)\s*(?:x|×|por)\s*(\d+(?:\.\d+)?)/gi,
      // "largo 120 ancho 60"
      /(?:largo|l)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:ancho|a)\s*:?\s*(\d+(?:\.\d+)?)/gi,
      // "120cm x 60cm"
      /(\d+(?:\.\d+)?)\s*cm\s*(?:x|×|por)\s*(\d+(?:\.\d+)?)\s*cm/gi,
      // Números seguidos de unidades
      /(\d+(?:\.\d+)?)\s*(?:cm|centímetros?)\s*(?:x|×|por)\s*(\d+(?:\.\d+)?)\s*(?:cm|centímetros?)/gi
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const largo = parseFloat(match[1])
        const ancho = parseFloat(match[2])
        
        // Validar que las medidas sean razonables (entre 10 y 500 cm)
        if (largo >= 10 && largo <= 500 && ancho >= 10 && ancho <= 500) {
          measures.push({
            cantidad: 1, // Por defecto 1 unidad
            largo: largo,
            ancho: ancho,
            tipoBordo: '1-largo', // Por defecto
            perforacion: 'ninguna',
            cantoBordo: 'canto-suave'
          })
        }
      }
    }

    // Eliminar duplicados
    const uniqueMeasures = measures.filter((measure, index, self) => 
      index === self.findIndex(m => m.largo === measure.largo && m.ancho === measure.ancho)
    )

    return uniqueMeasures
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    startCamera()
  }

  const discardPhoto = () => {
    setCapturedImage(null)
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm max-w-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs">{error}</span>
        </div>
      )}

      {!showCamera && !capturedImage && (
        <div className="flex flex-col items-center space-y-2">
          <Button
            onClick={startCamera}
            disabled={isDisabled || isProcessing}
            className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Camera className="w-6 h-6" />
            )}
          </Button>
          <p className="text-sm text-gray-600 text-center">
            Tomar foto de medidas
          </p>
          <p className="text-xs text-gray-500 text-center max-w-xs">
            Requiere HTTPS y permisos
          </p>
        </div>
      )}

      {showCamera && (
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full max-w-md rounded-lg border-2 border-gray-300"
            autoPlay
            playsInline
            muted
          />
          <div className="absolute inset-0 border-2 border-dashed border-white opacity-50 rounded-lg pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
              Centra las medidas aquí
            </div>
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            <Button onClick={capturePhoto} className="bg-blue-600 hover:bg-blue-700">
              Capturar
            </Button>
            <Button onClick={stopCamera} variant="outline">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {capturedImage && (
        <div className="relative">
          <img
            src={capturedImage}
            alt="Imagen capturada"
            className="w-full max-w-md rounded-lg border-2 border-gray-300"
          />
          {!isProcessing && (
            <div className="flex justify-center space-x-4 mt-4">
              <Button onClick={retakePhoto} className="bg-blue-600 hover:bg-blue-700">
                Tomar otra
              </Button>
              <Button onClick={discardPhoto} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Descartar
              </Button>
            </div>
          )}
          {isProcessing && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-white text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>Analizando imagen...</p>
              </div>
            </div>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default CameraCapture

