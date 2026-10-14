/** «2026-10-13T14:45:00Z» → «13.10.2026, 18:45» в часовом поясе пользователя */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** 42 → «#000042» */
export function formatOrderNumber(id: number): string {
  return `#${String(id).padStart(6, '0')}`
}

/** Текст ошибки покупки по ответу сервера */
export function purchaseErrorText(err: unknown): string {
  const status = (err as { statusCode?: number; status?: number })?.statusCode ?? (err as { status?: number })?.status
  if (status === 404) return 'Тариф больше недоступен. Обновите страницу и выберите другой.'
  if (status === 400) return 'Не получилось отправить запрос. Попробуйте ещё раз.'
  return 'Проверьте интернет и попробуйте ещё раз. Деньги не списаны.'
}
