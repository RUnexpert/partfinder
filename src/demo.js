const warehouse = (code, price, stock) => ({ id: code, code, price, stock });
const part = (brand, number, name, warehouses, analogues = []) => ({
  goodsID: `${brand}-${number}`, brand, number, name, warehouses, analogues,
  count: warehouses.reduce((sum, item) => sum + item.stock, 0), price: 0,
});

export function demoResponse(number, brand) {
  const normalized = number.replace(/[\s-]/g, '').toUpperCase();
  let goods;
  if (normalized === '01089') {
    goods = [
      part('CAFFARO', number, 'Ролик приводного ремня', [warehouse('МС2', 1290, 12), warehouse('ПТ4', 1380, 8)]),
      part('ZEN', number, 'Ролик приводного ремня', [warehouse('МС2', 980, 6)]),
      part('NGKNTK', number, 'Ролик приводного ремня', [warehouse('СПБ', 1670, 3)]),
    ];
    if (brand) {
      const selected = goods.find(item => item.brand === brand);
      return { goods: selected ? [{ ...selected, analogues: [
        ...goods.filter(item => item.brand !== brand),
        part('INA', '532 0160 10', 'Ролик натяжителя приводного ремня', [warehouse('МС2', 2140, 18)]),
        part('GATES', 'T36016', 'Ролик натяжной', [warehouse('ПТ4', 1890, 4)]),
        part('FEBI', '03856', 'Ролик приводного ремня', [warehouse('СПБ', 1560, 0)]),
      ] }] : [] };
    }
  } else if (normalized === '7160500039S') {
    goods = [
      part('MEYLE', number, 'Комплект рычагов задней подвески', [warehouse('МС2', 12533.62, 20)]),
      part('MAPCO', number, 'Комплект рычагов подвески', [warehouse('ПТ4', 8680.2, 19)]),
      part('FEBI', number, 'Комплект рычагов подвески', [warehouse('СПБ', 10950, 7)]),
    ];
    if (brand) {
      const selected = goods.find(item => item.brand === brand);
      return { goods: selected ? [{ ...selected, analogues: [
        ...goods.filter(item => item.brand !== brand),
        part('MEYLE', '7160500039/SK', 'Рычаг задней подвески', []),
      ] }] : [] };
    }
  } else goods = [];
  return { goods };
}
