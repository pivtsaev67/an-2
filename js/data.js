/*
 * Данные каталога.
 * Сейчас здесь демонстрационный набор. При подключении к WooCommerce этот файл
 * заменяется на выгрузку из REST API (/wp-json/wc/store/v1/products) — см. README.
 *
 * Поля товара:
 *   type    — силуэт для 3D-примерки: dress | sundress | jacket | coat | suit | skirt | blouse | trousers
 *   fabric  — фактура ткани в 3D: wool | tweed | silk | lace | felt | suede | crepe
 *   frames  — (необязательно) массив путей к кадрам 360° (24–36 фото на поворотном столе)
 *   model   — (необязательно) путь к .glb модели (CLO3D / Marvelous Designer / Blender)
 *   images  — (необязательно) обычные фотографии товара
 */
window.AN2 = {
  shop: {
    name: 'AN-2',
    phone: '+7 (495) 966-34-41',
    phoneRaw: '+74959663441',
    email: 'shop@an-2.ru',
    address: 'Москва, Андроновское шоссе',
    hours: 'Пн–Пт, 10:00–18:00'
  },

  categories: [
    { slug: 'platya',    name: 'Платья' },
    { slug: 'zhakety',   name: 'Жакеты' },
    { slug: 'kostyumy',  name: 'Костюмы' },
    { slug: 'palto',     name: 'Пальто' },
    { slug: 'yubki',     name: 'Юбки' },
    { slug: 'sarafany',  name: 'Сарафаны' },
    { slug: 'bluzy',     name: 'Блузы' },
    { slug: 'bryuki',    name: 'Брюки' }
  ],

  brands: [
    { slug: 'an-2',              name: 'AN-2' },
    { slug: 'natalya-slavina',   name: 'Natalia Slavina' }
  ],

  sizes: ['42', '44', '46', '48', '50', '52', '54', '56'],

  products: [
    { id: 1,  slug: 'plate-dvubortnoe', name: 'Платье двубортное', cat: 'platya', brand: 'an-2', type: 'dress', fabric: 'wool', buttons: true,
      price: 18900, sizes: ['44','46','48','50','52'], isNew: true,
      colors: [{ name: 'Графит', hex: '#2f3033' }, { name: 'Бордо', hex: '#5c1a22' }, { name: 'Кэмел', hex: '#b08457' }],
      material: 'Шерсть 70%, полиэстер 28%, эластан 2%. Подкладка — вискоза.',
      desc: 'Приталенное платье-футляр с двубортной застёжкой на пуговицы. Длина до колена, втачной рукав, отложной воротник.' },
    { id: 2,  slug: 'plate-shelkovoe', name: 'Платье шелковое', cat: 'platya', brand: 'natalya-slavina', type: 'dress', fabric: 'silk',
      price: 21500, sizes: ['42','44','46','48'], isNew: true,
      colors: [{ name: 'Изумруд', hex: '#1f4d43' }, { name: 'Пудра', hex: '#d9b8ad' }, { name: 'Чёрный', hex: '#151515' }],
      material: 'Натуральный шёлк 92%, эластан 8%.',
      desc: 'Струящееся платье из натурального шёлка с мягкой драпировкой по талии. Для вечерних выходов и особых событий.' },
    { id: 3,  slug: 'zhaket-iz-sherstyanogo-fetra', name: 'Жакет из шерстяного фетра', cat: 'zhakety', brand: 'natalya-slavina', type: 'jacket', fabric: 'felt', buttons: true,
      price: 16400, sizes: ['44','46','48','50','52','54'],
      colors: [{ name: 'Молочный', hex: '#e7e0d3' }, { name: 'Антрацит', hex: '#3a3a3c' }],
      material: 'Шерстяной фетр: шерсть 80%, полиамид 20%.',
      desc: 'Жакет прямого силуэта из плотного шерстяного фетра. Держит форму, не требует подкладки, обработка срезов вручную.' },
    { id: 4,  slug: 'zhaket-s-kruzhevom', name: 'Жакет с кружевом', cat: 'zhakety', brand: 'an-2', type: 'jacket', fabric: 'lace',
      price: 17800, oldPrice: 22200, sizes: ['46','48','50','52'],
      colors: [{ name: 'Чёрный', hex: '#1a1a1c' }, { name: 'Слоновая кость', hex: '#efe8da' }],
      material: 'Кружево: хлопок 60%, полиамид 40%. Подкладка — ацетат.',
      desc: 'Нарядный жакет с кружевной отделкой полочек и рукавов. Застёжка на потайной крючок.' },
    { id: 5,  slug: 'zhaket-s-otdelkoj-zamshej', name: 'Жакет с отделкой замшей', cat: 'zhakety', brand: 'an-2', type: 'jacket', fabric: 'suede', buttons: true,
      price: 19600, sizes: ['48','50','52','54','56'], isNew: true,
      colors: [{ name: 'Табак', hex: '#6b4a32' }, { name: 'Олива', hex: '#4f5237' }],
      material: 'Шерсть 55%, полиэстер 43%, эластан 2%. Отделка — натуральная замша.',
      desc: 'Жакет с контрастными вставками из натуральной замши на карманах и воротнике.' },
    { id: 6,  slug: 'kostyum-tvidovyj', name: 'Костюм твидовый', cat: 'kostyumy', brand: 'natalya-slavina', type: 'suit', fabric: 'tweed', buttons: true,
      price: 32900, sizes: ['44','46','48','50','52'],
      colors: [{ name: 'Серо-розовый', hex: '#a88f8f' }, { name: 'Синий меланж', hex: '#3b4660' }],
      material: 'Твид: шерсть 45%, хлопок 30%, полиакрил 25%.',
      desc: 'Костюм из фактурного твида: укороченный жакет без воротника и прямая юбка. Отделка тесьмой.' },
    { id: 7,  slug: 'kostyum-klassicheskij', name: 'Костюм классический', cat: 'kostyumy', brand: 'an-2', type: 'suit', fabric: 'wool', buttons: true,
      price: 29800, oldPrice: 36500, sizes: ['46','48','50','52','54','56'],
      colors: [{ name: 'Тёмно-синий', hex: '#1f2638' }, { name: 'Серый', hex: '#6d6e71' }],
      material: 'Костюмная шерсть 60%, вискоза 38%, эластан 2%.',
      desc: 'Классический костюм: приталенный жакет на одну пуговицу и юбка-карандаш. Базовый элемент деловой капсулы.' },
    { id: 8,  slug: 'palto-pryamoe', name: 'Пальто прямое', cat: 'palto', brand: 'an-2', type: 'coat', fabric: 'wool', buttons: true,
      price: 38500, sizes: ['44','46','48','50','52','54'], isNew: true,
      colors: [{ name: 'Кэмел', hex: '#a97c50' }, { name: 'Чёрный', hex: '#18181a' }, { name: 'Серый', hex: '#8b8a86' }],
      material: 'Пальтовая шерсть 80%, кашемир 10%, полиамид 10%.',
      desc: 'Пальто прямого кроя длиной миди. Двубортная застёжка, глубокие карманы, утеплённая подкладка.' },
    { id: 9,  slug: 'palto-s-poyasom', name: 'Пальто с поясом', cat: 'palto', brand: 'natalya-slavina', type: 'coat', fabric: 'felt', belt: true,
      price: 41200, sizes: ['46','48','50','52'],
      colors: [{ name: 'Молочный', hex: '#ece4d4' }, { name: 'Графит', hex: '#343538' }],
      material: 'Шерсть 70%, альпака 20%, полиамид 10%.',
      desc: 'Пальто-халат с запахом и поясом. Мягкая плечевая линия, объёмный воротник.' },
    { id: 10, slug: 'yubka-karandash', name: 'Юбка-карандаш', cat: 'yubki', brand: 'an-2', type: 'skirt', fabric: 'crepe',
      price: 8900, sizes: ['42','44','46','48','50','52','54'],
      colors: [{ name: 'Чёрный', hex: '#161618' }, { name: 'Бордо', hex: '#5a1b24' }],
      material: 'Креп: полиэстер 65%, вискоза 32%, эластан 3%.',
      desc: 'Юбка-карандаш с высокой посадкой и шлицей сзади. Длина чуть ниже колена.' },
    { id: 11, slug: 'yubka-tvidovaya', name: 'Юбка твидовая', cat: 'yubki', brand: 'natalya-slavina', type: 'skirt', fabric: 'tweed',
      price: 10400, oldPrice: 13000, sizes: ['44','46','48','50'],
      colors: [{ name: 'Бежевый меланж', hex: '#b9a58c' }],
      material: 'Твид: шерсть 50%, хлопок 30%, полиакрил 20%.',
      desc: 'Прямая юбка из фактурного твида с бахромой по низу.' },
    { id: 12, slug: 'sarafan-na-molnii', name: 'Сарафан на молнии', cat: 'sarafany', brand: 'an-2', type: 'sundress', fabric: 'wool', zip: true,
      price: 14200, sizes: ['44','46','48','50','52'],
      colors: [{ name: 'Тёмно-серый', hex: '#3c3d40' }, { name: 'Синий', hex: '#233257' }],
      material: 'Шерсть 50%, полиэстер 47%, эластан 3%.',
      desc: 'Сарафан-футляр с металлической молнией по всей длине переда. Носите с блузой или водолазкой.' },
    { id: 13, slug: 'bluza-shelkovaya', name: 'Блуза шелковая', cat: 'bluzy', brand: 'natalya-slavina', type: 'blouse', fabric: 'silk',
      price: 9800, sizes: ['42','44','46','48','50'], isNew: true,
      colors: [{ name: 'Айвори', hex: '#f1ebdf' }, { name: 'Пыльная роза', hex: '#c79c96' }],
      material: 'Шёлк 90%, эластан 10%.',
      desc: 'Свободная блуза из шёлка с коротким рукавом. Мягкий вырез, потайная застёжка.' },
    { id: 14, slug: 'bryuki-pryamye', name: 'Брюки прямые', cat: 'bryuki', brand: 'an-2', type: 'trousers', fabric: 'wool',
      price: 11300, oldPrice: 14100, sizes: ['44','46','48','50','52','54','56'],
      colors: [{ name: 'Чёрный', hex: '#17171a' }, { name: 'Серый', hex: '#77777a' }],
      material: 'Костюмная шерсть 60%, вискоза 38%, эластан 2%.',
      desc: 'Прямые брюки со стрелками и высокой посадкой. Боковые карманы, застёжка на молнию.' }
  ]
};
