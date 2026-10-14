const STORAGE_KEY = 'paywall:device-id'

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  // Фолбэк для старых WebView
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/**
 * Условный идентификатор устройства: UUID, который живёт в localStorage.
 * Вызывать только на клиенте (из обработчиков событий).
 */
export function useDeviceId(): () => string {
  return () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return saved
      const id = randomId()
      localStorage.setItem(STORAGE_KEY, id)
      return id
    } catch {
      // Приватный режим / запрещённое хранилище — живём без сохранения
      return randomId()
    }
  }
}
