import { demoResponse } from './demo.js';
import { readGoods } from './catalog.js';

export async function searchParts({ number, brand, demo }, signal) {
  if (demo) {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 500);
      signal.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
    });
    return readGoods(demoResponse(number, brand));
  }
  let response;
  try {
    response = await fetch('/api/search', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number, ...(brand && { brand }) }), signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Нет связи с сервером. Проверьте подключение и повторите поиск.');
  }
  let payload;
  try { payload = await response.json(); }
  catch { throw new Error('Не удалось прочитать ответ сервера. Повторите поиск.'); }
  if (!response.ok && !payload.error) throw new Error(`Сервис недоступен (HTTP ${response.status}). Повторите поиск позже.`);
  return readGoods(payload);
}
