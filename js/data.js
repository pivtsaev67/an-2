/*
 * Данные каталога.
 * Категории, slug-и (совпадают с URL на an-2.ru), названия товаров и диапазоны цен
 * взяты с сайта через поисковую выдачу. Цвета, размеры, составы и описания —
 * примерные: их нужно сверить с сайтом или выгрузкой WooCommerce (Товары → Экспорт).
 *
 * Поля товара:
 *   type    — силуэт для 3D-примерки: dress | sundress | jacket | coat | suit | skirt | blouse | trousers
 *   fabric  — фактура ткани в 3D: wool | tweed | silk | lace | felt | suede | crepe | stripe | geo
 *   frames  — (необязательно) массив путей к кадрам 360° (24–36 фото на поворотном столе)
 *   model   — (необязательно) путь к .glb модели (CLO3D / Marvelous Designer / Blender)
 *   images  — (необязательно) обычные фотографии товара
 *   url     — страница товара на текущем сайте (для сверки)
 */
window.AN2 = {
  shop: {
    name: 'AN-2',
    phone: '+7 (495) 259-64-33',
    phoneRaw: '+74952596433',
    phone2: '+7 (495) 966-34-41',
    phone2Raw: '+74959663441',
    email: 'shop@an-2.ru',
    address: 'Москва, Андроновское шоссе',
    hours: 'Пн–Пт, 10:00–18:00',
    delivery: '2–3 дня',
    returnDays: 14
  },

  // slug-и как в адресах an-2.ru/product-category/<slug>/
  categories: [
    { slug: 'platya',   name: 'Платья' },
    { slug: 'zhakety',  name: 'Жакеты' },
    { slug: 'kostjumy', name: 'Костюмы' },
    { slug: 'jubki',    name: 'Юбки' },
    { slug: 'bluzki',   name: 'Блузки' }
  ],

  brands: [
    { slug: 'an-2',            name: 'AN-2' },
    { slug: 'natalya-slavina', name: 'Natalia Slavina' }
  ],

  sizes: ['42', '44', '46', '48', '50', '52', '54', '56'],

  products: [
    /* ---------- Платья: 9 100 – 13 900 ₽ ---------- */
    { id: 1, slug: 'plate-dvubortnoe-3', url: 'https://an-2.ru/shop/platya/plate-dvubortnoe-3/', name: 'Платье двубортное', cat: 'platya', brand: 'an-2', type: 'dress', fabric: 'wool', buttons: true,
      price: 12900, sizes: ['44','46','48','50','52'], isNew: true,
      colors: [{ name: 'Графит', hex: '#2f3033' }, { name: 'Бордо', hex: '#5c1a22' }, { name: 'Кэмел', hex: '#b08457' }],
      material: 'Костюмная шерсть с эластаном. Подкладка — вискоза.',
      desc: 'Приталенное платье-футляр с двубортной застёжкой на пуговицы. Длина до колена, отложной воротник.' },
    { id: 2, slug: 'plate-shelkovoe', url: 'https://an-2.ru/shop/platya/plate-shelkovoe/', name: 'Платье шелковое', cat: 'platya', brand: 'natalya-slavina', type: 'dress', fabric: 'silk',
      price: 13900, sizes: ['42','44','46','48','50'], isNew: true,
      colors: [{ name: 'Изумруд', hex: '#1f4d43' }, { name: 'Пудра', hex: '#d9b8ad' }, { name: 'Чёрный', hex: '#151515' }],
      material: 'Шёлк с эластаном.',
      desc: 'Струящееся платье из шёлка с мягкой драпировкой. Для вечерних выходов и особых событий.' },
    { id: 3, slug: 'plate-s-bantom', url: 'https://an-2.ru/shop/platya/plate-s-bantom/', name: 'Платье с бантом', cat: 'platya', brand: 'an-2', type: 'dress', fabric: 'crepe',
      price: 11500, sizes: ['44','46','48','50','52','54'], isNew: true,
      colors: [{ name: 'Тёмно-синий', hex: '#1f2638' }, { name: 'Чёрный', hex: '#161618' }],
      material: 'Креп: полиэстер, вискоза, эластан.',
      desc: 'Платье прямого силуэта с завязкой-бантом у горловины. Уместно и в офисе, и на празднике.' },
    { id: 4, slug: 'plate-iz-viskozy-4', url: 'https://an-2.ru/shop/platya/plate-iz-viskozy-4/', name: 'Платье из вискозы', cat: 'platya', brand: 'an-2', type: 'dress', fabric: 'silk',
      price: 9100, sizes: ['46','48','50','52','54','56'],
      colors: [{ name: 'Терракота', hex: '#9a4b35' }, { name: 'Олива', hex: '#55583c' }],
      material: 'Вискоза.',
      desc: 'Лёгкое летнее платье из мягкой вискозы с расклешённой юбкой.' },
    { id: 5, slug: 'plate-na-molnii', name: 'Платье на молнии', cat: 'platya', brand: 'an-2', type: 'dress', fabric: 'wool', zip: true,
      price: 11300, sizes: ['44','46','48','50','52'],
      colors: [{ name: 'Тёмно-серый', hex: '#3c3d40' }, { name: 'Синий', hex: '#233257' }],
      material: 'Костюмная ткань: шерсть, полиэстер, эластан.',
      desc: 'Платье-футляр с металлической молнией по всей длине переда.' },
    { id: 6, slug: 'naryadnoe-plate', name: 'Нарядное платье', cat: 'platya', brand: 'natalya-slavina', type: 'dress', fabric: 'lace',
      price: 13900, sizes: ['44','46','48','50'],
      colors: [{ name: 'Чёрный', hex: '#1a1a1c' }, { name: 'Бордо', hex: '#5a1b24' }],
      material: 'Кружево на подкладке.',
      desc: 'Вечернее кружевное платье на контрастной подкладке.' },

    /* ---------- Костюмы: жакеты 11 500 – 13 900 ₽, юбки 5 900 – 6 700 ₽ ---------- */
    { id: 7, slug: 'ofisnoe-plate-4', url: 'https://an-2.ru/shop/kostjumy/ofisnoe-plate-4/', name: 'Офисное платье', cat: 'kostjumy', brand: 'an-2', type: 'dress', fabric: 'wool', buttons: true,
      price: 10500, sizes: ['46','48','50','52','54'],
      colors: [{ name: 'Серый', hex: '#6d6e71' }, { name: 'Тёмно-синий', hex: '#1f2638' }],
      material: 'Костюмная шерсть с эластаном.',
      desc: 'Строгое платье из костюмной ткани: носится само по себе или с жакетом из той же коллекции.' },
    { id: 8, slug: 'kostyum-tvidovyj', name: 'Костюм твидовый', cat: 'kostjumy', brand: 'natalya-slavina', type: 'suit', fabric: 'tweed', buttons: true,
      price: 20600, sizes: ['44','46','48','50','52'], isNew: true,
      colors: [{ name: 'Серо-розовый', hex: '#a88f8f' }, { name: 'Синий меланж', hex: '#3b4660' }],
      material: 'Твид: шерсть, хлопок, полиакрил.',
      desc: 'Укороченный жакет без воротника (13 900 ₽) и прямая юбка (6 700 ₽). Отделка тесьмой.' },
    { id: 9, slug: 'kostyum-klassicheskij', name: 'Костюм классический', cat: 'kostjumy', brand: 'an-2', type: 'suit', fabric: 'wool', buttons: true,
      price: 17400, sizes: ['46','48','50','52','54','56'],
      colors: [{ name: 'Тёмно-синий', hex: '#1f2638' }, { name: 'Серый', hex: '#6d6e71' }],
      material: 'Костюмная шерсть, вискоза, эластан.',
      desc: 'Приталенный жакет на одну пуговицу (11 500 ₽) и юбка-карандаш (5 900 ₽).' },

    /* ---------- Жакеты: 11 500 – 13 900 ₽ ---------- */
    { id: 10, slug: 'zhaket-iz-sherstyanogo-fetra', name: 'Жакет из шерстяного фетра', cat: 'zhakety', brand: 'natalya-slavina', type: 'jacket', fabric: 'felt', buttons: true,
      price: 13900, sizes: ['44','46','48','50','52','54'], isNew: true,
      colors: [{ name: 'Молочный', hex: '#e7e0d3' }, { name: 'Антрацит', hex: '#3a3a3c' }],
      material: 'Шерстяной фетр.',
      desc: 'Жакет прямого силуэта из плотного шерстяного фетра. Держит форму, срезы обработаны вручную.' },
    { id: 11, slug: 'zhaket-s-kruzhevom', name: 'Жакет с кружевом', cat: 'zhakety', brand: 'an-2', type: 'jacket', fabric: 'lace',
      price: 12900, oldPrice: 15900, sizes: ['46','48','50','52'],
      colors: [{ name: 'Чёрный', hex: '#1a1a1c' }, { name: 'Слоновая кость', hex: '#efe8da' }],
      material: 'Кружево, подкладка — ацетат.',
      desc: 'Нарядный жакет с кружевной отделкой. Застёжка на потайной крючок.' },
    { id: 12, slug: 'zhaket-s-otdelkoj-zamshej', name: 'Жакет с отделкой замшей', cat: 'zhakety', brand: 'an-2', type: 'jacket', fabric: 'suede', buttons: true,
      price: 11900, sizes: ['48','50','52','54','56'],
      colors: [{ name: 'Табак', hex: '#6b4a32' }, { name: 'Олива', hex: '#4f5237' }],
      material: 'Шерсть с эластаном, отделка — замша.',
      desc: 'Жакет с контрастными вставками из замши на карманах и воротнике.' },

    /* ---------- Юбки: 5 900 – 6 700 ₽ ---------- */
    { id: 13, slug: 'yubka-karandash', name: 'Юбка-карандаш', cat: 'jubki', brand: 'an-2', type: 'skirt', fabric: 'crepe',
      price: 5900, sizes: ['42','44','46','48','50','52','54'],
      colors: [{ name: 'Чёрный', hex: '#161618' }, { name: 'Бордо', hex: '#5a1b24' }],
      material: 'Креп: полиэстер, вискоза, эластан.',
      desc: 'Юбка-карандаш с высокой посадкой и шлицей сзади.' },
    { id: 14, slug: 'yubka-tvidovaya', name: 'Юбка твидовая', cat: 'jubki', brand: 'natalya-slavina', type: 'skirt', fabric: 'tweed',
      price: 6700, oldPrice: 7900, sizes: ['44','46','48','50'],
      colors: [{ name: 'Бежевый меланж', hex: '#b9a58c' }],
      material: 'Твид: шерсть, хлопок, полиакрил.',
      desc: 'Прямая юбка из фактурного твида с бахромой по низу.' },

    /* ---------- Блузки: 4 900 – 9 200 ₽ ---------- */
    { id: 15, slug: 'bluzka-v-polosku', url: 'https://an-2.ru/shop/bluzki/bluzka-v-polosku/', name: 'Блузка в полоску', cat: 'bluzki', brand: 'an-2', type: 'blouse', fabric: 'stripe',
      price: 5900, sizes: ['44','46','48','50','52'], isNew: true,
      colors: [{ name: 'Синий', hex: '#2c3d6b' }, { name: 'Чёрный', hex: '#1b1b1d' }],
      material: 'Хлопок с вискозой.',
      desc: 'Свободная блузка в вертикальную полоску с коротким рукавом.' },
    { id: 16, slug: 'bluzka-s-geometricheskim-risunkom', name: 'Блузка с геометрическим рисунком', cat: 'bluzki', brand: 'an-2', type: 'blouse', fabric: 'geo',
      price: 4900, sizes: ['44','46','48','50','52','54'],
      colors: [{ name: 'Бордо', hex: '#6a2430' }, { name: 'Изумруд', hex: '#1f4d43' }],
      material: 'Вискоза.',
      desc: 'Блузка с графичным геометрическим принтом.' },
    { id: 17, slug: 'bluzka-s-kruzhevom', name: 'Блузка с кружевом', cat: 'bluzki', brand: 'natalya-slavina', type: 'blouse', fabric: 'lace',
      price: 5500, sizes: ['42','44','46','48','50'],
      colors: [{ name: 'Айвори', hex: '#f1ebdf' }, { name: 'Чёрный', hex: '#1a1a1c' }],
      material: 'Кружево, подкладка.',
      desc: 'Женственная блузка с кружевом.' },
    { id: 18, slug: 'bluzka-shelkovaya', name: 'Блузка шелковая', cat: 'bluzki', brand: 'natalya-slavina', type: 'blouse', fabric: 'silk',
      price: 9200, sizes: ['42','44','46','48','50'],
      colors: [{ name: 'Айвори', hex: '#f1ebdf' }, { name: 'Пыльная роза', hex: '#c79c96' }],
      material: 'Шёлк с эластаном.',
      desc: 'Блузка из шёлка свободного кроя. Мягкий вырез, потайная застёжка.' }
  ]
};
