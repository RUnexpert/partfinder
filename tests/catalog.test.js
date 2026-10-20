import test from 'node:test';
import assert from 'node:assert/strict';
import { readGoods, getBrands, getOffers } from '../src/catalog.js';
import { demoResponse } from '../src/demo.js';
import { handleAPI, upstreamURL } from '../worker/api.js';
const product = { goodsID: 'one', brand: 'MEYLE', number: 'A#& 1', name: 'Рычаг', count: 99, price: 999, warehouses: [{ id: 'a', code: 'МС2', price: 120, stock: 4 }, { id: 'b', price: 140, stock: 0 }] };

test('Empty structure and duplicate brands are handled', () => {
  assert.deepEqual(readGoods({ goods: [{}] }), []);
  assert.deepEqual(getBrands([product, { ...product, brand: 'meyle' }]).map(i => i.brand), ['MEYLE']);
  assert.throws(() => readGoods({}), /формата/);
  assert.throws(() => readGoods({ error: 'Invalid key client!' }), /ключ/);
});
test('Each warehouse has its own price and stock; top-level price is never used', () => {
  const offers = getOffers([product], 'MEYLE');
  assert.deepEqual(offers.map(i => [i.price, i.stock]), [[120, 4], [140, 0]]);
  assert(offers.every(i => i.original));
  const missing = getOffers([{ ...product, warehouses: [] }], 'MEYLE')[0];
  assert.equal(missing.price, null);
  assert.equal(missing.stock, 99);
  assert.equal(getOffers([{ ...product, warehouses: [{ price: '', stock: null }] }], 'MEYLE')[0].price, null);
});
test('Nested analogues and duplicate offers flatten correctly', () => {
  const analogous = { ...product, goodsID: 'two', brand: 'MAPCO', warehouses: [{ id: 'a', price: 80, stock: 3 }] };
  const offers = getOffers([{ ...product, analogues: [analogous] }, analogous], 'MEYLE');
  assert.equal(offers.length, 3);
  assert.equal(offers.filter(i => !i.original).length, 1);
});
test('Special characters are encoded once and analogues only requested with brand', () => {
  const env = { FAVORIT_API_KEY: 'key#&' };
  const url = upstreamURL('A#& 1', 'A&B', env);
  assert.equal(url.searchParams.get('number'), 'A#& 1');
  assert.equal(url.searchParams.get('brand'), 'A&B');
  assert.equal(url.searchParams.get('analogues'), 'on');
  assert.equal(upstreamURL('x', undefined, env).searchParams.has('brand'), false);
  assert.equal(upstreamURL('x', undefined, env).searchParams.has('analogues'), false);
});
test('Demo follows both stages and returns empty for unknown numbers', () => {
  assert.equal(getBrands(readGoods(demoResponse('01089'))).length, 3);
  assert.equal(getOffers(readGoods(demoResponse('01089', 'ZEN')), 'ZEN').length, 7);
  assert.deepEqual(readGoods(demoResponse('unknown')), []);
});
const request = (body, extra = {}) => new Request('http://localhost/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json', ...extra }, body: JSON.stringify(body) });
test('Proxy validates input, missing key, origin, method and malformed JSON', async () => {
  assert.equal((await handleAPI(request({ number: '' }))).status, 400);
  assert.equal((await handleAPI(request({ number: 'x', brand: 1 }))).status, 400);
  assert.equal((await handleAPI(request({ number: 'x' }))).status, 503);
  assert.equal((await handleAPI(request({ number: 'x' }, { origin: 'https://other.test' }))).status, 403);
  assert.equal((await handleAPI(new Request('http://localhost/api/search'))).status, 405);
  assert.equal((await handleAPI(new Request('http://localhost/api/search', {method:'POST', body:'invalid'}))).status, 400);
});
test('Proxy forwards documented response and handles upstream failures without exposing key', async () => {
  const env = { FAVORIT_API_KEY: 'secret-key' };
  let requested;
  const response = await handleAPI(request({number:'A#& 1',brand:'MEYLE'}), env, async url => { requested = url; return Response.json({goods:[product]}); });
  assert.equal(requested.searchParams.get('key'), 'secret-key');
  assert.equal((await response.json()).goods[0].price, 999);
  assert.equal((await handleAPI(request({number:'x'}), env, async () => new Response('down', {status:503}))).status, 502);
  assert.equal((await handleAPI(request({number:'x'}), env, async () => new Response('not-json'))).status, 502);
  const failed = await handleAPI(request({number:'x'}), env, async () => { throw new TypeError('secret-key'); });
  assert.equal(failed.status, 502);
  assert(!(await failed.text()).includes('secret-key'));
  const timedOut = await handleAPI(request({number:'x'}), env, async () => { throw new DOMException('Timeout', 'TimeoutError'); });
  assert.match((await timedOut.json()).error, /15 секунд/);
});
