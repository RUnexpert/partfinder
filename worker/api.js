export const API_URL = 'http://api.favorit-parts.ru/hs/hsprice/';
const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

export function upstreamURL(number, brand, env) {
  const url = new URL(env.FAVORIT_API_URL || API_URL);
  url.search = new URLSearchParams({ key: env.FAVORIT_API_KEY, number, ...(brand ? { brand, analogues: 'on' } : {}) }).toString();
  return url;
}

export async function handleAPI(request, env = {}, fetcher = fetch) {
  const path = new URL(request.url).pathname;
  if (path === '/api/config' && request.method === 'GET') return json({ configured: Boolean(env.FAVORIT_API_KEY) });
  if (path !== '/api/search') return json({ error: 'Маршрут не найден.' }, 404);
  if (request.method !== 'POST') return json({ error: 'Метод не поддерживается.' }, 405);
  // The proxy accepts only same-origin browser requests; never reflect a client's Origin.
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'Запрос с другого сайта запрещён.' }, 403);
  let body;
  try {
    const text = await request.text();
    if (text.length > 2048) return json({ error: 'Слишком большой запрос.' }, 413);
    body = JSON.parse(text);
  } catch { return json({ error: 'Некорректный запрос.' }, 400); }
  if (typeof body?.number !== 'string' || !body.number.trim() || body.number.length > 100 || (body.brand !== undefined && (typeof body.brand !== 'string' || !body.brand.trim() || body.brand.length > 100))) return json({ error: 'Укажите корректный артикул и производителя (до 100 символов).' }, 400);
  if (!env.FAVORIT_API_KEY) return json({ error: 'Empty key!' }, 503);
  try {
    const response = await fetcher(upstreamURL(body.number.trim(), body.brand?.trim(), env), { signal: AbortSignal.timeout(15000), redirect: 'error', headers: { Accept: 'application/json' } });
    if (!response.ok) return json({ error: `Сервис поставщика недоступен (HTTP ${response.status}). Попробуйте позже.` }, 502);
    const data = await response.json();
    if (data?.error) return json({ error: String(data.error).replaceAll(env.FAVORIT_API_KEY, '[скрыто]').slice(0, 300) });
    if (!data || !Array.isArray(data.goods)) return json({ error: 'Сервис поставщика вернул некорректный ответ.' }, 502);
    return json(data);
  } catch (error) {
    return json({ error: error.name === 'TimeoutError' ? 'Сервис не ответил за 15 секунд. Повторите поиск.' : 'Не удалось связаться с сервисом поставщика. Повторите поиск позже.' }, 502);
  }
}
