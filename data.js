// ============================================================================
// AirCargo World — static reference data & AI decision logic
// All figures in this file are illustrative demo data, not live market data.
// Labels shown to people live in i18n.js; values here are stored as data.
// ============================================================================

/* ---------------------------------------------------------------------- */
/* Roles (labels and descriptions come from i18n.js)                       */
/* ---------------------------------------------------------------------- */
const ROLES = {
  cargo_owner: { icon: 'box' },
  forwarder:   { icon: 'route' },
  airline:     { icon: 'plane' },
  broker:      { icon: 'handshake' },
};

const ROLE_NAV = {
  cargo_owner: ['dashboard','my-cargo','marketplace','charter','contracts'],
  forwarder:   ['dashboard','my-cargo','marketplace','charter','contracts'],
  airline:     ['dashboard','capacity','my-cargo','marketplace','charter','contracts'],
  broker:      ['dashboard','charter','marketplace','contracts'],
};

// Dashboard primary actions per role: [label key, route, id]. Navigation lives in the sidebar only.
const ROLE_ACTIONS = {
  cargo_owner: [['dash.newCargo','my-cargo','new'], ['dash.newCharter','charter','new']],
  forwarder:   [['dash.newCommercial','my-cargo','new'], ['dash.newCharter','charter','new']],
  airline:     [['dash.addFlight','capacity','new-flight'], ['dash.addSpace','capacity','new-space'], ['dash.newCommercial','my-cargo','new']],
  broker:      [],
};

/* ---------------------------------------------------------------------- */
/* Cargo types (IATA special-handling style), stored by `code`             */
/* `en` / `ru` are dropdown labels; `shortEn` / `shortRu` are for tables.   */
/* ---------------------------------------------------------------------- */
const CARGO_TYPES = [
  { code:'GEN',   en:'General Cargo (GEN)',                      ru:'General Cargo (GEN) — генеральный груз',                     shortEn:'General cargo',        shortRu:'Генеральный груз' },
  { code:'DGR',   en:'Dangerous Goods (DGR)',                    ru:'Dangerous Goods (DGR) — опасные грузы',                      shortEn:'Dangerous goods',      shortRu:'Опасный груз' },
  { code:'PER',   en:'Perishable Cargo (PER)',                   ru:'Perishable Cargo (PER) — скоропортящиеся грузы',             shortEn:'Perishables',          shortRu:'Скоропортящийся груз' },
  { code:'PIL',   en:'Pharmaceutical Cargo (PIL / Pharma)',      ru:'Pharmaceutical Cargo (PIL / Pharma) — фармацевтика',         shortEn:'Pharma',               shortRu:'Фармацевтика' },
  { code:'AVI',   en:'Live Animals (AVI)',                       ru:'Live Animals (AVI) — живые животные',                        shortEn:'Live animals',         shortRu:'Живые животные' },
  { code:'VAL',   en:'Valuable Cargo (VAL)',                     ru:'Valuable Cargo (VAL) — ценный груз',                         shortEn:'Valuables',            shortRu:'Ценный груз' },
  { code:'AUTO',  en:'Automotive Cargo',                         ru:'Automotive Cargo — автомобили и автокомпоненты',             shortEn:'Automotive',           shortRu:'Автомобили и автокомпоненты' },
  { code:'AOG',   en:'Aircraft Parts / AOG Cargo',               ru:'Aircraft Parts / AOG Cargo — авиационные запчасти',          shortEn:'Aircraft parts / AOG', shortRu:'Авиазапчасти / AOG' },
  { code:'MAIL',  en:'Mail (MAIL)',                              ru:'Mail (MAIL) — почта',                                        shortEn:'Mail',                 shortRu:'Почта' },
  { code:'DIP',   en:'Diplomatic Cargo / Diplomatic Mail (DIP)', ru:'Diplomatic Cargo / Diplomatic Mail (DIP) — дипломатический груз / почта', shortEn:'Diplomatic', shortRu:'Дипломатический груз' },
  { code:'OTHER', en:'Other (specify)',                          ru:'Другое (указать самостоятельно)',                            shortEn:'Other',                shortRu:'Другое' },
];
const CARGO_TYPE_BY_CODE = Object.fromEntries(CARGO_TYPES.map(c => [c.code, c]));
// Values used before the list above, so older requests still display and filter correctly.
const LEGACY_CARGO_TYPE = {
  'General Cargo':'GEN', 'Perishable':'PER', 'Pharma / Cold Chain':'PIL', 'Automotive Parts':'AUTO',
  'Live Animals':'AVI', 'Valuables / High-Value':'VAL', 'E-commerce / Parcels':'OTHER',
};

// Dangerous goods classes (IATA DGR), stored as the class number.
const DG_CLASSES = [
  { n:1, en:'Explosives',         ru:'Взрывчатые' },
  { n:2, en:'Gases',              ru:'Газы' },
  { n:3, en:'Flammable Liquids',  ru:'Горючие жидкости' },
  { n:4, en:'Flammable Solids',   ru:'Горючие твёрдые' },
  { n:5, en:'Oxidizers',          ru:'Окислители' },
  { n:6, en:'Toxic / Infectious', ru:'Токсичные / инфекционные' },
  { n:7, en:'Radioactive',        ru:'Радиоактивные' },
  { n:8, en:'Corrosives',         ru:'Коррозионные' },
  { n:9, en:'Miscellaneous',      ru:'Прочие DGR' },
];

// Delivery terms offered on a cargo request, stored by `code`.
const INCOTERMS = [
  { code:'EXW', en:'Ex Works',                       ru:'Франко-завод' },
  { code:'FCA', en:'Free Carrier',                   ru:'Франко-перевозчик' },
  { code:'DAP', en:'Delivered at Place',             ru:'Поставка в месте назначения' },
  { code:'DDP', en:'Delivered Duty Paid',            ru:'Поставка с оплатой пошлин' },
  { code:'CIP', en:'Carriage and Insurance Paid To', ru:'Перевозка и страхование оплачены до' },
];

// Temperature regimes, shared by cargo requests and airline flights / capacity.
const TEMP_OPTIONS = ['Ambient','+2…+8 °C (chilled)','+15…+25 °C (CRT)','+2…+25 °C','−20 °C (frozen)','−60 °C and below (deep frozen)'];

// Aircraft an airline can publish a flight or free capacity on.
const AIRCRAFT_TYPES = [
  'Boeing 747-8F','Boeing 747-400F','Boeing 777F','Boeing 767-300F','Boeing 757-200F','Boeing 737-800BCF',
  'Airbus A330-200F','Airbus A330-300P2F','Airbus A321P2F','Airbus A300-600F','McDonnell Douglas MD-11F',
  'Antonov An-124-100','Ilyushin Il-76TD','ATR 72-600F','Passenger aircraft (belly hold)','Other',
];

/* ---------------------------------------------------------------------- */
/* Airports (subset of major cargo gateways, used for route selection)     */
/* ---------------------------------------------------------------------- */
const AIRPORTS = [
  { code:'HKG', city:'Hong Kong',    country:'Hong Kong',    cityRu:'Гонконг',       countryRu:'Гонконг' },
  { code:'PVG', city:'Shanghai',     country:'China',        cityRu:'Шанхай',        countryRu:'Китай' },
  { code:'ICN', city:'Seoul',        country:'South Korea',  cityRu:'Сеул',          countryRu:'Южная Корея' },
  { code:'NRT', city:'Tokyo',        country:'Japan',        cityRu:'Токио',         countryRu:'Япония' },
  { code:'SIN', city:'Singapore',    country:'Singapore',    cityRu:'Сингапур',      countryRu:'Сингапур' },
  { code:'DXB', city:'Dubai',        country:'UAE',          cityRu:'Дубай',         countryRu:'ОАЭ' },
  { code:'DOH', city:'Doha',         country:'Qatar',        cityRu:'Доха',          countryRu:'Катар' },
  { code:'BOM', city:'Mumbai',       country:'India',        cityRu:'Мумбаи',        countryRu:'Индия' },
  { code:'DEL', city:'Delhi',        country:'India',        cityRu:'Дели',          countryRu:'Индия' },
  { code:'TAS', city:'Tashkent',     country:'Uzbekistan',   cityRu:'Ташкент',       countryRu:'Узбекистан' },
  { code:'IST', city:'Istanbul',     country:'Turkiye',      cityRu:'Стамбул',       countryRu:'Турция' },
  { code:'FRA', city:'Frankfurt',    country:'Germany',      cityRu:'Франкфурт',     countryRu:'Германия' },
  { code:'AMS', city:'Amsterdam',    country:'Netherlands',  cityRu:'Амстердам',     countryRu:'Нидерланды' },
  { code:'LHR', city:'London',       country:'UK',           cityRu:'Лондон',        countryRu:'Великобритания' },
  { code:'CDG', city:'Paris',        country:'France',       cityRu:'Париж',         countryRu:'Франция' },
  { code:'MXP', city:'Milan',        country:'Italy',        cityRu:'Милан',         countryRu:'Италия' },
  { code:'JFK', city:'New York',     country:'USA',          cityRu:'Нью-Йорк',      countryRu:'США' },
  { code:'ORD', city:'Chicago',      country:'USA',          cityRu:'Чикаго',        countryRu:'США' },
  { code:'LAX', city:'Los Angeles',  country:'USA',          cityRu:'Лос-Анджелес',  countryRu:'США' },
  { code:'MIA', city:'Miami',        country:'USA',          cityRu:'Майами',        countryRu:'США' },
  { code:'GRU', city:'Sao Paulo',    country:'Brazil',       cityRu:'Сан-Паулу',     countryRu:'Бразилия' },
  { code:'BOG', city:'Bogota',       country:'Colombia',     cityRu:'Богота',        countryRu:'Колумбия' },
  { code:'JNB', city:'Johannesburg', country:'South Africa', cityRu:'Йоханнесбург',  countryRu:'ЮАР' },
  { code:'NBO', city:'Nairobi',      country:'Kenya',        cityRu:'Найроби',       countryRu:'Кения' },
  { code:'LOS', city:'Lagos',        country:'Nigeria',      cityRu:'Лагос',         countryRu:'Нигерия' },
  { code:'CAI', city:'Cairo',        country:'Egypt',        cityRu:'Каир',          countryRu:'Египет' },
  { code:'SYD', city:'Sydney',       country:'Australia',    cityRu:'Сидней',        countryRu:'Австралия' },
  { code:'MEL', city:'Melbourne',    country:'Australia',    cityRu:'Мельбурн',      countryRu:'Австралия' },
  { code:'ALA', city:'Almaty',       country:'Kazakhstan',   cityRu:'Алматы',        countryRu:'Казахстан' },
  { code:'PEK', city:'Beijing',      country:'China',        cityRu:'Пекин',         countryRu:'Китай' },
];
const AIRPORT_BY_CODE = Object.fromEntries(AIRPORTS.map(a => [a.code, a]));

/* ---------------------------------------------------------------------- */
/* AI Decision Engine — transparent, rule-based scoring (demo logic)       */
/* Weights are percentages of a 100-point score.                           */
/* ---------------------------------------------------------------------- */
const AI_WEIGHTS = { price: 45, transit: 30, service: 25 };
const SERVICE_SHARE = { Standard: 0, Priority: 0.5, Premium: 1 };
const SERVICE_RANK = { Standard: 0, Priority: 1, Premium: 2 };

function scoreOffer(offer, allOffers) {
  const prices = allOffers.map(o => o.price);
  const minP = Math.min(...prices), maxP = Math.max(...prices);
  const priceScore = maxP === minP ? AI_WEIGHTS.price
    : AI_WEIGHTS.price * (1 - (offer.price - minP) / (maxP - minP));

  const transits = allOffers.map(o => o.transitDays);
  const minT = Math.min(...transits), maxT = Math.max(...transits);
  const transitScore = maxT === minT ? AI_WEIGHTS.transit
    : AI_WEIGHTS.transit * (1 - (offer.transitDays - minT) / (maxT - minT));

  const serviceScore = AI_WEIGHTS.service * (SERVICE_SHARE[offer.serviceLevel] ?? 0);

  return {
    total: Math.round(priceScore + transitScore + serviceScore),
    priceScore: Math.round(priceScore),
    transitScore: Math.round(transitScore),
    serviceScore: Math.round(serviceScore),
  };
}

// Returns the three picks plus the facts the explanation needs (n, median).
function rankOffers(offers) {
  if (!offers.length) return { picks: [], n: 0, median: 0 };
  const scored = offers.map(o => ({ ...o, ai: scoreOffer(o, offers) }));
  scored.sort((a, b) => b.ai.total - a.ai.total);

  const bestOverall = scored[0];
  const byPrice = [...scored].sort((a, b) => a.price - b.price)[0];
  const bySvc = [...scored].sort((a, b) =>
    ((SERVICE_RANK[b.serviceLevel] ?? 0) - (SERVICE_RANK[a.serviceLevel] ?? 0)) ||
    (a.transitDays - b.transitDays) || (a.price - b.price))[0];

  const sortedPrices = offers.map(o => o.price).sort((a, b) => a - b);
  return {
    picks: [
      { tag: 'bestPrice', offer: byPrice },
      { tag: 'bestOverall', offer: bestOverall },
      { tag: 'premium', offer: bySvc },
    ],
    n: offers.length,
    median: sortedPrices[Math.floor(sortedPrices.length / 2)],
  };
}
