import { createGarmentViewer, webglAvailable } from './garment3d.js';
import { createFrameViewer } from './viewer360.js';

const D = window.AN2;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $('#app');
const HAS_GL = webglAvailable();

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rub = n => n.toLocaleString('ru-RU') + ' ₽';
const catName = slug => D.categories.find(c => c.slug === slug)?.name || '';
const brandName = slug => D.brands.find(b => b.slug === slug)?.name || '';
const bySlug = slug => D.products.find(p => p.slug === slug);

/* ================= Хранилище (корзина, избранное, аккаунт) ================= */
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('an2:' + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('an2:' + k, JSON.stringify(v)); } catch {} }
};
let cart = store.get('cart', []);          // [{id, size, color, qty}]
let favs = new Set(store.get('favs', []));
let recent = store.get('recent', []);
let user = store.get('user', null);

function saveCart() { store.set('cart', cart); renderCart(); updateBadges(); }
function saveFavs() { store.set('favs', [...favs]); updateBadges(); }
function updateBadges() {
  const c = cart.reduce((s, i) => s + i.qty, 0);
  const cc = $('#cartCount'); cc.textContent = c; cc.classList.toggle('on', c > 0);
  const fc = $('#favCount'); fc.textContent = favs.size; fc.classList.toggle('on', favs.size > 0);
}

function addToCart(id, size, color, qty = 1) {
  const ex = cart.find(i => i.id === id && i.size === size && i.color === color);
  ex ? (ex.qty += qty) : cart.push({ id, size, color, qty });
  saveCart();
}
function toggleFav(id) {
  favs.has(id) ? favs.delete(id) : favs.add(id);
  saveFavs();
  $$(`[data-fav="${id}"]`).forEach(b => b.classList.toggle('on', favs.has(id)));
  toast(favs.has(id) ? 'Добавлено в избранное' : 'Удалено из избранного');
}

/* ================= Иллюстрации-силуэты для карточек ================= */
const SIL = {
  dress: 'M80 30Q100 44 120 30L140 38L160 92L146 98L136 70L133 110Q128 128 126 140L152 272Q100 284 48 272L74 140Q72 128 67 110L64 70L54 98L40 92L60 38Z',
  sundress: 'M74 28L86 28Q100 74 114 28L126 28L133 110Q128 128 126 140L152 272Q100 284 48 272L74 140Q72 128 67 110Z',
  jacket: 'M78 30Q100 40 122 30L146 40Q162 60 166 176L150 178L141 84L142 196Q100 204 58 196L59 84L50 178L34 176Q38 60 54 40Z',
  coat: 'M76 28Q100 40 124 28L150 40Q168 64 170 200L154 202L145 88L150 272Q100 282 50 272L55 88L46 202L30 200Q32 64 50 40Z',
  suit: 'M78 30Q100 40 122 30L146 40Q162 60 166 160L150 162L141 84L142 162Q100 170 58 162L59 84L50 162L34 160Q38 60 54 40ZM64 168L136 168L146 272Q100 280 54 272Z',
  skirt: 'M66 56L134 56L136 70L150 262Q100 272 50 262L64 70Z',
  blouse: 'M78 40Q100 54 122 40L150 52L168 104L150 112L140 88L143 176Q100 184 57 176L60 88L50 112L32 104L50 52Z',
  trousers: 'M64 40L136 40L146 272L108 272L100 112L92 272L54 272Z'
};
const DETAIL = {
  jacket: 'M86 32L100 118L114 32M100 118L100 196',
  coat: 'M84 30L100 124L116 30M100 124L100 272M58 190L82 190M118 190L142 190',
  suit: 'M100 44L100 162',
  dress: 'M100 44L100 140',
  sundress: 'M100 60L100 276',
  skirt: 'M66 70L134 70',
  blouse: 'M88 44Q100 70 112 44',
  trousers: 'M64 54L136 54'
};
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = c => Math.max(0, Math.min(255, Math.round(c + amt * 255)));
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('');
}
let silId = 0;
function silhouette(p, hex = p.colors[0].hex) {
  const id = 's' + (++silId);
  const light = hex === '#ffffff' || parseInt(hex.slice(1), 16) > 0xc0c0c0;
  return `<svg class="sil" viewBox="0 0 200 300" aria-hidden="true">
    <defs>
      <linearGradient id="${id}" x1="0" x2="1" y1="0" y2=".3">
        <stop offset="0" stop-color="${shade(hex, .12)}"/><stop offset=".55" stop-color="${hex}"/><stop offset="1" stop-color="${shade(hex, -.12)}"/>
      </linearGradient>
      <radialGradient id="${id}g" cx=".5" cy="1" r=".6"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="100" cy="284" rx="70" ry="8" fill="url(#${id}g)"/>
    <path d="${SIL[p.type]}" fill="url(#${id})"/>
    <path d="${DETAIL[p.type] || ''}" fill="none" stroke="${light ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.18)'}" stroke-width="1.2"/>
  </svg>`;
}

/* ================= Компоненты ================= */
function card(p, i = 0) {
  const sale = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return `<article class="card reveal" style="--d:${(i % 4) * 70}ms">
    <a href="#/product/${p.slug}" class="card__media" data-tilt>
      <div class="card__stage">${p.images?.[0] ? `<img src="${p.images[0]}" alt="${esc(p.name)}" loading="lazy">` : silhouette(p)}</div>
      <div class="card__labels">
        ${p.isNew ? '<span class="tag">New</span>' : ''}${sale ? `<span class="tag tag--sale">−${sale}%</span>` : ''}
      </div>
      <span class="card__360"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>3D · 360°</span>
      <span class="card__quick" data-quick="${p.id}">Быстрый просмотр</span>
    </a>
    <button class="fav ${favs.has(p.id) ? 'on' : ''}" data-fav="${p.id}" aria-label="В избранное"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button>
    <div class="card__info">
      <p class="card__brand">${brandName(p.brand)}</p>
      <h3 class="card__name"><a href="#/product/${p.slug}">${esc(p.name)}</a></h3>
      <p class="price">${rub(p.price)} ${p.oldPrice ? `<s>${rub(p.oldPrice)}</s>` : ''}</p>
      <div class="card__swatches">${p.colors.map(c => `<i style="--c:${c.hex}" title="${esc(c.name)}"></i>`).join('')}</div>
    </div>
  </article>`;
}

function crumbs(items) {
  return `<nav class="crumbs" aria-label="Навигация"><a href="#/">Главная</a>${items.map(([t, h]) => h ? `<span>/</span><a href="${h}">${esc(t)}</a>` : `<span>/</span><b>${esc(t)}</b>`).join('')}</nav>`;
}

/* ================= Просмотрщики 3D / 360 ================= */
let viewers = [];
function mountViewer(el, product, opts) {
  let v;
  if (product.frames?.length) v = createFrameViewer(el, product.frames, opts);
  else if (HAS_GL) { v = createGarmentViewer(el, opts); v.setProduct(product); }
  else { el.innerHTML = `<div class="fallback-spin">${silhouette(product)}</div>`; v = { setProduct() {}, setColor() {}, setAutoRotate() {}, resetView() {}, dispose() {} }; }
  viewers.push(v);
  return v;
}
function disposeViewers() { viewers.forEach(v => v.dispose()); viewers = []; }

/* ================= Страницы ================= */
const featured = D.products.filter(p => p.isNew);
const demo3d = bySlug('kostyum-tvidovyj') || D.products[0];

function viewHome() {
  const hero = featured[0];
  app.innerHTML = `
  <section class="hero">
    <div class="hero__text">
      <p class="eyebrow reveal">Pret-a-porter · собственное производство в Москве</p>
      <h1 class="hero__title">
        <span class="line"><span>Искусство</span></span>
        <span class="line"><span><em>безупречного</em></span></span>
        <span class="line"><span>кроя</span></span>
      </h1>
      <p class="hero__lead reveal">Жакеты, платья, костюмы и пальто брендов AN-2 и Natalia Slavina. Собственное производство, точная посадка, качество, которое видно в каждой детали.</p>
      <div class="hero__cta reveal">
        <a href="#/catalog" class="btn btn--primary" data-magnetic>Смотреть каталог</a>
        <a href="#/catalog/new" class="btn btn--ghost" data-magnetic>Новинки</a>
      </div>
    </div>
    <div class="hero__stage">
      <div class="hero__ring" aria-hidden="true"></div>
      <div class="hero__viewer" id="heroViewer"></div>
      <div class="hero__hint"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>Потяните, чтобы повернуть</div>
      <div class="hero__product glass">
        <button class="icon-btn" id="heroPrev" aria-label="Предыдущая модель">←</button>
        <div class="hero__meta">
          <p class="card__brand" id="heroBrand"></p>
          <a id="heroName" class="hero__name"></a>
          <div class="swatches swatches--sm" id="heroSwatches"></div>
        </div>
        <button class="icon-btn" id="heroNext" aria-label="Следующая модель">→</button>
      </div>
      <span class="hero__count" id="heroCount"></span>
    </div>
    <a href="#cats" class="scroll-cue" aria-label="Листать вниз"><span></span></a>
  </section>

  <section class="ticker" aria-hidden="true">
    <div class="ticker__track">${Array(2).fill(`<span>AN-2</span><i>✦</i><span><em>Natalia Slavina</em></span><i>✦</i><span>Жакеты</span><i>✦</i><span>Платья</span><i>✦</i><span>Костюмы</span><i>✦</i><span>Пальто</span><i>✦</i>`).join('')}</div>
  </section>

  <section class="section" id="cats">
    <div class="section__head">
      <p class="eyebrow reveal">Каталог</p>
      <h2 class="h2 reveal">Категории</h2>
    </div>
    <div class="cats">
      ${D.categories.map((c, i) => {
        const p = D.products.find(x => x.cat === c.slug);
        const count = D.products.filter(x => x.cat === c.slug).length;
        return `<a href="#/catalog/${c.slug}" class="cat reveal" style="--d:${(i % 4) * 60}ms" data-tilt>
          <span class="cat__num">0${i + 1}</span>
          <div class="cat__img">${p ? silhouette(p) : ''}</div>
          <span class="cat__name">${c.name}</span>
          <span class="cat__count">${count} ${plural(count, ['модель', 'модели', 'моделей'])}</span>
        </a>`;
      }).join('')}
    </div>
  </section>

  <section class="section">
    <div class="section__head section__head--row">
      <div><p class="eyebrow reveal">Новая коллекция</p><h2 class="h2 reveal">Новинки сезона</h2></div>
      <div class="rail-nav"><button class="icon-btn" data-rail="-1" aria-label="Назад">←</button><button class="icon-btn" data-rail="1" aria-label="Вперёд">→</button><a href="#/catalog/new" class="link">Все новинки</a></div>
    </div>
    <div class="rail" id="rail">${featured.map(card).join('')}</div>
  </section>

  <section class="feature3d">
    <div class="feature3d__text">
      <p class="eyebrow reveal">Новое на сайте</p>
      <h2 class="h2 reveal">3D-примерочная</h2>
      <p class="reveal">Каждую модель можно рассмотреть со всех сторон: вращайте на 360°, приближайте, меняйте цвет — и увидите фактуру ткани, посадку и детали отделки ещё до примерки.</p>
      <ul class="checks reveal">
        <li>Вращение 360° мышью или пальцем</li>
        <li>Смена цвета в реальном времени</li>
        <li>Фактура ткани: шерсть, твид, шёлк, кружево, замша</li>
      </ul>
      <a href="#/product/${demo3d.slug}" class="btn btn--light reveal" data-magnetic>Попробовать</a>
    </div>
    <div class="feature3d__stage" id="featureViewer"></div>
  </section>

  <section class="section about-teaser">
    <div class="about-teaser__grid">
      <div>
        <p class="eyebrow reveal">О компании</p>
        <h2 class="h2 reveal">Более 25 лет мы шьём одежду, в которой женщина чувствует себя уверенно</h2>
      </div>
      <div class="reveal">
        <p>AN-2 — российский производитель женской одежды класса pret-a-porter. Основу ассортимента составляют жакеты, платья, костюмы и пальто. Мы работаем под двумя марками — AN-2 и Natalia Slavina, и отвечаем за каждый этап: от эскиза и лекал до финальной строчки.</p>
        <a href="#/about" class="link">Подробнее о нас</a>
      </div>
    </div>
    <div class="stats">
      ${[['25+', 'лет на рынке'], ['2', 'собственных бренда'], ['42–56', 'размерный ряд'], ['100%', 'собственное производство']].map(([n, t]) => `
        <div class="stat reveal"><b data-count="${n}">${n}</b><span>${t}</span></div>`).join('')}
    </div>
  </section>

  <section class="section brands">
    ${D.brands.map((b, i) => `
      <a href="#/catalog?brand=${b.slug}" class="brand reveal ${i ? 'brand--alt' : ''}" data-tilt>
        <span class="eyebrow">Бренд</span>
        <span class="brand__name">${i ? '<em>Natalia Slavina</em>' : 'AN—2'}</span>
        <span class="brand__desc">${i ? 'Классика высокого качества: благородные ткани, выверенные пропорции, ручная отделка.' : 'Базовый бренд компании: деловой и повседневный гардероб с безупречной посадкой.'}</span>
        <span class="link">Смотреть коллекцию</span>
      </a>`).join('')}
  </section>

  ${howToBuySteps()}
  `;

  // Герой-3D
  let idx = 0, color = 0;
  const heroEl = $('#heroViewer');
  const v = mountViewer(heroEl, hero, { hero: true, autoRotate: true });
  const upd = (first) => {
    const p = featured[idx];
    $('#heroBrand').textContent = brandName(p.brand);
    const n = $('#heroName'); n.textContent = p.name; n.href = `#/product/${p.slug}`;
    $('#heroCount').textContent = `${String(idx + 1).padStart(2, '0')} / ${String(featured.length).padStart(2, '0')}`;
    $('#heroSwatches').innerHTML = p.colors.map((c, i) => `<button class="swatch ${i === color ? 'on' : ''}" style="--c:${c.hex}" data-i="${i}" title="${esc(c.name)}" aria-label="${esc(c.name)}"></button>`).join('');
    if (!first) v.setProduct(p, p.colors[color].hex);
  };
  upd(true);
  $('#heroSwatches').addEventListener('click', e => {
    const b = e.target.closest('.swatch'); if (!b) return;
    color = +b.dataset.i; v.setColor(featured[idx].colors[color].hex);
    $$('.swatch', $('#heroSwatches')).forEach(s => s.classList.toggle('on', s === b));
  });
  $('#heroPrev').onclick = () => { idx = (idx - 1 + featured.length) % featured.length; color = 0; upd(); };
  $('#heroNext').onclick = () => { idx = (idx + 1) % featured.length; color = 0; upd(); };

  // Блок 3D-примерочной — ленивая инициализация
  lazy($('#featureViewer'), el => mountViewer(el, demo3d, { autoRotate: true }));

  $$('[data-rail]').forEach(b => b.onclick = () => $('#rail').scrollBy({ left: +b.dataset.rail * $('#rail').clientWidth * .8, behavior: 'smooth' }));
}

function howToBuySteps() {
  return `<section class="section steps">
    <div class="section__head"><p class="eyebrow reveal">Покупателям</p><h2 class="h2 reveal">Как купить</h2></div>
    <ol class="steps__list">
      ${[
        ['Выберите модель', 'Рассмотрите вещь в 3D, выберите цвет и размер. Не уверены в размере — загляните в таблицу размеров.'],
        ['Оформите заказ', 'Добавьте товар в корзину и отправьте заказ. Либо позвоните по телефону +7 (495) 966-34-41 или напишите на shop@an-2.ru.'],
        ['Подтверждение', 'Менеджер свяжется с вами, уточнит детали, наличие и согласует удобный способ доставки.'],
        ['Получение', `Доставка ${D.shop.delivery}: курьером по Москве, транспортными компаниями и почтой по России. Возврат — ${D.shop.returnDays} дней.`]
      ].map(([t, d], i) => `<li class="step reveal" style="--d:${i * 80}ms"><span class="step__n">0${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}
    </ol>
  </section>`;
}

/* ---------- Каталог ---------- */
let filters = { brand: [], size: [], color: [], price: null, sort: 'default' };

function viewCatalog(cat, query) {
  const q = new URLSearchParams(query || '');
  if (q.get('brand')) filters = { ...filters, brand: [q.get('brand')] };
  const title = cat === 'sale' ? 'Sale' : cat === 'new' ? 'Новинки' : cat ? catName(cat) : 'Каталог';
  const maxPrice = Math.max(...D.products.map(p => p.price));
  const colorNames = [...new Set(D.products.flatMap(p => p.colors.map(c => c.name)))];

  app.innerHTML = `
  <section class="page-head">
    ${crumbs(cat ? [['Каталог', '#/catalog'], [title]] : [['Каталог']])}
    <h1 class="h1">${title}</h1>
    <div class="chips">
      <a href="#/catalog" class="chip ${!cat ? 'on' : ''}">Все</a>
      ${D.categories.map(c => `<a href="#/catalog/${c.slug}" class="chip ${cat === c.slug ? 'on' : ''}">${c.name}</a>`).join('')}
      <a href="#/catalog/new" class="chip ${cat === 'new' ? 'on' : ''}">Новинки</a>
      <a href="#/catalog/sale" class="chip chip--sale ${cat === 'sale' ? 'on' : ''}">Sale</a>
    </div>
  </section>
  <section class="catalog">
    <aside class="filters" id="filters">
      <div class="filters__head"><span class="eyebrow">Фильтры</span><button class="icon-btn filters__close" id="filtersClose" aria-label="Закрыть">✕</button></div>
      <details open><summary>Бренд</summary>
        ${D.brands.map(b => `<label class="check"><input type="checkbox" name="brand" value="${b.slug}" ${filters.brand.includes(b.slug) ? 'checked' : ''}><span>${b.name}</span></label>`).join('')}
      </details>
      <details open><summary>Размер</summary>
        <div class="size-grid">${D.sizes.map(s => `<label class="size-pill"><input type="checkbox" name="size" value="${s}" ${filters.size.includes(s) ? 'checked' : ''}><span>${s}</span></label>`).join('')}</div>
      </details>
      <details open><summary>Цвет</summary>
        <div class="color-list">${colorNames.map(n => {
          const hex = D.products.flatMap(p => p.colors).find(c => c.name === n).hex;
          return `<label class="color-pill" title="${esc(n)}"><input type="checkbox" name="color" value="${esc(n)}" ${filters.color.includes(n) ? 'checked' : ''}><i style="--c:${hex}"></i><span>${esc(n)}</span></label>`;
        }).join('')}</div>
      </details>
      <details open><summary>Цена, до</summary>
        <input type="range" id="priceRange" min="5000" max="${maxPrice}" step="500" value="${filters.price || maxPrice}">
        <div class="range-val"><span>5 000 ₽</span><b id="priceVal">${rub(filters.price || maxPrice)}</b></div>
      </details>
      <button class="btn btn--ghost btn--block" id="resetFilters">Сбросить фильтры</button>
    </aside>
    <div class="catalog__main">
      <div class="toolbar">
        <button class="btn btn--ghost btn--sm filters-open" id="filtersOpen">Фильтры</button>
        <span class="muted" id="found"></span>
        <label class="select"><span class="sr">Сортировка</span>
          <select id="sort">
            <option value="default">По умолчанию</option>
            <option value="new">Сначала новинки</option>
            <option value="asc">Цена: по возрастанию</option>
            <option value="desc">Цена: по убыванию</option>
            <option value="name">По названию</option>
          </select>
        </label>
      </div>
      <div class="grid" id="grid"></div>
    </div>
  </section>`;

  $('#sort').value = filters.sort;
  const apply = () => {
    let list = D.products.filter(p =>
      (!cat || (cat === 'sale' ? p.oldPrice : cat === 'new' ? p.isNew : p.cat === cat)) &&
      (!filters.brand.length || filters.brand.includes(p.brand)) &&
      (!filters.size.length || p.sizes.some(s => filters.size.includes(s))) &&
      (!filters.color.length || p.colors.some(c => filters.color.includes(c.name))) &&
      (!filters.price || p.price <= filters.price));
    const s = filters.sort;
    if (s === 'asc') list.sort((a, b) => a.price - b.price);
    if (s === 'desc') list.sort((a, b) => b.price - a.price);
    if (s === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    if (s === 'new') list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    $('#found').textContent = `${list.length} ${plural(list.length, ['товар', 'товара', 'товаров'])}`;
    $('#grid').innerHTML = list.length ? list.map(card).join('') :
      `<div class="empty"><p class="h3">Ничего не найдено</p><p class="muted">Попробуйте изменить параметры фильтра</p></div>`;
    observeReveals(); bindTilt();
  };
  $('#filters').addEventListener('change', e => {
    const t = e.target;
    if (['brand', 'size', 'color'].includes(t.name)) filters[t.name] = $$(`input[name="${t.name}"]:checked`).map(i => i.value);
    apply();
  });
  $('#priceRange').addEventListener('input', e => { filters.price = +e.target.value; $('#priceVal').textContent = rub(filters.price); apply(); });
  $('#sort').onchange = e => { filters.sort = e.target.value; apply(); };
  $('#resetFilters').onclick = () => { filters = { brand: [], size: [], color: [], price: null, sort: 'default' }; viewCatalog(cat); };
  $('#filtersOpen').onclick = () => $('#filters').classList.add('open');
  $('#filtersClose').onclick = () => $('#filters').classList.remove('open');
  apply();
}

/* ---------- Карточка товара ---------- */
function viewProduct(slug) {
  const p = bySlug(slug);
  if (!p) return view404();
  recent = [p.id, ...recent.filter(i => i !== p.id)].slice(0, 8); store.set('recent', recent);
  let color = 0, size = null, qty = 1;
  const sale = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const related = D.products.filter(x => x.id !== p.id && (x.cat === p.cat || x.brand === p.brand)).slice(0, 4);
  const recentList = recent.filter(i => i !== p.id).map(i => D.products.find(x => x.id === i)).filter(Boolean).slice(0, 4);

  app.innerHTML = `
  <section class="product">
    <div class="product__stage">
      <div class="viewer" id="viewer">
        <div class="viewer__ui">
          <span class="viewer__badge"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>360°</span>
          <div class="viewer__btns">
            <button class="icon-btn glass" id="vAuto" aria-pressed="true" title="Автоповорот"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button>
            <button class="icon-btn glass" id="vReset" title="Сбросить вид"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg></button>
            <button class="icon-btn glass" id="vFull" title="На весь экран"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
          </div>
        </div>
        <p class="viewer__hint">Потяните — вращение 360° · колесо — приближение</p>
      </div>
    </div>
    <div class="product__info">
      ${crumbs([['Каталог', '#/catalog'], [catName(p.cat), `#/catalog/${p.cat}`], [p.name]])}
      <p class="card__brand">${brandName(p.brand)}</p>
      <h1 class="product__title">${esc(p.name)}</h1>
      <p class="product__price">${rub(p.price)} ${p.oldPrice ? `<s>${rub(p.oldPrice)}</s><span class="tag tag--sale">−${sale}%</span>` : ''}</p>
      <p class="product__sku muted">Артикул: AN2-${String(p.id).padStart(4, '0')}</p>

      <div class="opt">
        <div class="opt__head"><span>Цвет: <b id="colorName">${esc(p.colors[0].name)}</b></span></div>
        <div class="swatches" id="colors">${p.colors.map((c, i) => `<button class="swatch ${i ? '' : 'on'}" style="--c:${c.hex}" data-i="${i}" aria-label="${esc(c.name)}" title="${esc(c.name)}"></button>`).join('')}</div>
      </div>
      <div class="opt">
        <div class="opt__head"><span>Размер</span><button class="link link--sm" data-sizes>Таблица размеров</button></div>
        <div class="sizes" id="sizes">${D.sizes.map(s => `<button class="size ${p.sizes.includes(s) ? '' : 'na'}" ${p.sizes.includes(s) ? '' : 'disabled'} data-s="${s}">${s}</button>`).join('')}</div>
      </div>
      <div class="buy">
        <div class="qty"><button id="qMinus" aria-label="Меньше">−</button><span id="qVal">1</span><button id="qPlus" aria-label="Больше">+</button></div>
        <button class="btn btn--primary btn--grow" id="addCart" data-magnetic>В корзину</button>
        <button class="fav fav--big ${favs.has(p.id) ? 'on' : ''}" data-fav="${p.id}" aria-label="В избранное"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button>
      </div>
      <button class="btn btn--ghost btn--block" id="oneClick">Купить в 1 клик</button>
      <ul class="perks">
        <li>Доставка ${D.shop.delivery} по Москве и России</li><li>Возврат в течение ${D.shop.returnDays} дней</li><li>Примерка в шоуруме</li><li>Консультация стилиста: <a href="tel:${D.shop.phoneRaw}">${D.shop.phone}</a></li>
      </ul>
      <div class="tabs">
        <div class="tabs__nav" role="tablist">
          <button class="on" data-tab="0" role="tab">Описание</button><button data-tab="1" role="tab">Состав и уход</button><button data-tab="2" role="tab">Доставка</button>
        </div>
        <div class="tabs__body">
          <div class="tab on"><p>${esc(p.desc)}</p></div>
          <div class="tab"><p>${esc(p.material)}</p><p class="muted">Деликатная химчистка. Гладить с изнаночной стороны через влажную ткань. Хранить на плечиках.</p></div>
          <div class="tab"><p>Доставка занимает ${D.shop.delivery}. По Москве — курьером, по России — транспортными компаниями и Почтой России. Если вещь не подошла — вернуть можно в течение ${D.shop.returnDays} дней.</p></div>
        </div>
      </div>
    </div>
  </section>
  ${related.length ? `<section class="section"><div class="section__head"><p class="eyebrow reveal">Вам может понравиться</p><h2 class="h2 reveal">Похожие модели</h2></div><div class="grid grid--4">${related.map(card).join('')}</div></section>` : ''}
  ${recentList.length ? `<section class="section"><div class="section__head"><p class="eyebrow reveal">История</p><h2 class="h2 reveal">Вы смотрели</h2></div><div class="grid grid--4">${recentList.map(card).join('')}</div></section>` : ''}
  `;

  const viewerEl = $('#viewer');
  const v = mountViewer(viewerEl, p, { autoRotate: true });

  $('#colors').onclick = e => {
    const b = e.target.closest('.swatch'); if (!b) return;
    color = +b.dataset.i;
    $$('.swatch', $('#colors')).forEach(s => s.classList.toggle('on', s === b));
    $('#colorName').textContent = p.colors[color].name;
    v.setColor(p.colors[color].hex);
  };
  $('#sizes').onclick = e => {
    const b = e.target.closest('.size:not(.na)'); if (!b) return;
    size = b.dataset.s;
    $$('.size', $('#sizes')).forEach(s => s.classList.toggle('on', s === b));
    $('#sizes').classList.remove('shake');
  };
  $('#qMinus').onclick = () => { qty = Math.max(1, qty - 1); $('#qVal').textContent = qty; };
  $('#qPlus').onclick = () => { qty = Math.min(10, qty + 1); $('#qVal').textContent = qty; };
  const needSize = () => {
    if (size) return false;
    const s = $('#sizes'); s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake');
    toast('Выберите размер'); return true;
  };
  $('#addCart').onclick = () => {
    if (needSize()) return;
    addToCart(p.id, size, p.colors[color].name, qty);
    flyToCart($('#addCart'));
    toast(`«${p.name}» добавлен в корзину`, 'Открыть', () => openDrawer('cart'));
  };
  $('#oneClick').onclick = () => { if (!needSize()) oneClickModal(p, size, p.colors[color].name); };

  let auto = true;
  $('#vAuto').onclick = e => { auto = !auto; v.setAutoRotate(auto); e.currentTarget.setAttribute('aria-pressed', auto); e.currentTarget.classList.toggle('off', !auto); };
  $('#vReset').onclick = () => v.resetView();
  $('#vFull').onclick = () => document.fullscreenElement ? document.exitFullscreen() : viewerEl.requestFullscreen?.();

  $$('.tabs__nav button').forEach(b => b.onclick = () => {
    $$('.tabs__nav button').forEach(x => x.classList.toggle('on', x === b));
    $$('.tab').forEach((t, i) => t.classList.toggle('on', i === +b.dataset.tab));
  });
}

/* ---------- Оформление заказа ---------- */
function viewCheckout() {
  if (!cart.length) {
    app.innerHTML = `<section class="page-head">${crumbs([['Оформление заказа']])}<h1 class="h1">Корзина пуста</h1><p class="muted">Добавьте товары из каталога.</p><a href="#/catalog" class="btn btn--primary">В каталог</a></section>`;
    return;
  }
  const total = cartTotal();
  app.innerHTML = `
  <section class="page-head">${crumbs([['Оформление заказа']])}<h1 class="h1">Оформление заказа</h1></section>
  <section class="checkout">
    <form class="form" id="orderForm" novalidate>
      <fieldset><legend>Контактные данные</legend>
        <div class="field"><input name="name" required placeholder=" " value="${esc(user?.name || '')}"><label>Имя и фамилия</label></div>
        <div class="field-row">
          <div class="field"><input name="phone" type="tel" required placeholder=" " value="${esc(user?.phone || '')}"><label>Телефон</label></div>
          <div class="field"><input name="email" type="email" placeholder=" " value="${esc(user?.email || '')}"><label>E-mail</label></div>
        </div>
      </fieldset>
      <fieldset><legend>Доставка</legend>
        <div class="radios">
          <label class="radio"><input type="radio" name="delivery" value="Курьер по Москве" checked><span><b>Курьер по Москве</b><small>${D.shop.delivery}</small></span></label>
          <label class="radio"><input type="radio" name="delivery" value="Транспортная компания"><span><b>Транспортная компания</b><small>по России</small></span></label>
          <label class="radio"><input type="radio" name="delivery" value="Самовывоз из шоурума"><span><b>Самовывоз</b><small>Андроновское шоссе</small></span></label>
        </div>
        <div class="field"><input name="address" placeholder=" "><label>Адрес доставки</label></div>
      </fieldset>
      <fieldset><legend>Оплата</legend>
        <div class="radios">
          <label class="radio"><input type="radio" name="payment" value="При получении" checked><span><b>При получении</b><small>наличными или картой</small></span></label>
          <label class="radio"><input type="radio" name="payment" value="Онлайн"><span><b>Онлайн</b><small>после подтверждения</small></span></label>
        </div>
      </fieldset>
      <div class="field"><textarea name="comment" rows="3" placeholder=" "></textarea><label>Комментарий к заказу</label></div>
      <label class="check"><input type="checkbox" name="agree" required checked><span>Согласен(на) на обработку персональных данных</span></label>
      <button class="btn btn--primary btn--block" type="submit">Отправить заказ · ${rub(total)}</button>
    </form>
    <aside class="summary">
      <p class="eyebrow">Ваш заказ</p>
      ${cart.map(i => { const p = D.products.find(x => x.id === i.id); return `<div class="summary__row"><div class="summary__img">${silhouette(p, p.colors.find(c => c.name === i.color)?.hex)}</div><div><b>${esc(p.name)}</b><small>${esc(i.color)} · ${i.size} · ${i.qty} шт.</small></div><span>${rub(p.price * i.qty)}</span></div>`; }).join('')}
      <div class="summary__total"><span>Итого</span><b>${rub(total)}</b></div>
    </aside>
  </section>`;

  $('#orderForm').onsubmit = e => {
    e.preventDefault();
    const f = e.target;
    if (!f.checkValidity()) { f.reportValidity(); return; }
    const data = Object.fromEntries(new FormData(f));
    const lines = cart.map(i => { const p = D.products.find(x => x.id === i.id); return `${p.name} (${i.color}, р. ${i.size}) × ${i.qty} = ${rub(p.price * i.qty)}`; });
    sendOrder('Заказ с сайта', [
      `Имя: ${data.name}`, `Телефон: ${data.phone}`, `E-mail: ${data.email || '—'}`,
      `Доставка: ${data.delivery}`, `Адрес: ${data.address || '—'}`, `Оплата: ${data.payment}`, `Комментарий: ${data.comment || '—'}`,
      '', ...lines, '', `Итого: ${rub(total)}`
    ]);
    cart = []; saveCart();
    app.innerHTML = `<section class="page-head thanks"><div class="thanks__icon">✓</div><h1 class="h1">Спасибо за заказ!</h1><p>Менеджер свяжется с вами в рабочее время (${D.shop.hours}) для подтверждения.</p><a href="#/catalog" class="btn btn--primary">Продолжить покупки</a></section>`;
    window.scrollTo({ top: 0 });
  };
}

/*
 * Отправка заявки. На боевом сайте здесь — вызов WooCommerce Store API
 * (POST /wp-json/wc/store/v1/checkout) или обработчика формы. В статической
 * версии открывается письмо на shop@an-2.ru с заполненным заказом.
 */
function sendOrder(subject, lines) {
  const body = encodeURIComponent(lines.join('\n'));
  window.location.href = `mailto:${D.shop.email}?subject=${encodeURIComponent(subject)}&body=${body}`;
}

/* ---------- Избранное ---------- */
function viewFavorites() {
  const list = D.products.filter(p => favs.has(p.id));
  app.innerHTML = `<section class="page-head">${crumbs([['Избранное']])}<h1 class="h1">Избранное</h1></section>
  <section class="section section--tight">${list.length ? `<div class="grid grid--4">${list.map(card).join('')}</div>` :
    `<div class="empty"><p class="h3">Здесь пока пусто</p><p class="muted">Нажмите ♡ на карточке товара, чтобы сохранить его.</p><a href="#/catalog" class="btn btn--primary">В каталог</a></div>`}</section>`;
}

/* ---------- Текстовые страницы ---------- */
function viewAbout() {
  app.innerHTML = `
  <section class="page-head">${crumbs([['О компании']])}<h1 class="h1">О компании</h1></section>
  <section class="section section--tight prose-grid">
    <div class="prose reveal">
      <p class="lead">Фирма «АН-2» — производитель женской одежды класса pret-a-porter. Основной ассортимент — жакеты, платья, костюмы, пальто.</p>
      <p>Компания работает под двумя марками: «AN-2» и «Natalia Slavina». Уже более 25 лет нашу одежду отличают отличный крой и безупречное качество пошива. Мы сами разрабатываем модели, строим лекала, подбираем ткани и контролируем каждый этап производства.</p>
      <p>Наша покупательница — современная женщина, которая ценит элегантность, удобство и качество. Размерный ряд от 42 до 56 позволяет каждой найти идеально сидящую вещь.</p>
      <p>Коллекции представлены в фирменных магазинах, в интернет-магазине и у партнёров по всей России.</p>
    </div>
    <div class="timeline reveal">
      ${[['Эскиз', 'Дизайнеры компании сами разрабатывают каждую модель'], ['Лекала', 'Конструкторы строят лекала под российскую фигуру, размеры 42–56'], ['Ткани', 'Подбираем качественные ткани: шерсть, твид, шёлк, вискозу, кружево'], ['Пошив', 'Отшиваем на собственном производстве в Москве'], ['Контроль', 'Проверяем посадку и качество каждой вещи перед продажей']]
        .map(([y, t]) => `<div class="timeline__item"><b>${y}</b><span>${t}</span></div>`).join('')}
    </div>
  </section>
  <section class="section stats stats--page">
    ${[['25+', 'лет на рынке'], ['2', 'собственных бренда'], ['42–56', 'размерный ряд'], ['100%', 'контроль качества']].map(([n, t]) => `<div class="stat reveal"><b>${n}</b><span>${t}</span></div>`).join('')}
  </section>`;
}

function viewHowToBuy() {
  app.innerHTML = `
  <section class="page-head">${crumbs([['Как купить']])}<h1 class="h1">Как купить</h1>
    <p class="lead">Оформить заказ можно на сайте, по телефону <a href="tel:${D.shop.phoneRaw}">${D.shop.phone}</a> или по электронной почте <a href="mailto:${D.shop.email}">${D.shop.email}</a>. Менеджеры помогут с выбором и оформлением заказа, согласуют доставку.</p>
  </section>
  ${howToBuySteps()}
  <section class="section section--tight faq">
    <div class="section__head"><p class="eyebrow">Вопросы и ответы</p><h2 class="h2">Доставка и оплата</h2></div>
    ${[
      ['Как выбрать размер?', 'Воспользуйтесь таблицей размеров. Если сомневаетесь между двумя размерами — позвоните нам, менеджер подскажет по конкретной модели.'],
      ['Какие способы доставки?', 'Курьером по Москве, транспортными компаниями и Почтой России по всей стране, самовывоз из шоурума.'],
      ['Как оплатить?', 'Наличными или картой при получении, либо онлайн после подтверждения заказа менеджером.'],
      ['Можно ли вернуть товар?', `Да, в течение ${D.shop.returnDays} дней, если вещь не подошла. Сохраните товарный вид и ярлыки.`],
      ['Когда со мной свяжутся?', `В рабочее время: ${D.shop.hours}. Заказы, оформленные в выходные, обрабатываются в понедельник.`]
    ].map(([q, a]) => `<details class="faq__item"><summary>${q}</summary><p>${a}</p></details>`).join('')}
    <button class="btn btn--ghost" data-sizes>Открыть таблицу размеров</button>
  </section>`;
}

function viewContacts() {
  app.innerHTML = `
  <section class="page-head">${crumbs([['Контакты']])}<h1 class="h1">Контакты</h1></section>
  <section class="section section--tight contacts">
    <div class="contacts__cards">
      <div class="contact reveal"><span class="eyebrow">Телефоны</span><b><a href="tel:${D.shop.phoneRaw}">${D.shop.phone}</a></b><b><a href="tel:${D.shop.phone2Raw}">${D.shop.phone2}</a></b><small>${D.shop.hours}</small></div>
      <a class="contact reveal" href="mailto:${D.shop.email}"><span class="eyebrow">E-mail</span><b>${D.shop.email}</b><small>Ответим в течение рабочего дня</small></a>
      <div class="contact reveal"><span class="eyebrow">Адрес</span><b>${D.shop.address}</b><small>Шоурум и офис</small></div>
    </div>
    <form class="form contacts__form reveal" id="callbackForm">
      <p class="eyebrow">Обратный звонок</p>
      <h2 class="h3">Оставьте телефон — мы перезвоним</h2>
      <div class="field"><input name="name" required placeholder=" "><label>Имя</label></div>
      <div class="field"><input name="phone" type="tel" required placeholder=" "><label>Телефон</label></div>
      <div class="field"><textarea name="msg" rows="3" placeholder=" "></textarea><label>Вопрос</label></div>
      <button class="btn btn--primary btn--block">Жду звонка</button>
    </form>
    <div class="map reveal">
      <iframe title="Карта" loading="lazy" src="https://yandex.ru/map-widget/v1/?text=${encodeURIComponent('Москва, Андроновское шоссе')}&z=14"></iframe>
    </div>
  </section>`;
  $('#callbackForm').onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    sendOrder('Обратный звонок', [`Имя: ${d.name}`, `Телефон: ${d.phone}`, `Вопрос: ${d.msg || '—'}`]);
    toast('Спасибо! Мы скоро перезвоним'); e.target.reset();
  };
}

function view404() {
  app.innerHTML = `<section class="page-head thanks"><h1 class="h1">404</h1><p>Страница не найдена</p><a href="#/" class="btn btn--primary">На главную</a></section>`;
}

/* ================= Корзина (выезжающая панель) ================= */
const cartTotal = () => cart.reduce((s, i) => s + (D.products.find(p => p.id === i.id)?.price || 0) * i.qty, 0);
function renderCart() {
  const items = $('#cartItems'), foot = $('#cartFoot');
  if (!cart.length) {
    items.innerHTML = `<div class="empty empty--cart"><p class="h3">Корзина пуста</p><p class="muted">Самое время выбрать что-нибудь красивое.</p></div>`;
    foot.innerHTML = `<a href="#/catalog" class="btn btn--primary btn--block" data-close>Перейти в каталог</a>`;
    return;
  }
  items.innerHTML = cart.map((i, k) => {
    const p = D.products.find(x => x.id === i.id);
    return `<div class="ci">
      <a href="#/product/${p.slug}" class="ci__img" data-close>${silhouette(p, p.colors.find(c => c.name === i.color)?.hex)}</a>
      <div class="ci__body">
        <a href="#/product/${p.slug}" data-close class="ci__name">${esc(p.name)}</a>
        <small>${esc(i.color)} · размер ${i.size}</small>
        <div class="qty qty--sm"><button data-q="${k}" data-d="-1">−</button><span>${i.qty}</span><button data-q="${k}" data-d="1">+</button></div>
      </div>
      <div class="ci__side"><b>${rub(p.price * i.qty)}</b><button class="link link--sm" data-rm="${k}">Удалить</button></div>
    </div>`;
  }).join('');
  foot.innerHTML = `<div class="summary__total"><span>Итого</span><b>${rub(cartTotal())}</b></div>
    <a href="#/checkout" class="btn btn--primary btn--block" data-close>Оформить заказ</a>
    <p class="muted center">или по телефону <a href="tel:${D.shop.phoneRaw}">${D.shop.phone}</a></p>`;
}
$('#cartItems').addEventListener('click', e => {
  const q = e.target.closest('[data-q]'), rm = e.target.closest('[data-rm]');
  if (q) { const it = cart[+q.dataset.q]; it.qty = Math.max(1, Math.min(10, it.qty + +q.dataset.d)); saveCart(); }
  if (rm) { cart.splice(+rm.dataset.rm, 1); saveCart(); }
});

/* ================= Панели, модалки, поиск ================= */
function openDrawer(id) {
  closeAll();
  $('#' + id).classList.add('open'); $('#' + id).setAttribute('aria-hidden', 'false');
  $('#overlay').classList.add('on'); document.body.classList.add('lock');
}
function closeAll() {
  $$('.drawer.open, .search.open, .modal.open').forEach(el => { el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); });
  $('#overlay').classList.remove('on'); document.body.classList.remove('lock');
  if (modalViewer) { modalViewer.dispose(); modalViewer = null; }
}
let modalViewer = null;
function openModal(html, cls = '') {
  closeAll();
  $('#modalBody').innerHTML = html;
  $('#modal').className = 'modal open ' + cls; $('#modal').setAttribute('aria-hidden', 'false');
  document.body.classList.add('lock');
}

function sizesModal() {
  const rows = [['42', '84', '66', '92'], ['44', '88', '70', '96'], ['46', '92', '74', '100'], ['48', '96', '78', '104'], ['50', '100', '82', '108'], ['52', '104', '86', '112'], ['54', '108', '90', '116'], ['56', '112', '94', '120']];
  openModal(`<p class="eyebrow">Помощь с выбором</p><h2 class="h2">Таблица размеров</h2>
    <div class="table-wrap"><table class="table"><thead><tr><th>Размер</th><th>Обхват груди, см</th><th>Обхват талии, см</th><th>Обхват бёдер, см</th></tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <p class="muted">Рост модели 164–170 см. Если параметры попадают между размерами — выбирайте больший или позвоните нам: ${D.shop.phone}.</p>`);
}

function oneClickModal(p, size, color) {
  openModal(`<p class="eyebrow">Купить в 1 клик</p><h2 class="h3">${esc(p.name)}</h2><p class="muted">${esc(color)} · размер ${size} · ${rub(p.price)}</p>
    <form class="form" id="ocForm"><div class="field"><input name="name" required placeholder=" " value="${esc(user?.name || '')}"><label>Имя</label></div>
    <div class="field"><input name="phone" type="tel" required placeholder=" " value="${esc(user?.phone || '')}"><label>Телефон</label></div>
    <button class="btn btn--primary btn--block">Отправить</button></form>`);
  $('#ocForm').onsubmit = e => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
    sendOrder('Заказ в 1 клик', [`Имя: ${d.name}`, `Телефон: ${d.phone}`, `Товар: ${p.name} (${color}, р. ${size}) — ${rub(p.price)}`]);
    closeAll(); toast('Заявка отправлена. Мы перезвоним!');
  };
}

function quickView(id) {
  const p = D.products.find(x => x.id === id);
  openModal(`<div class="qv"><div class="qv__stage" id="qvStage"></div><div class="qv__info">
    <p class="card__brand">${brandName(p.brand)}</p><h2 class="h2">${esc(p.name)}</h2><p class="product__price">${rub(p.price)} ${p.oldPrice ? `<s>${rub(p.oldPrice)}</s>` : ''}</p>
    <p>${esc(p.desc)}</p>
    <div class="swatches" id="qvColors">${p.colors.map((c, i) => `<button class="swatch ${i ? '' : 'on'}" style="--c:${c.hex}" data-i="${i}" title="${esc(c.name)}" aria-label="${esc(c.name)}"></button>`).join('')}</div>
    <a href="#/product/${p.slug}" class="btn btn--primary btn--block" data-close>Подробнее и купить</a></div></div>`, 'modal--wide');
  const stage = $('#qvStage');
  if (p.frames?.length) modalViewer = createFrameViewer(stage, p.frames);
  else if (HAS_GL) { modalViewer = createGarmentViewer(stage, { autoRotate: true }); modalViewer.setProduct(p); }
  else stage.innerHTML = `<div class="fallback-spin">${silhouette(p)}</div>`;
  $('#qvColors').onclick = e => {
    const b = e.target.closest('.swatch'); if (!b) return;
    $$('.swatch', $('#qvColors')).forEach(s => s.classList.toggle('on', s === b));
    modalViewer?.setColor(p.colors[+b.dataset.i].hex);
  };
}

/*
 * Личный кабинет. На боевом сайте ведёт на /my-account/ WooCommerce.
 * В статической версии — локальный профиль для автозаполнения заказа.
 */
function accountModal() {
  if (user) {
    openModal(`<p class="eyebrow">Личный кабинет</p><h2 class="h2">Здравствуйте, ${esc(user.name)}</h2>
      <ul class="account-links">
        <li><a href="#/favorites" data-close>Избранное <b>${favs.size}</b></a></li>
        <li><button data-open-cart>Корзина <b>${cart.reduce((s, i) => s + i.qty, 0)}</b></button></li>
        <li><span>Телефон</span><b>${esc(user.phone || '—')}</b></li><li><span>E-mail</span><b>${esc(user.email)}</b></li>
      </ul>
      <button class="btn btn--ghost btn--block" id="logout">Выйти</button>`);
    $('#logout').onclick = () => { user = null; store.set('user', null); closeAll(); toast('Вы вышли из аккаунта'); };
    return;
  }
  openModal(`<div class="auth">
    <div class="auth__tabs"><button class="on" data-at="login">Вход</button><button data-at="reg">Регистрация</button></div>
    <form class="form" id="authForm" data-mode="login">
      <div class="field reg-only"><input name="name" placeholder=" "><label>Имя</label></div>
      <div class="field"><input name="email" type="email" required placeholder=" "><label>E-mail</label></div>
      <div class="field reg-only"><input name="phone" type="tel" placeholder=" "><label>Телефон</label></div>
      <div class="field"><input name="password" type="password" required minlength="4" placeholder=" "><label>Пароль</label></div>
      <button class="btn btn--primary btn--block" id="authBtn">Войти</button>
      <p class="muted center"><a href="mailto:${D.shop.email}?subject=Восстановление пароля">Забыли пароль?</a></p>
    </form></div>`);
  const form = $('#authForm');
  $$('[data-at]').forEach(b => b.onclick = () => {
    $$('[data-at]').forEach(x => x.classList.toggle('on', x === b));
    form.dataset.mode = b.dataset.at; $('#authBtn').textContent = b.dataset.at === 'reg' ? 'Зарегистрироваться' : 'Войти';
  });
  form.onsubmit = e => {
    e.preventDefault(); if (!form.checkValidity()) return form.reportValidity();
    const d = Object.fromEntries(new FormData(form));
    user = { name: d.name || d.email.split('@')[0], email: d.email, phone: d.phone || '' };
    store.set('user', user); closeAll(); toast(`Добро пожаловать, ${user.name}!`);
  };
}

/* Поиск */
function searchOpen() {
  closeAll();
  $('#search').classList.add('open'); $('#search').setAttribute('aria-hidden', 'false'); document.body.classList.add('lock');
  $('#searchHints').innerHTML = ['Платье', 'Жакет', 'Шерсть', 'Твид', 'Пальто', 'Шёлк'].map(h => `<button class="chip" data-hint="${h}">${h}</button>`).join('');
  setTimeout(() => $('#searchInput').focus(), 200);
  doSearch($('#searchInput').value);
}
function doSearch(q) {
  q = q.trim().toLowerCase().replace(/ё/g, 'е');
  const norm = s => s.toLowerCase().replace(/ё/g, 'е');
  const res = q ? D.products.filter(p => norm([p.name, p.desc, p.material, catName(p.cat), brandName(p.brand), ...p.colors.map(c => c.name)].join(' ')).includes(q)) : [];
  $('#searchResults').innerHTML = !q ? '' : res.length
    ? res.map(p => `<a href="#/product/${p.slug}" class="sr-item" data-close><div class="sr-item__img">${silhouette(p)}</div><div><b>${esc(p.name)}</b><small>${catName(p.cat)} · ${brandName(p.brand)}</small></div><span>${rub(p.price)}</span></a>`).join('')
    : `<p class="muted">По запросу «${esc(q)}» ничего не найдено</p>`;
}
$('#searchInput').addEventListener('input', e => doSearch(e.target.value));
$('#searchHints').addEventListener('click', e => { const h = e.target.closest('[data-hint]'); if (h) { $('#searchInput').value = h.dataset.hint; doSearch(h.dataset.hint); } });

/* ================= Эффекты ================= */
function toast(msg, action, fn) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action)}</button>` : ''}`;
  if (action) t.querySelector('button').onclick = () => { fn(); t.remove(); };
  $('#toasts').appendChild(t);
  requestAnimationFrame(() => t.classList.add('on'));
  setTimeout(() => { t.classList.remove('on'); setTimeout(() => t.remove(), 400); }, 3200);
}

function flyToCart(from) {
  const a = from.getBoundingClientRect(), b = $('#cartOpen').getBoundingClientRect();
  const dot = document.createElement('div'); dot.className = 'fly';
  dot.style.left = a.left + a.width / 2 + 'px'; dot.style.top = a.top + a.height / 2 + 'px';
  document.body.appendChild(dot);
  dot.animate([{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: `translate(${b.left - a.left - a.width / 2 + b.width / 2}px, ${b.top - a.top - a.height / 2 + b.height / 2}px) translate(-50%,-50%) scale(.3)`, opacity: .6 }],
    { duration: 700, easing: 'cubic-bezier(.5,-0.3,.3,1)' }).onfinish = () => { dot.remove(); $('#cartOpen').animate([{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], 300); };
}

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let revealIO;
function observeReveals() {
  revealIO ??= new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal:not(.in), .hero__title').forEach(el => revealIO.observe(el));
}

function lazy(el, fn) {
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); fn(el); } }, { rootMargin: '200px' });
  io.observe(el);
}

function bindTilt() {
  if (reduced || matchMedia('(hover: none)').matches) return;
  $$('[data-tilt]:not([data-tilt-on])').forEach(el => {
    el.dataset.tiltOn = 1;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.setProperty('--rx', (-y * 8) + 'deg'); el.style.setProperty('--ry', (x * 10) + 'deg');
      el.style.setProperty('--mx', (x + .5) * 100 + '%'); el.style.setProperty('--my', (y + .5) * 100 + '%');
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  });
}

function bindMagnetic() {
  if (reduced || matchMedia('(hover: none)').matches) return;
  $$('[data-magnetic]').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
    });
    el.addEventListener('pointerleave', () => (el.style.transform = ''));
  });
}

// Кастомный курсор
(() => {
  const c = $('.cursor');
  if (reduced || matchMedia('(hover: none)').matches) { c.remove(); return; }
  let x = -100, y = -100, cx = x, cy = y;
  window.addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; c.classList.add('on'); }, { passive: true });
  document.addEventListener('pointerover', e => {
    const t = e.target;
    c.classList.toggle('grab', !!t.closest('.viewer, .hero__viewer, .feature3d__stage, .qv__stage'));
    c.classList.toggle('hover', !!t.closest('a, button, label, select, summary'));
  });
  (function f() { cx += (x - cx) * .2; cy += (y - cy) * .2; c.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(f); })();
})();

// Шапка: прячется при прокрутке вниз
let lastY = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY, h = $('#header');
  h.classList.toggle('scrolled', y > 30);
  h.classList.toggle('hide', y > lastY && y > 300 && !document.body.classList.contains('lock'));
  lastY = y;
}, { passive: true });

/* ================= Глобальные обработчики ================= */
document.addEventListener('click', e => {
  const t = e.target;
  const fav = t.closest('[data-fav]'); if (fav) { e.preventDefault(); toggleFav(+fav.dataset.fav); return; }
  const qv = t.closest('[data-quick]'); if (qv) { e.preventDefault(); quickView(+qv.dataset.quick); return; }
  if (t.closest('[data-sizes]')) { e.preventDefault(); sizesModal(); return; }
  if (t.closest('[data-open-cart]')) { openDrawer('cart'); return; }
  if (t.closest('[data-close]') || t.id === 'overlay' || t.id === 'modal') closeAll();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAll();
  if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); searchOpen(); }
});
$('#cartOpen').onclick = () => openDrawer('cart');
$('#searchOpen').onclick = searchOpen;
$('#accountOpen').onclick = accountModal;
$('#burger').onclick = () => openDrawer('menu');
$('#subscribeForm').onsubmit = e => { e.preventDefault(); toast('Спасибо! Вы подписаны на новости'); e.target.reset(); };

$('#menuList').innerHTML = [['Каталог', '#/catalog'], ...D.categories.map(c => [c.name, '#/catalog/' + c.slug]), ['Новинки', '#/catalog/new'], ['Sale', '#/catalog/sale'], ['О компании', '#/about'], ['Как купить', '#/how-to-buy'], ['Контакты', '#/contacts'], ['Избранное', '#/favorites']]
  .map(([t, h], i) => `<a href="${h}" data-close style="--i:${i}">${t}</a>`).join('');
$('#footerCats').innerHTML = D.categories.map(c => `<li><a href="#/catalog/${c.slug}">${c.name}</a></li>`).join('');
$('#year').textContent = new Date().getFullYear();

/* ================= Роутер ================= */
function plural(n, [one, few, many]) {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? few : many;
}

function route() {
  const raw = location.hash.replace(/^#/, '') || '/';
  if (!raw.startsWith('/')) return; // якорь внутри страницы
  const [path, query] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  disposeViewers(); closeAll();
  document.body.dataset.page = parts[0] || 'home';
  app.classList.remove('page-in'); void app.offsetWidth; app.classList.add('page-in');

  switch (parts[0]) {
    case undefined: viewHome(); break;
    case 'catalog': viewCatalog(parts[1], query); break;
    case 'product': viewProduct(parts[1]); break;
    case 'checkout': viewCheckout(); break;
    case 'favorites': viewFavorites(); break;
    case 'about': viewAbout(); break;
    case 'how-to-buy': viewHowToBuy(); break;
    case 'contacts': viewContacts(); break;
    default: view404();
  }
  $$('.nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + path));
  const titles = { catalog: 'Каталог', product: bySlug(parts[1])?.name, checkout: 'Оформление заказа', favorites: 'Избранное', about: 'О компании', 'how-to-buy': 'Как купить', contacts: 'Контакты' };
  document.title = (titles[parts[0]] ? titles[parts[0]] + ' — ' : '') + 'AN-2 — дизайнерская женская одежда';
  window.scrollTo({ top: 0, behavior: 'instant' });
  observeReveals(); bindTilt(); bindMagnetic();
}

// Переход по якорю «#cats» не должен ломать роутер
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (a && !a.getAttribute('href').startsWith('#/') && a.getAttribute('href').length > 1) {
    e.preventDefault(); document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
  }
});

window.addEventListener('hashchange', route);
renderCart(); updateBadges(); route();
requestAnimationFrame(() => document.body.classList.add('ready'));
