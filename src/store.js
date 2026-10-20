import { configureStore, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { searchParts } from './api.js';
import { getBrands, getOffers } from './catalog.js';

export const fetchBrands = createAsyncThunk('catalog/brands', async (args, { signal }) => getBrands(await searchParts(args, signal)));
export const fetchOffers = createAsyncThunk('catalog/offers', async (args, { signal }) => getOffers(await searchParts(args, signal), args.brand));
const initialState = { number: '', brand: '', demo: true, brands: [], offers: [], brandsStatus: 'idle', offersStatus: 'idle', brandsError: '', offersError: '', brandsRequest: null, offersRequest: null };
const slice = createSlice({
  name: 'catalog', initialState,
  reducers: {
    setNumber(state, action) { return { ...initialState, demo: state.demo, number: action.payload }; },
    setDemo(state, action) { return { ...initialState, number: state.number, demo: action.payload }; },
    selectBrand(state, action) { if (state.brand === action.payload) return; state.brand = action.payload; state.offers = []; state.offersStatus = 'idle'; state.offersError = ''; state.offersRequest = null; },
  },
  extraReducers: builder => {
    for (const [thunk, key] of [[fetchBrands, 'brands'], [fetchOffers, 'offers']]) {
      builder.addCase(thunk.pending, (state, action) => {
        state[`${key}Request`] = action.meta.requestId;
        state[`${key}Status`] = 'loading'; state[`${key}Error`] = ''; state[key] = [];
        if (key === 'brands') { state.brand = ''; state.offers = []; state.offersStatus = 'idle'; state.offersRequest = null; }
      });
      builder.addCase(thunk.fulfilled, (state, action) => {
        if (state[`${key}Request`] !== action.meta.requestId) return;
        state[key] = action.payload; state[`${key}Status`] = 'success';
      });
      builder.addCase(thunk.rejected, (state, action) => {
        if (state[`${key}Request`] !== action.meta.requestId) return;
        state[`${key}Status`] = action.meta.aborted ? 'idle' : 'error';
        state[`${key}Error`] = action.meta.aborted ? '' : action.error.message || 'Не удалось выполнить запрос.';
      });
    }
  },
});
export const { setNumber, setDemo, selectBrand } = slice.actions;
export const catalogReducer = slice.reducer;
export const store = configureStore({ reducer: { catalog: catalogReducer } });
