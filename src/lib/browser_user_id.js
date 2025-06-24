// Universal userId para navegador (cotizador y ecommerce)
// ----------------------------------------------------------
// Esta función genera y persiste un identificador único por navegador/dispositivo.
// Ambos sistemas (cotizador y ecommerce/chat) deben usar exactamente esta función y clave.
// - Clave fija: "browser_user_id"
// - Si ya existe, retorna el mismo valor.
// - Si no existe, genera uno nuevo con formato: user_{timestamp}_{random}
// - El valor es persistente mientras no se borre el localStorage.
//
// Ejemplo de uso:
//   import { getOrCreateBrowserUserId } from './browser_user_id.js';
//   const userId = getOrCreateBrowserUserId();
//   // Usar userId para identificar al usuario en cualquier operación

export function getOrCreateBrowserUserId() {
  const KEY = "browser_user_id";
  let userId = localStorage.getItem(KEY);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(KEY, userId);
  }
  return userId;
}
