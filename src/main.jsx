import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { ArrowRight, Check, CheckCircle2, ChevronRight, CircleHelp, Database, FileSearch, Layers3, LoaderCircle, Package, Search, Settings2, ShieldCheck, SlidersHorizontal, Unplug, X } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import { store, fetchBrands, fetchOffers, setNumber, setDemo, selectBrand } from './store.js';

const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 2 });
const brandColors = { CAFFARO: '#284784', ZEN: '#19785e', NGKNTK: '#b4333d', MEYLE: '#16519d', MAPCO: '#b92c30', FEBI: '#c93036' };
function Loader({ children }) { return <div className="state-box" role="status"><LoaderCircle className="spin" size={28}/><p>{children}</p></div>; }
function Message({ title, children, error, retry }) { return <div className={`state-box ${error ? 'error-state' : ''}`} role={error ? 'alert' : 'status'}>{error ? <Unplug size={28}/> : <FileSearch size={32}/>}<h3>{title}</h3><p>{children}</p>{retry && <button className="btn btn-outline-primary btn-sm" onClick={retry}>Повторить запрос</button>}</div>; }
function PartDrawing() { return <svg className="part-drawing" viewBox="0 0 300 200" fill="none" aria-hidden="true"><g stroke="#c5d0e2" strokeWidth="1"><path d="M18 160h264M42 20v160M258 20v160" strokeDasharray="4 5"/><ellipse cx="153" cy="101" rx="75" ry="48" transform="rotate(-25 153 101)" fill="#f2f5fa"/><ellipse cx="153" cy="94" rx="75" ry="48" transform="rotate(-25 153 94)" fill="#fff" stroke="#8ea5c7" strokeWidth="2"/><ellipse cx="153" cy="94" rx="55" ry="34" transform="rotate(-25 153 94)" stroke="#245bd7" strokeWidth="1.5"/><ellipse cx="153" cy="94" rx="29" ry="19" transform="rotate(-25 153 94)" fill="#e8eef9" stroke="#8ea5c7"/><ellipse cx="153" cy="91" rx="15" ry="10" transform="rotate(-25 153 91)" fill="#fff"/><path d="m78 130 21 36h90l42-61M81 122l17 29m-9-37 17 29m-9-35 17 29m-7-34 17 29m-5-33 17 29m2-32 17 29m4-32 17 29m8-33 17 29"/><path d="m211 46 39-21h30M93 134 49 156H17" stroke="#245bd7"/><circle cx="211" cy="46" r="3" fill="#245bd7"/><circle cx="93" cy="134" r="3" fill="#245bd7"/></g></svg>; }

function App() {
  const state = useSelector(s => s.catalog);
  const { number, brand, demo, brands, offers, brandsStatus, offersStatus, brandsError, offersError } = state;
  const dispatch = useDispatch();
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState('recommended');
  const [settings, setSettings] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [configError, setConfigError] = useState(false);
  const brandsTask = useRef();
  const offersTask = useRef();
  const dialogRef = useRef();
  const searchRef = useRef();
  useEffect(() => {
    fetch('/api/config').then(r => { if (!r.ok) throw Error(); return r.json(); }).then(data => setConfigured(data.configured)).catch(() => setConfigError(true));
  }, []);
  useEffect(() => {
    if (!number.trim()) return;
    const timer = setTimeout(() => { brandsTask.current = dispatch(fetchBrands({ number: number.trim(), demo })); }, 450);
    return () => { clearTimeout(timer); brandsTask.current?.abort(); };
  }, [number, demo, dispatch]);
  useEffect(() => {
    if (!brand) return;
    offersTask.current = dispatch(fetchOffers({ number: number.trim(), brand, demo }));
    return () => offersTask.current?.abort();
  }, [number, brand, demo, dispatch]);
  useEffect(() => { if (settings) dialogRef.current.showModal(); else dialogRef.current.close(); }, [settings]);
  const retryBrands = () => { brandsTask.current?.abort(); brandsTask.current = dispatch(fetchBrands({ number: number.trim(), demo })); };
  const retryOffers = () => { offersTask.current?.abort(); offersTask.current = dispatch(fetchOffers({ number: number.trim(), brand, demo })); };
  const changeNumber = value => { brandsTask.current?.abort(); offersTask.current?.abort(); dispatch(setNumber(value)); };
  const visible = offers.filter(item => !inStock || item.stock > 0).sort((a, b) => sort === 'price' ? (a.price ?? Infinity) - (b.price ?? Infinity) : sort === 'stock' ? (b.stock ?? -1) - (a.stock ?? -1) : Number(b.original) - Number(a.original));
  const priced = offers.filter(item => item.stock > 0 && item.price !== null);
  const minPrice = priced.length ? Math.min(...priced.map(item => item.price)) : null;
  return <>
    <header className="topbar"><div className="app-container header-inner"><a className="logo" href="/" aria-label="Partfinder — главная"><span className="logo-mark"><Layers3 size={23} strokeWidth={2.2}/></span>partfinder<span className="logo-dot">.</span></a><span className="header-divider"/><span className="header-caption">Каталог автозапчастей</span><button className="connection-btn" onClick={() => setSettings(true)}><span className={`status-dot ${demo ? 'demo' : configured ? '' : 'offline'}`}/>{demo ? 'Деморежим' : 'Внешний API'}<Settings2 size={15}/></button></div></header>
    <main className="app-container">
      <nav className="breadcrumb-line" aria-label="Навигация"><span>Каталог</span><ChevronRight size={13}/><span>Поиск по артикулу</span></nav>
      <section className="page-intro"><div><h1>Нужная деталь. Все предложения.</h1><p>Найдите производителя, сравните аналоги и наличие на складах.</p></div><div className="workflow"><span className="workflow-step active"><span>{brand ? <Check size={13}/> : '1'}</span>Производитель</span><span className="workflow-line"/><span className={`workflow-step ${brand ? 'active' : ''}`}><span>2</span>Предложения</span></div></section>
      <section className="search-panel" aria-labelledby="search-label"><form onSubmit={event => { event.preventDefault(); if (number.trim()) retryBrands(); else searchRef.current.focus(); }}><label id="search-label" htmlFor="part-number">Артикул запчасти</label><div className="search-row"><div className="search-input-wrap"><Search size={21}/><input ref={searchRef} id="part-number" value={number} onChange={e => changeNumber(e.target.value)} maxLength={100} autoComplete="off" spellCheck="false" placeholder="Введите артикул, например 01089"/>{number && <button type="button" className="clear-btn" aria-label="Очистить артикул" onClick={() => { changeNumber(''); searchRef.current.focus(); }}><X size={17}/></button>}</div><button className="btn btn-primary search-button" type="submit" disabled={brandsStatus === 'loading'}>{brandsStatus === 'loading' ? <LoaderCircle size={18} className="spin"/> : <Search size={18}/>}Найти запчасть</button></div></form><div className="search-bottom"><span>Например: <button onClick={() => changeNumber('01089')}>01089</button><button onClick={() => changeNumber('7160500039S')}>7160500039S</button></span><span><ShieldCheck size={14}/>Поиск по данным поставщика</span></div></section>
      {demo && <div className="demo-notice"><Database size={17}/><span><strong>Вы в деморежиме.</strong> Поиск работает на примерах 01089 и 7160500039S. Цены и остатки демонстрационные.</span><button onClick={() => setSettings(true)}>Подключить API<ArrowRight size={14}/></button></div>}
      <div className="catalog-layout">
        <section className="brands-panel" aria-labelledby="brands-title" aria-busy={brandsStatus === 'loading'}><div className="panel-title"><span className="step-number">1</span><h2 id="brands-title">Производитель</h2>{brandsStatus === 'success' && <span className="count-badge">{brands.length}</span>}</div><p className="panel-caption">Выберите бренд вашей запчасти</p>
          {brandsStatus === 'loading' ? <Loader>Ищем производителей…</Loader> : brandsStatus === 'error' ? <Message title="Поиск не выполнен" error retry={retryBrands}>{brandsError}</Message> : brandsStatus === 'success' && !brands.length ? <Message title="Бренды не найдены">{demo ? 'Попробуйте один из демонстрационных артикулов выше.' : 'Проверьте артикул или попробуйте другой номер.'}</Message> : brands.length ? <div className="brand-list">{brands.map(item => <button key={item.brand} className={`brand-item ${brand === item.brand ? 'selected' : ''}`} onClick={() => dispatch(selectBrand(item.brand))} aria-pressed={brand === item.brand}><span className="brand-monogram" style={{ color: brandColors[item.brand.toUpperCase()] || '#375b88' }}>{item.brand.slice(0, 2).toUpperCase()}</span><span className="brand-copy"><strong>{item.brand}</strong><span>{item.name}</span></span>{brand === item.brand ? <CheckCircle2 size={19} className="selected-icon"/> : <ChevronRight size={17}/>}</button>)}</div> : <div className="brand-placeholder"><span className="placeholder-lines"><i/><i/><i/></span><p>Здесь появятся бренды<br/>для вашего артикула</p></div>}
          <div className="brand-help"><CircleHelp size={17}/><p>Один артикул может встречаться у разных производителей. Выберите нужный бренд для точного подбора.</p></div>
        </section>
        <section className="offers-panel" aria-labelledby="offers-title" aria-busy={offersStatus === 'loading'}><div className="offers-heading"><div className="panel-title"><span className={`step-number ${brand ? '' : 'muted'}`}>2</span><h2 id="offers-title">Аналоги и предложения</h2>{offersStatus === 'success' && <span className="count-badge">{offers.length}</span>}</div>{brand && <span className="selected-part">{brand}<span>/</span>{number.trim()}</span>}</div>
          {offersStatus === 'loading' ? <Loader>Загружаем аналоги и цены по складам…</Loader> : offersStatus === 'error' ? <Message title="Не удалось загрузить предложения" error retry={retryOffers}>{offersError}</Message> : offersStatus === 'success' ? <>
            <div className="results-toolbar"><label className="stock-filter"><input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)}/>Только в наличии</label><div className="sort-control"><SlidersHorizontal size={15}/><select aria-label="Сортировка предложений" value={sort} onChange={e => setSort(e.target.value)}><option value="recommended">Сначала искомый бренд</option><option value="price">Сначала дешевле</option><option value="stock">По остатку</option></select></div></div>
            {visible.length ? <div className="table-responsive"><table className="table offers-table"><thead><tr><th scope="col">Запчасть / производитель</th><th scope="col">Склад</th><th scope="col" className="text-end">Наличие</th><th scope="col" className="text-end">Цена за шт.</th></tr></thead><tbody>{visible.map(item => <tr key={item.id}><td><div className="offer-brand">{item.brand}{item.original && <span className="original-tag">Искомый бренд</span>}</div><div className="offer-name">{item.name}</div><span className="offer-number">{item.number}</span></td><td><span className="warehouse"><Package size={13}/>{item.warehouse}</span></td><td className="text-end"><span className={`stock ${item.stock > 0 ? 'available' : ''}`}>{item.stock > 0 && <span/>}{item.stock === null ? 'Нет данных' : `${item.stock} шт.`}</span></td><td className="text-end"><strong className="offer-price">{item.price === null ? '—' : money.format(item.price)}</strong>{item.price === minPrice && item.stock > 0 && <span className="best-price">Лучшая цена</span>}</td></tr>)}</tbody></table></div> : <Message title={offers.length ? 'Нет предложений в наличии' : 'Предложения не найдены'}>{offers.length ? 'Отключите фильтр наличия, чтобы увидеть все позиции.' : 'Попробуйте выбрать другого производителя или изменить артикул.'}</Message>}
            <div className="results-foot"><span>Показано {visible.length} из {offers.length}</span><span>Цена и остаток указаны для каждого склада</span></div>
          </> : <div className="offers-empty"><PartDrawing/><h3>{brands.length ? 'Теперь выберите производителя' : 'Подбор начинается с артикула'}</h3><p>{brands.length ? 'Выберите бренд слева — найдём запчасть, её аналоги и предложения по складам.' : 'Введите номер детали в строку поиска. Затем выберите бренд, чтобы увидеть цены и доступные аналоги.'}</p>{!brands.length && <button className="example-button" onClick={() => changeNumber('01089')}>Попробовать на примере<ArrowRight size={15}/></button>}</div>}
        </section>
      </div>
      <div className="process-note"><CheckCircle2 size={15}/><span>От артикула до предложения — два простых шага</span><span className="note-line"/><span>Производитель<ChevronRight size={12}/>Аналоги<ChevronRight size={12}/>Цена и наличие</span></div>
    </main>
    <footer className="app-container footer"><span>partfinder<span className="logo-dot">.</span><span className="footer-description">Поиск запчастей без лишнего</span></span><span><span className={`status-dot ${demo ? 'demo' : ''}`}/>{demo ? 'Демонстрационные данные' : 'Favorit Parts API'}</span></footer>
    <dialog ref={dialogRef} className="settings-dialog" onCancel={() => setSettings(false)} onClick={event => { if (event.target === dialogRef.current) setSettings(false); }}><div className="dialog-heading"><span className="dialog-icon"><Settings2 size={22}/></span><button className="icon-button" aria-label="Закрыть настройки" onClick={() => setSettings(false)}><X size={21}/></button></div><h2>Источник данных</h2><p>Выберите режим работы каталога.</p><label className={`mode-option ${demo ? 'chosen' : ''}`}><input type="radio" name="mode" checked={demo} onChange={() => dispatch(setDemo(true))}/><span><strong>Демонстрационный каталог</strong><small>Примеры поиска без подключения к сервису</small></span></label><label className={`mode-option ${!demo ? 'chosen' : ''}`}><input type="radio" name="mode" checked={!demo} onChange={() => dispatch(setDemo(false))}/><span><strong>Favorit Parts API</strong><small>{configError ? 'Не удалось проверить подключение' : configured ? 'Ключ настроен на сервере' : 'Необходим ключ покупателя'}</small></span></label><div className="api-explanation"><ShieldCheck size={18}/><p>Ключ хранится на сервере. Для подключения задайте <code>FAVORIT_API_KEY</code> в окружении сервера и перезапустите приложение или выполните публикацию.</p></div><button className="btn btn-primary w-100" onClick={() => setSettings(false)}>Готово</button></dialog>
  </>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><Provider store={store}><App/></Provider></React.StrictMode>);
