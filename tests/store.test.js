import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';
import { catalogReducer, setNumber, setDemo, selectBrand, fetchBrands, fetchOffers } from '../src/store.js';
const makeStore = () => configureStore({reducer:{catalog:catalogReducer}});
const goods = [{goodsID:'a', brand:'A', number:'01089', warehouses:[{id:'s',price:10,stock:2}]}];

test('Changing number or mode clears results and invalidates late responses', () => {
  const store = makeStore();
  store.dispatch(fetchBrands.pending('old', {number:'old'}));
  store.dispatch(setNumber('new'));
  store.dispatch(fetchBrands.fulfilled(goods, 'old', {number:'old'}));
  assert.deepEqual(store.getState().catalog.brands, []);
  assert.equal(store.getState().catalog.number, 'new');
  store.dispatch(selectBrand('A'));
  store.dispatch(fetchOffers.pending('old-offer', {}));
  store.dispatch(setDemo(false));
  store.dispatch(fetchOffers.fulfilled(goods, 'old-offer', {}));
  assert.deepEqual(store.getState().catalog.offers, []);
  assert.equal(store.getState().catalog.brand, '');
});
test('Selecting the current brand preserves loaded offers', () => {
  const store = makeStore();
  store.dispatch(selectBrand('A'));
  store.dispatch(fetchOffers.pending('offer', {}));
  store.dispatch(fetchOffers.fulfilled([{id:'x'}], 'offer', {}));
  store.dispatch(selectBrand('A'));
  assert.equal(store.getState().catalog.offersStatus, 'success');
  assert.equal(store.getState().catalog.offers.length, 1);
});
test('Both async stages forward correct request fields and surface network errors', async () => {
  const original = global.fetch;
  const bodies = [];
  global.fetch = async (url, options) => { bodies.push(JSON.parse(options.body)); return Response.json({goods}); };
  try {
    const store = makeStore();
    store.dispatch(setNumber('01089'));
    store.dispatch(setDemo(false));
    await store.dispatch(fetchBrands({number:'01089',demo:false}));
    assert.equal(store.getState().catalog.brands[0].brand,'A');
    store.dispatch(selectBrand('A'));
    await store.dispatch(fetchOffers({number:'01089',brand:'A',demo:false}));
    assert.deepEqual(bodies,[{number:'01089'},{number:'01089',brand:'A'}]);
    assert.equal(store.getState().catalog.offers[0].price,10);
    global.fetch = async () => { throw new TypeError('offline'); };
    await store.dispatch(fetchOffers({number:'01089',brand:'A',demo:false}));
    assert.equal(store.getState().catalog.offersStatus,'error');
    assert.match(store.getState().catalog.offersError,/Нет связи/);
  } finally { global.fetch = original; }
});
