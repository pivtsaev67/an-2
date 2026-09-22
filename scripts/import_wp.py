#!/usr/bin/env python3
"""
Импорт каталога из WordPress REST API в js/data.js.

Источник: https://an-2.ru/wp-json/wp/v2/product?per_page=100  (сохранить как data/wp-products.json;
если товаров больше 100 — добавить &page=2 и сохранить как data/wp-products-2.json).
С параметром &_embed (используется сейчас) в ответе есть ссылки на фото — скрипт их подхватывает.

В этом API нет цен и размеров: они заполняются оценочно (см. PRICE_BY_CAT, DEFAULT_SIZES)
и помечаются полем priceEstimated. Как только появится выгрузка цен — поправить здесь.

Запуск:  python3 scripts/import_wp.py
"""
import glob, html, json, re, os
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SHOP = {
    'name': 'AN-2',
    'phone': '+7 (495) 259-64-33', 'phoneRaw': '+74952596433',
    'phone2': '+7 (495) 966-34-41', 'phone2Raw': '+74959663441',
    'email': 'shop@an-2.ru', 'address': 'Москва, Андроновское шоссе',
    'hours': 'Пн–Пт, 10:00–18:00', 'delivery': '2–3 дня', 'returnDays': 14,
}
CATEGORIES = [
    ('platya', 'Платья'), ('zhakety', 'Жакеты'), ('kostjumy', 'Костюмы'),
    ('jubki', 'Юбки'), ('bluzki', 'Блузки'), ('brjuki', 'Брюки'),
]
BRANDS = [('an-2', 'AN-2'), ('natalya-slavina', 'Natalia Slavina')]
SIZES = ['42', '44', '46', '48', '50', '52', '54', '56']
DEFAULT_SIZES = ['44', '46', '48', '50', '52', '54']
# Оценка по диапазонам цен сайта (из поисковой выдачи)
PRICE_BY_TYPE = {'dress': 11500, 'sundress': 9900, 'jacket': 12900, 'skirt': 6300,
                 'blouse': 5900, 'trousers': 6900}

COLORS = [  # (основа слова, название, hex)
    ('серо-зелен', 'Серо-зелёный', '#7d8a78'), ('зелено-розов', 'Зелёно-розовый', '#8fa58a'),
    ('изумруд', 'Изумрудный', '#1f4d43'), ('бордо', 'Бордо', '#5c1a22'), ('бордов', 'Бордо', '#5c1a22'),
    ('синего', 'Синий', '#1f3a78'), ('синий', 'Синий', '#1f3a78'), ('темно-син', 'Тёмно-синий', '#1f2638'),
    ('голуб', 'Голубой', '#7fa3c8'), ('бирюз', 'Бирюзовый', '#2f8f8a'), ('зелен', 'Зелёный', '#3f6b4a'),
    ('олив', 'Оливковый', '#55583c'), ('хаки', 'Хаки', '#6b6a45'), ('мятн', 'Мятный', '#9cc9b4'),
    ('розов', 'Розовый', '#d49aa0'), ('пудр', 'Пудровый', '#d9b8ad'), ('красн', 'Красный', '#9e2a2b'),
    ('коралл', 'Коралловый', '#d9735b'), ('терракот', 'Терракотовый', '#9a4b35'),
    ('горчич', 'Горчичный', '#b8912f'), ('желт', 'Жёлтый', '#d6b340'), ('песоч', 'Песочный', '#c9ae8a'),
    ('беж', 'Бежевый', '#c8b49a'), ('кэмел', 'Кэмел', '#b08457'), ('коричн', 'Коричневый', '#5e4030'),
    ('шоколад', 'Шоколадный', '#4a3024'), ('молоч', 'Молочный', '#ece4d4'), ('бел', 'Белый', '#f2efe9'),
    ('сер', 'Серый', '#77777a'), ('графит', 'Графит', '#2f3033'), ('черн', 'Чёрный', '#18181a'),
    ('чёрн', 'Чёрный', '#18181a'), ('фиолет', 'Фиолетовый', '#5b3f78'), ('лилов', 'Лиловый', '#8a6a9e'),
]
# Если цвет не найден в тексте — подбираем по ткани, чтобы 3D не был одинаковым
FALLBACK = {
    'suede': [('Синий', '#23386b'), ('Табак', '#6b4a32'), ('Бордо', '#5c1a22')],
    'tweed': [('Бежевый меланж', '#b9a58c'), ('Серо-розовый', '#a88f8f'), ('Синий меланж', '#3b4660')],
    'silk': [('Изумрудный', '#1f4d43'), ('Пудровый', '#d9b8ad'), ('Графит', '#2f3033')],
    'print': [('Цветочный принт', '#6f8f7a'), ('Принт', '#8a5a6a'), ('Принт', '#3f5a7a')],
    'check': [('Клетка', '#4a4f5a'), ('Клетка', '#6b5a48')],
    'stripe': [('Полоска', '#2c3d6b'), ('Полоска', '#1b1b1d')],
    'dots': [('Горошек', '#c8b49a'), ('Горошек', '#1f2638')],
    'default': [('Графит', '#2f3033'), ('Тёмно-синий', '#1f2638'), ('Бордо', '#5c1a22'), ('Кэмел', '#b08457'),
                ('Изумрудный', '#1f4d43'), ('Серый', '#77777a'), ('Чёрный', '#18181a'), ('Молочный', '#ece4d4')],
}


def clean(s):
    s = html.unescape(re.sub(r'<[^>]+>', ' ', s or ''))
    return re.sub(r'\s+', ' ', s).replace('\xa0', ' ').strip()


def garment_type(title, cat):
    t = title.lower()
    if 'сарафан' in t: return 'sundress'
    if 'блуз' in t: return 'blouse'
    if 'жакет' in t: return 'jacket'
    if 'юбк' in t: return 'skirt'
    if 'брюк' in t: return 'trousers'
    return {'zhakety': 'jacket', 'jubki': 'skirt', 'bluzki': 'blouse', 'brjuki': 'trousers'}.get(cat, 'dress')


def fabric_of(text):
    t = text.lower()
    rules = [('кожа', 'leather'), ('замш', 'suede'), ('твид', 'tweed'), ('шанель', 'tweed'), ('клетк', 'check'),
             ('полоск', 'stripe'), ('горох', 'dots'), ('горош', 'dots'), ('геометр', 'geo'),
             ('принт', 'print'), ('цвет', 'print'), ('листья', 'print'), ('монстер', 'print'), ('абстракц', 'print'),
             ('леопард', 'print'), ('цепи', 'print'), ('город', 'print'), ('шифон', 'silk'), ('шелк', 'silk'),
             ('шёлк', 'silk'), ('вискоз', 'crepe'), ('штапел', 'crepe'), ('трикотаж', 'crepe'), ('джерси', 'crepe'),
             ('лён', 'crepe'), ('хлоп', 'crepe')]
    for key, f in rules:
        if key in t: return f
    return 'wool'


def color_of(text, fabric, pid):
    t = text.lower()
    for stem, name, hx in COLORS:
        if re.search(r'(?<![а-яё])' + stem, t):
            return [{'name': name, 'hex': hx}]
    pool = FALLBACK.get(fabric, FALLBACK['default'])
    name, hx = pool[pid % len(pool)]
    return [{'name': name, 'hex': hx}]


def main():
    items = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'data', 'wp-products*.json'))):
        items += json.load(open(f, encoding='utf-8'))
    seen, products = set(), []
    items.sort(key=lambda p: p['date'], reverse=True)
    for p in items:
        if p['id'] in seen or p.get('status') != 'publish': continue
        seen.add(p['id'])
        title = clean(p['title']['rendered'])
        link = p['link']
        cat = link.split('/shop/')[1].split('/')[0] if '/shop/' in link else 'platya'
        desc = clean(p['excerpt']['rendered'])
        material = clean(p['content']['rendered'])
        if desc.startswith('Состав'): desc = ''
        text = ' '.join([title, desc, material])
        typ = garment_type(title, cat)
        fab = fabric_of(title + ' ' + desc)
        if fab == 'wool' and typ in ('dress', 'sundress', 'blouse'):
            fab = fabric_of(material)  # для лёгких вещей подскажет состав
        low = text.lower()
        images, thumb = [], None
        emb = p.get('_embedded', {}).get('wp:featuredmedia') or []
        for m in emb:
            if not isinstance(m, dict) or not m.get('source_url'): continue
            sizes = (m.get('media_details') or {}).get('sizes') or {}
            pick = lambda *keys: next((sizes[k]['source_url'] for k in keys if k in sizes), m['source_url'])
            images.append(pick('large', 'woocommerce_single', 'full'))
            thumb = thumb or pick('medium_large', 'woocommerce_thumbnail', 'shop_catalog', 'medium')
        prod = {
            'id': p['id'], 'slug': p['slug'], 'url': link, 'name': title, 'cat': cat, 'brand': 'an-2',
            'type': typ, 'fabric': fab,
            'price': PRICE_BY_TYPE[typ], 'priceEstimated': True,
            'sizes': DEFAULT_SIZES,
            'colors': color_of(text, fab, p['id']),
            'material': material or 'Состав уточняйте у менеджера.',
            'desc': desc or f'{title} — модель собственного производства AN-2.',
            'date': p['date'][:10],
        }
        if '3/4' in low: prod['sleeve'] = .7
        elif 'длинн' in low and 'рукав' in low: prod['sleeve'] = .92
        elif ('коротк' in low and 'рукав' in low) or 'цельнокро' in low: prod['sleeve'] = .36
        if 'молни' in low: prod['zip'] = True
        if 'пуговиц' in low or 'двуборт' in low or typ == 'jacket': prod['buttons'] = True
        if ('пояс' in low or 'ремень' in low or 'ремн' in low) and typ in ('dress', 'sundress'): prod['belt'] = True
        if images: prod['images'] = images; prod['thumb'] = thumb
        products.append(prod)
    for p in products[:8]:
        p['isNew'] = True

    used = {p['cat'] for p in products}
    data = {
        'shop': SHOP,
        'categories': [{'slug': s, 'name': n} for s, n in CATEGORIES if s in used],
        'brands': [{'slug': s, 'name': n} for s, n in BRANDS],
        'sizes': SIZES,
        'products': products,
    }
    header = ('/*\n * Каталог AN-2. СГЕНЕРИРОВАНО scripts/import_wp.py из data/wp-products*.json\n'
              ' * (выгрузка https://an-2.ru/wp-json/wp/v2/product). Не править вручную.\n'
              ' * Названия, категории, описания, составы и ссылки — с сайта.\n'
              ' * Цены (priceEstimated), размеры и цвета без явного указания в описании — оценочные.\n'
              f' * Товаров: {len(products)}. Сгенерировано: {datetime.now():%Y-%m-%d}.\n */\n')
    out = header + 'window.AN2 = ' + json.dumps(data, ensure_ascii=False, indent=1) + ';\n'
    open(os.path.join(ROOT, 'js', 'data.js'), 'w', encoding='utf-8').write(out)
    from collections import Counter
    print(len(products), 'товаров;', Counter(p['cat'] for p in products), Counter(p['fabric'] for p in products))


if __name__ == '__main__':
    main()
