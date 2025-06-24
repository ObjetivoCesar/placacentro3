import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Upload, Loader2, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const FileUpload = ({ onImageAnalysis, isDisabled = false, onImageUploaded }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido (JPG, PNG, etc.)')
      toast.error('Tipo de archivo no válido')
      return
    }

    // Validar tamaño de archivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError('El archivo es demasiado grande. Máximo 10MB permitido.')
      toast.error('Archivo demasiado grande')
      return
    }

    setError(null)
    const imageUrl = URL.createObjectURL(file)
    setUploadedImage(imageUrl)
    if (onImageUploaded) {
      onImageUploaded(imageUrl)
    }
    setIsProcessing(true)

    try {
      await processImage(file)
      toast.success('Imagen procesada exitosamente')
    } catch (error) {
      console.error('Error procesando imagen:', error)
      toast.error("Error al procesar la imagen: " + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const processImage = async (imageFile) => {
    try {
      // Verificar si tenemos la API key de OpenAI
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      if (!apiKey) {
        toast.warning("Análisis de imagen no disponible. Configura VITE_OPENAI_API_KEY.")
        onImageAnalysis([], "Análisis de imagen no disponible - falta configuración de API")
        return
      }

      // Analizar imagen con OpenAI Vision
      const analysis = await analyzeImageWithVision(imageFile)
      
      if (analysis) {
        // Parsear el análisis para extraer medidas
        const parsedMeasures = parseMeasuresFromText(analysis)
        
        if (parsedMeasures.length > 0) {
          onImageAnalysis(parsedMeasures, analysis)
          toast.success(`Se detectaron ${parsedMeasures.length} medida(s) en la imagen`)
        } else {
          toast.warning("No se detectaron medidas válidas en la imagen")
          onImageAnalysis([], analysis)
        }
      }
      
    } catch (error) {
      console.error('Error procesando imagen:', error)
      throw error
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

  const discardImage = () => {
    setUploadedImage(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage)
    }
  }

  const retryUpload = () => {
    discardImage()
    handleFileSelect()
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!uploadedImage && (
        <div className="flex flex-col items-center space-y-2">
          <Button
            onClick={handleFileSelect}
            disabled={isDisabled || isProcessing}
            className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </Button>
          <p className="text-sm text-gray-600 text-center">
            Subir foto de medidas
          </p>
          <p className="text-xs text-gray-500 text-center max-w-xs">
            Formatos: JPG, PNG, WebP (máx. 10MB)
          </p>
        </div>
      )}

      {uploadedImage && (
        <div className="w-full flex flex-col items-center mt-4">
          <div className="w-full flex flex-col items-center">
            <div className="w-full flex flex-col items-center overflow-hidden rounded-lg bg-white shadow-md border border-gray-200 p-2">
              <img
                src={uploadedImage}
                alt="Imagen subida"
                className="object-contain max-h-72 w-auto max-w-full mx-auto rounded-lg border border-gray-300 transition-all duration-200"
                style={{boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}
              />
              {!isProcessing && (
                <div className="flex flex-col w-full gap-2 mt-4">
                  <Button onClick={retryUpload} className="w-full bg-blue-600 hover:bg-blue-700">
                    Subir otra
                  </Button>
                  <Button onClick={discardImage} variant="outline" className="w-full">
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
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}

export default FileUpload

