export function readGoods(payload) {
  if (payload?.error) {
    const messages = {
      'Empty key!': 'Не настроен ключ API. Добавьте FAVORIT_API_KEY на сервере.',
      'Invalid key client!': 'Сервис отклонил ключ покупателя. Проверьте настройки API.',
      'Empty number goods!': 'Введите артикул детали.',
      'Request quota exceeded!': 'Превышен лимит запросов. Попробуйте позже.',
    };
    throw new Error(messages[payload.error] || `Ошибка сервиса: ${String(payload.error).slice(0, 200)}`);
  }
  if (!payload || !Array.isArray(payload.goods)) throw new Error('Сервис вернул ответ неизвестного формата. Попробуйте ещё раз.');
  return payload.goods.filter(item => item && typeof item.brand === 'string' && item.brand.trim() && typeof item.number === 'string' && item.number.trim());
}

export function getBrands(goods) {
  const brands = new Map();
  for (const item of goods) {
    const key = item.brand.trim().toUpperCase();
    if (!brands.has(key)) brands.set(key, { brand: item.brand.trim(), name: item.name || 'Автозапчасть', number: item.number });
  }
  return [...brands.values()].sort((a, b) => a.brand.localeCompare(b.brand));
}

const numeric = value => value !== null && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;

export function getOffers(goods, selectedBrand) {
  const offers = new Map();
  const visit = item => {
    if (!item || typeof item.brand !== 'string' || !item.brand.trim() || !item.number) return;
    const warehouses = Array.isArray(item.warehouses) && item.warehouses.length ? item.warehouses : [null];
    for (const [index, warehouse] of warehouses.entries()) {
      const key = `${item.goodsID || `${item.brand}:${item.number}`}:${warehouse?.id || warehouse?.code || index}`;
      offers.set(key, {
        id: key, brand: item.brand, number: item.number, name: item.name || 'Автозапчасть',
        price: warehouse ? numeric(warehouse.price) : null,
        stock: warehouse ? numeric(warehouse.stock) : numeric(item.count),
        warehouse: warehouse?.code || (warehouse ? 'Склад поставщика' : 'Нет предложений'),
        original: item.brand.trim().toUpperCase() === selectedBrand.trim().toUpperCase(),
      });
    }
    if (Array.isArray(item.analogues)) item.analogues.forEach(visit);
  };
  goods.forEach(visit);
  return [...offers.values()];
}
