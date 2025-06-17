// Utilidades para manejo de imágenes
export const processImageWithOpenAI = async (imageFile, comment = "") => {
  try {
    // Convertir archivo a base64
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
                text: `Eres un asistente especializado en extraer texto de imágenes. Analiza esta imagen y extrae todo el texto visible, incluyendo medidas, especificaciones técnicas, notas manuscritas o cualquier información textual relevante. Si no hay texto visible, responde 'No se detectó texto en la imagen'. ${comment ? `Comentario adicional: ${comment}` : ''}`
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

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('Error procesando imagen con OpenAI:', error)
    throw error
  }
}

export const sendToWhatsApp = async (transcription, vendedora) => {
  try {
    const phoneNumbers = {
      'Ana Martínez': '1234567890',
      'María López': '1234567891', 
      'Carolina Rodríguez': '1234567892',
      'Valentina Pérez': '1234567893'
    }

    const response = await fetch('https://evolution-evolution-api.o6b5bz.easypanel.host/message/sendText/cheche', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_WHATSAPP_API_KEY || 'default-key'
      },
      body: JSON.stringify({
        number: phoneNumbers[vendedora] || '1234567890',
        text: `Nueva transcripción de imagen de cotización:\n\n${transcription}`
      })
    })

    return response.ok
  } catch (error) {
    console.error('Error enviando a WhatsApp:', error)
    throw error
  }
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

