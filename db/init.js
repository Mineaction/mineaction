/**
 * TNMAC – JSON-file database engine
 * Stores each collection in data/{name}.json
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); } catch(e) {}

// ── Core helpers ─────────────────────────────────────────
function filePath(name) { return path.join(DATA_DIR, name + '.json'); }

function readDB(name) {
  const fp = filePath(name);
  if (!fs.existsSync(fp)) return [];
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); }
  catch { return []; }
}

function writeDB(name, data) {
  try {
    fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2), 'utf8');
  } catch(e) {
    console.warn(`writeDB(${name}) skipped — read-only fs:`, e.message);
  }
}

function nextId(rows) {
  return rows.length ? Math.max(...rows.map(r => r.id || 0)) + 1 : 1;
}

const db = {
  // ── read ────────────────────────────────────────────────
  find(col, predicate) {
    const rows = readDB(col);
    return predicate ? rows.filter(predicate) : rows;
  },
  findOne(col, predicate) {
    return readDB(col).find(predicate) || null;
  },
  findById(col, id) {
    return readDB(col).find(r => r.id === parseInt(id)) || null;
  },

  // ── write ────────────────────────────────────────────────
  insert(col, doc) {
    const rows = readDB(col);
    const newDoc = { ...doc, id: nextId(rows), created_at: new Date().toISOString() };
    rows.push(newDoc);
    writeDB(col, rows);
    return newDoc;
  },
  update(col, id, updates) {
    const rows = readDB(col);
    const idx = rows.findIndex(r => r.id === parseInt(id));
    if (idx === -1) return false;
    rows[idx] = { ...rows[idx], ...updates, updated_at: new Date().toISOString() };
    writeDB(col, rows);
    return true;
  },
  delete(col, id) {
    const rows = readDB(col);
    const filtered = rows.filter(r => r.id !== parseInt(id));
    writeDB(col, filtered);
    return rows.length !== filtered.length;
  },

  // ── settings (key-value) ─────────────────────────────────
  getSetting(key) {
    const rows = readDB('settings');
    const found = rows.find(r => r.key === key);
    return found ? found.value : null;
  },
  getAllSettings() {
    const rows = readDB('settings');
    const obj = {};
    rows.forEach(r => obj[r.key] = r.value);
    return obj;
  },
  getAllSettingsRaw() { return readDB('settings'); },
  setSetting(key, value) {
    const rows = readDB('settings');
    const idx = rows.findIndex(r => r.key === key);
    if (idx >= 0) rows[idx].value = value;
    else rows.push({ key, value });
    writeDB('settings', rows);
  },
  setSettings(obj) {
    const rows = readDB('settings');
    for (const [key, value] of Object.entries(obj)) {
      const idx = rows.findIndex(r => r.key === key);
      if (idx >= 0) rows[idx].value = value;
      else rows.push({ key, value });
    }
    writeDB('settings', rows);
  }
};

// ════════════════════════════════════════════════════════
//  SEED – only runs if data files don't exist yet
// ════════════════════════════════════════════════════════

// Users
if (!fs.existsSync(filePath('users'))) {
  const hash = bcrypt.hashSync('Admin@TNMAC2024!', 10);
  writeDB('users', [{
    id: 1, username: 'admin', password: hash, role: 'superadmin',
    created_at: new Date().toISOString()
  }]);
  console.log('✅ Admin user created: admin / Admin@TNMAC2024!');
}

// Settings
if (!fs.existsSync(filePath('settings'))) {
  writeDB('settings', [
    { key:'site_title', value:'TNMAC – Tajikistan National Mine Action Centre', label:'Site Title', type:'text' },
    { key:'hero_tag', value:'Tajikistan · Mine Action', label:'Hero Tag', type:'text' },
    { key:'hero_title', value:'Clearing Mines.<br/>Saving Lives.<br/>Building Peace.', label:'Hero Title', type:'html' },
    { key:'hero_sub', value:'Government Institution "Tajikistan National Mine Action Centre" — coordinating all humanitarian mine action since 1999 under the Ottawa Treaty.', label:'Hero Subtitle', type:'textarea' },
    { key:'hero_btn1', value:'View Statistics', label:'Hero Button 1', type:'text' },
    { key:'hero_btn2', value:'Our Work', label:'Hero Button 2', type:'text' },
    { key:'address', value:'Ayni Street 121, 734013 Dushanbe, Tajikistan', label:'Address', type:'text' },
    { key:'phone', value:'(992 37) 227-0947, 221-6687', label:'Phone', type:'text' },
    { key:'email', value:'info@tnmac.gov.tj', label:'Email', type:'text' },
    { key:'nav_badge', value:'2024 Report', label:'Nav Badge', type:'text' },
    { key:'color_primary', value:'#c0392b', label:'Primary Color', type:'color' },
    { key:'color_dark', value:'#0d1b2a', label:'Dark Background', type:'color' },
    { key:'color_navy', value:'#1a2f4a', label:'Navy Color', type:'color' },
    { key:'regions_title_en', value:"Tajikistan's Contaminated Regions", label:'Regions Title (EN)', type:'text' },
    { key:'regions_title_ru', value:'Загрязнённые регионы Таджикистана', label:'Regions Title (RU)', type:'text' },
    { key:'regions_title_tj', value:'Минтақаҳои ифлосшудаи Тоҷикистон', label:'Regions Title (TJ)', type:'text' },
    { key:'regions_body_en', value:'Tajikistan shares borders with Afghanistan, Uzbekistan, Kyrgyzstan, and China. The majority of contamination is concentrated along the former conflict zones in Sughd and Khatlon regions, particularly near the Uzbek and Afghan borders.', label:'Regions Body (EN)', type:'textarea' },
    { key:'regions_body_ru', value:'Таджикистан граничит с Афганистаном, Узбекистаном, Кыргызстаном и Китаем. Основная часть загрязнения сосредоточена вдоль бывших зон конфликта в Сугдской и Хатлонской областях.', label:'Regions Body (RU)', type:'textarea' },
    { key:'regions_body_tj', value:'Тоҷикистон бо Афғонистон, Ӯзбекистон, Қирғизистон ва Чин ҳамсарҳад аст. Қисми асосии ифлосшавӣ дар минтақаҳои Суғд ва Хатлон мутамарказ шудааст.', label:'Regions Body (TJ)', type:'textarea' },
  ]);
}

// Stats
if (!fs.existsSync(filePath('stats'))) {
  writeDB('stats', [
    { id:1, key:'area_cleared', icon:'🗺️', value_en:'260', label_en:'Total Contaminated Area Cleared (km²)', label_ru:'Всего очищено (км²)', label_tj:'Майдони тозашуда (км²)', badge:'↑ Ongoing clearance', badge_type:'up', color:'#c0392b', sort_order:1 },
    { id:2, key:'mines_destroyed', icon:'💥', value_en:'316,000', label_en:'Landmines & ERW Destroyed', label_ru:'Мин и ВОП уничтожено', label_tj:'Мина ва ПМА нобуд шуд', badge:'↑ Since 1999', badge_type:'up', color:'#e67e22', sort_order:2 },
    { id:3, key:'org_count', icon:'🦺', value_en:'4', label_en:'Active Demining Organisations', label_ru:'Активных организаций', label_tj:'Ташкилотҳои фаъол', badge:'FSD · NPA · HDC · UST', badge_type:'up', color:'#27ae60', sort_order:3 },
    { id:4, key:'survivors', icon:'👥', value_en:'1,200+', label_en:'Registered Mine Survivors', label_ru:'Зарегистрировано пострадавших', label_tj:'Маъюбони сабтшуда', badge:'↓ Incidents declining', badge_type:'down', color:'#2980b9', sort_order:4 },
    { id:5, key:'mre_trained', icon:'🎓', value_en:'85,000+', label_en:'People Trained in Mine Risk Education', label_ru:'Обучено минной безопасности', label_tj:'Таълимдидагони МРЕ', badge:'↑ Annual campaigns', badge_type:'up', color:'#8e44ad', sort_order:5 },
    { id:6, key:'years_ops', icon:'📅', value_en:'25', label_en:'Years of Operations (1999–2024)', label_ru:'Лет работы', label_tj:'Соли фаъолият', badge:'↑ Ottawa Treaty', badge_type:'up', color:'#16a085', sort_order:6 },
    { id:7, key:'districts', icon:'🏘️', value_en:'14', label_en:'Mine-Affected Districts', label_ru:'Пострадавших районов', label_tj:'Ноҳияҳои зарардида', badge:'↑ Across 3 regions', badge_type:'up', color:'#d35400', sort_order:7 },
    { id:8, key:'donors_count', icon:'🤝', value_en:'12+', label_en:'International Donor Partners', label_ru:'Международных партнёров', label_tj:'Шарикони байналмилалӣ', badge:'↑ OSCE · ICRC · UNDP', badge_type:'up', color:'#c0392b', sort_order:8 },
  ]);
}

// Regions
if (!fs.existsSync(filePath('regions'))) {
  writeDB('regions', [
    { id:1, name:'Sughd', pct:88, area_km2:'~92 km²', sort_order:1 },
    { id:2, name:'Khatlon', pct:72, area_km2:'~75 km²', sort_order:2 },
    { id:3, name:'GBAO', pct:60, area_km2:'~62 km²', sort_order:3 },
    { id:4, name:'RRS', pct:38, area_km2:'~31 km²', sort_order:4 },
    { id:5, name:'Dushanbe', pct:12, area_km2:'~0 km²', sort_order:5 },
  ]);
}

// Timeline
if (!fs.existsSync(filePath('timeline'))) {
  writeDB('timeline', [
    { id:1, year:'1997', title_en:'Ottawa Convention Signed', title_ru:'Подписание Оттавской конвенции', title_tj:'Имзои Созишномаи Оттава', body_en:'The Convention on the Prohibition of Anti-Personnel Mines was signed on 18 September 1997. Tajikistan acceded in October 1999.', body_ru:'Конвенция о запрете противопехотных мин подписана 18 сентября 1997 года. Таджикистан присоединился в октябре 1999 года.', body_tj:'Конвенсия дар бораи манъи минаҳои зидди шахсӣ 18 сентябри 1997 имзо шуд.', sort_order:1 },
    { id:2, year:'2000', title_en:'Tajikistan Joins Ottawa Treaty', title_ru:'Таджикистан присоединился к Оттавскому договору', title_tj:'Тоҷикистон ба Шартномаи Оттава пайваст', body_en:'Tajikistan became a State Party on 1 April 2000, committing to mine clearance, victim assistance, and stockpile destruction.', body_ru:'Таджикистан стал государством-участником 1 апреля 2000 года.', body_tj:'Тоҷикистон 1 апрели 2000 узви давлатӣ шуд.', sort_order:2 },
    { id:3, year:'2004', title_en:'First Review Conference', title_ru:'Первая обзорная конференция', title_tj:'Аввалин конфронси баррасӣ', body_en:'At the Nairobi Summit, Tajikistan reported responsibility for significant numbers of landmine survivors and received international support.', body_ru:'На Найробийском саммите Таджикистан сообщил о значительном числе выживших жертв мин.', body_tj:'Дар саммити Найробӣ Тоҷикистон дар бораи шумораи зиёди бозмондагони минаҳо гузориш дод.', sort_order:3 },
    { id:4, year:'2014', title_en:'TNMAC Formally Established', title_ru:'Официальное создание ГКРМТТ', title_tj:'Таъсиси расмии МДМТ', body_en:'The Government Institution "Tajikistan National Mine Action Center" was established by Government Decree #24 on 3 January 2014.', body_ru:'Государственное учреждение "Таджикский национальный центр по разминированию" создано постановлением правительства №24 от 3 января 2014 года.', body_tj:'Муассисаи давлатии "Маркази давлатии минатозакунии Тоҷикистон" бо Қарори Ҳукумат №24 таъсис ёфт.', sort_order:4 },
    { id:5, year:'2017', title_en:'National Strategy 2017–2020', title_ru:'Национальная стратегия 2017–2020', title_tj:'Стратегияи миллӣ 2017–2020', body_en:'Adoption of the National Strategy of the Republic of Tajikistan for Humanitarian Mine Action covering clearance, MRE, and victim assistance.', body_ru:'Принятие Национальной стратегии Республики Таджикистан по гуманитарному разминированию.', body_tj:'Қабули Стратегияи миллии Ҷумҳурии Тоҷикистон оид ба амалиётҳои гуманитарии минатозакунӣ.', sort_order:5 },
    { id:6, year:'2021', title_en:'National Strategy 2021–2030', title_ru:'Национальная стратегия 2021–2030', title_tj:'Стратегияи миллӣ 2021–2030', body_en:'New 10-year national strategy launched, aligned with the Oslo Action Plan. Tajikistan aims to be mine-free by 2030.', body_ru:'Новая 10-летняя национальная стратегия. Таджикистан стремится стать свободным от мин к 2030 году.', body_tj:'Стратегияи нави 10-солаи миллӣ. Тоҷикистон мехоҳад то соли 2030 аз мин озод шавад.', sort_order:6 },
    { id:7, year:'2024', title_en:'International Mine Awareness Day', title_ru:'Международный день осведомлённости о минной опасности', title_tj:'Рӯзи байналмилалии огоҳӣ аз хатари минаҳо', body_en:'Major event held at Central Stadium, Shamsiddin Shohin district, attended by OSCE, ICRC, US Dept. of State, NPA, FSD and 800+ locals.', body_ru:'Крупное мероприятие на Центральном стадионе с участием ОБСЕ, МККК, Госдепа США и более 800 местных жителей.', body_tj:'Чорабинии бузург дар Варзишгоҳи марказӣ бо иштироки СААМ, КШББ, ДД ИМА ва зиёда аз 800 сокинон.', sort_order:7 },
  ]);
}

// Activities
if (!fs.existsSync(filePath('activities'))) {
  writeDB('activities', [
    { id:1, icon:'🗺️', title_en:'Land Release & Clearance', title_ru:'Разминирование и освобождение земель', title_tj:'Тозакунӣ ва озодсозии замин', body_en:'TNMAC oversees all humanitarian demining operations governed by National Mine Action Standards (NMAS). Four organisations conduct operations: FSD, NPA, HDC, and UST.', body_ru:'ГКРМТТ осуществляет надзор за всеми операциями по гуманитарному разминированию. Четыре организации: ФШД, НПА, ХДК и УСТ.', body_tj:'МДМТ назорати ҳамаи амалиётҳои минатозакуниро амалӣ мекунад.', tag_en:'Ongoing Operations', tag_ru:'Текущие операции', tag_tj:'Амалиётҳои ҷорӣ', color:'#c0392b', sort_order:1 },
    { id:2, icon:'🎓', title_en:'Mine Risk Education', title_ru:'Обучение минной безопасности', title_tj:'Таълими бехатарии минаҳо', body_en:'MRE raises awareness of landmine and UXO risks through public-information campaigns, community education, and training.', body_ru:'МБО повышает осведомлённость о рисках мин через информационные кампании и обучение общества.', body_tj:'МРЕ тавассути маъракаҳои иттилоотӣ огоҳиро дар бораи хатари минаҳо баланд мебардорад.', tag_en:'Community Outreach', tag_ru:'Работа с сообществом', tag_tj:'Кор бо ҷомеа', color:'#e67e22', sort_order:2 },
    { id:3, icon:'🏥', title_en:'Victim Assistance', title_ru:'Помощь пострадавшим', title_tj:'Кӯмак ба қурбониён', body_en:'Comprehensive support for mine/ERW survivors: emergency medical care, physical rehabilitation, psychosocial support, and economic reintegration.', body_ru:'Комплексная поддержка выживших: медицинская помощь, физическая реабилитация, психосоциальная поддержка и экономическая реинтеграция.', body_tj:'Дастгирии ҳамаҷонибаи бозмондагон: нигоҳубини тиббӣ, барқарорсозии ҷисмонӣ ва дастгирии психосоциалӣ.', tag_en:'Social Reintegration', tag_ru:'Социальная реинтеграция', tag_tj:'Ҳамгироии иҷтимоӣ', color:'#27ae60', sort_order:3 },
    { id:4, icon:'📊', title_en:'Information Management', title_ru:'Управление информацией', title_tj:'Идоракунии иттилоот', body_en:'TNMAC manages the IMSMA database recording all contaminated areas, mine incidents, demining activities, and clearance results across Tajikistan.', body_ru:'ГКРМТТ управляет базой данных IMSMA, фиксирующей все заражённые районы и результаты разминирования.', body_tj:'МДМТ базаи маълумотии IMSMAро идора мекунад.', tag_en:'IMSMA Database', tag_ru:'База данных IMSMA', tag_tj:'Базаи маълумотии IMSMA', color:'#2980b9', sort_order:4 },
    { id:5, icon:'📋', title_en:'Standards & Regulation', title_ru:'Стандарты и регулирование', title_tj:'Стандартҳо ва танзим', body_en:'Development of national mine action standards, regulations, policies, and SOPs based on IMAS. All demining organisations develop their own SOPs approved by TNMAC.', body_ru:'Разработка национальных стандартов минной деятельности на основе IMAS.', body_tj:'Таҳияи стандартҳои миллии амалиётҳои минатозакунӣ бар асоси IMAS.', tag_en:'NMAS · IMAS', tag_ru:'НМАС · ИМАС', tag_tj:'НМАС · ИМАС', color:'#8e44ad', sort_order:5 },
    { id:6, icon:'🤝', title_en:'Donor Coordination', title_ru:'Координация с донорами', title_tj:'Ҳамоҳангсозӣ бо донорон', body_en:'TNMAC coordinates donor community assistance, mobilises technical and financial resources, and monitors resource use by the Government and donor community.', body_ru:'ГКРМТТ координирует помощь донорского сообщества и мобилизует финансовые ресурсы.', body_tj:'МДМТ кӯмаки ҷомеаи донорҳоро ҳамоҳанг мекунад.', tag_en:'International Support', tag_ru:'Международная поддержка', tag_tj:'Дастгирии байналмилалӣ', color:'#16a085', sort_order:6 },
  ]);
}

// Donors
if (!fs.existsSync(filePath('donors'))) {
  writeDB('donors', [
    { id:1, name:'🇺🇸 US Department of State', flag:'🇺🇸', website:'https://www.state.gov/', sort_order:1 },
    { id:2, name:'🌍 OSCE Programme Office', flag:'🌍', website:'https://www.osce.org/tajikistan', sort_order:2 },
    { id:3, name:'🔴 ICRC Tajikistan', flag:'🔴', website:'https://www.icrc.org/', sort_order:3 },
    { id:4, name:'🇨🇭 FSD – Swiss Foundation', flag:'🇨🇭', website:'https://www.fsd.ch/', sort_order:4 },
    { id:5, name:"🇳🇴 Norwegian People's Aid", flag:'🇳🇴', website:'https://www.npaid.org/', sort_order:5 },
    { id:6, name:'🇺🇳 UNDP Tajikistan', flag:'🇺🇳', website:'https://www.tj.undp.org/', sort_order:6 },
    { id:7, name:'🏥 Red Crescent Tajikistan', flag:'🏥', website:'https://redcrescent.tj/', sort_order:7 },
    { id:8, name:'🛡️ HDC – Ministry of Defense', flag:'🛡️', website:'', sort_order:8 },
    { id:9, name:'🇹🇯 Union of Sappers of TJ', flag:'🇹🇯', website:'', sort_order:9 },
  ]);
}

// News
if (!fs.existsSync(filePath('news'))) {
  writeDB('news', [
    { id:1, title_en:'TNMAC & OSCE Summer Rehabilitation Camp', title_ru:'Летний лагерь реабилитации ГКРМТТ и ОБСЕ', title_tj:'Лагери тобистонии барқарорсозии МДМТ ва СААМ', excerpt_en:'40 landmine/ERW survivors and family members from remote mine-affected districts attended a two-week rehabilitation camp in Guliston city, Sugd region, organised with OSCE financial support.', excerpt_ru:'40 выживших жертв мин посетили двухнедельный реабилитационный лагерь в г. Гулистон с поддержкой ОБСЕ.', excerpt_tj:'40 нафар аз минаҳо зинда мондагон ба лагери ду ҳафтаи барқарорсозӣ дар шаҳри Гулистон ширкат карданд.', body_en:'40 landmine/ERW survivors and family members from remote mine-affected districts attended a two-week rehabilitation camp in Guliston city, Sugd region. The camp was organised with OSCE financial support and included medical consultations, sports activities, and psychosocial support sessions.', body_ru:'40 выживших жертв мин и членов их семей из отдалённых пострадавших от мин районов посетили двухнедельный реабилитационный лагерь в г. Гулистоне, Сугдская область, организованный при финансовой поддержке ОБСЕ.', body_tj:'40 нафар аз минаҳо зинда мондагон ва аъзоёни оилаҳои онҳо аз ноҳияҳои дурдасти осебдида ба лагери ду ҳафтаи барқарорсозӣ дар шаҳри Гулистон ширкат карданд.', image:null, link:'https://mineaction.tj/news/index.php?ELEMENT_ID=248', published_at:'2024-08-23', is_published:1, created_at:new Date().toISOString() },
    { id:2, title_en:'International Mine Awareness Day 2024', title_ru:'Международный день осведомлённости о минной опасности 2024', title_tj:'Рӯзи байналмилалии огоҳӣ аз хатари минаҳо 2024', excerpt_en:'Celebrated at the Central Stadium of Shamsiddin Shohin district with participation of US Dept. of State, OSCE, ICRC, Red Crescent, FSD, NPA, and over 800 local residents.', excerpt_ru:'Отмечался на Центральном стадионе с участием Госдепа США, ОБСЕ, МККК и более 800 местных жителей.', excerpt_tj:'Дар Варзишгоҳи марказӣ бо иштироки ДД ИМА, СААМ, КШББ ва зиёда аз 800 сокинон таҷлил шуд.', body_en:'The International Mine Awareness Day was celebrated at the Central Stadium of Shamsiddin Shohin district. The event was attended by representatives of the US Department of State, OSCE, ICRC, Red Crescent, FSD, NPA, and over 800 local residents.', body_ru:'Международный день осведомлённости о минной опасности отмечался на Центральном стадионе с участием Госдепа США, ОБСЕ, МККК и более 800 местных жителей.', body_tj:'Рӯзи байналмилалии огоҳӣ аз хатари минаҳо дар Варзишгоҳи марказӣ бо иштироки намояндагони ДД ИМА, СААМ ва зиёда аз 800 сокинон таҷлил шуд.', image:null, link:'https://mineaction.tj/news/index.php?ELEMENT_ID=245', published_at:'2024-05-29', is_published:1, created_at:new Date().toISOString() },
    { id:3, title_en:'Victim Assistance TWG Meeting – Khujand', title_ru:'Заседание рабочей группы – Худжанд', title_tj:'Нишасти гурӯҳи кориӣ – Хуҷанд', excerpt_en:'31 participants gathered in Khujand to discuss implementation of the National Strategy 2021–2030 and Oslo Action Plan provisions on Victim Assistance.', excerpt_ru:'31 участник собрался в Худжанде для обсуждения реализации Национальной стратегии 2021–2030.', excerpt_tj:'31 иштирокчӣ дар Хуҷанд барои баррасии татбиқи Стратегияи миллии 2021–2030 ҷамъ шуданд.', body_en:'31 participants (10 women, 21 men) gathered in Khujand to discuss implementation of the National Strategy 2021–2030 and Oslo Action Plan provisions on Victim Assistance.', body_ru:'31 участник (10 женщин, 21 мужчина) собрался в Худжанде для обсуждения реализации Национальной стратегии 2021–2030.', body_tj:'31 иштирокчӣ (10 зан, 21 мард) дар Хуҷанд ҷамъ шуданд.', image:null, link:'https://mineaction.tj/news/index.php?ELEMENT_ID=244', published_at:'2024-04-26', is_published:1, created_at:new Date().toISOString() },
    { id:4, title_en:'Victim Assistance TWG Meeting – Bokhtar', title_ru:'Заседание рабочей группы – Бохтар', title_tj:'Нишасти гурӯҳи кориӣ – Бохтар', excerpt_en:'30 participants met in Bokhtar to discuss results of the National Strategy and TNMAC Annual Work Plan for 2024.', excerpt_ru:'30 участников встретились в Бохтаре для обсуждения результатов Национальной стратегии.', excerpt_tj:'30 иштирокчӣ дар Бохтар барои баррасии натиҷаҳои Стратегияи миллӣ ҷамъ шуданд.', body_en:'30 participants met in Bokhtar to discuss results of the National Strategy, Oslo Action Plan 2023 review, and TNMAC Annual Work Plan for 2024.', body_ru:'30 участников встретились в Бохтаре для обсуждения результатов Национальной стратегии и плана работы ГКРМТТ.', body_tj:'30 иштирокчӣ дар Бохтар барои баррасии натиҷаҳои Стратегияи миллӣ ва нақшаи кории МДМТ ҷамъ шуданд.', image:null, link:'https://mineaction.tj/news/index.php?ELEMENT_ID=243', published_at:'2024-03-05', is_published:1, created_at:new Date().toISOString() },
    { id:5, title_en:'Tree Planting Campaign at TNMAC Training Centre', title_ru:'Кампания по посадке деревьев в Учебном центре', title_tj:'Маъракаи шинонидани дарахтон дар Маркази таълимӣ', excerpt_en:'Humanitarian demining partners joined TNMAC staff for a tree-planting campaign at the TNMAC Training Center in Dushanbe.', excerpt_ru:'Партнёры по разминированию присоединились к сотрудникам ГКРМТТ для посадки деревьев в Душанбе.', excerpt_tj:'Шарикони минатозакунӣ ба кормандони МДМТ барои шинонидани дарахтон ҳамроҳ шуданд.', body_en:'Humanitarian demining partners joined TNMAC staff for a tree-planting and weeding campaign at the TNMAC Training Center in Dushanbe, strengthening community spirit and environmental awareness.', body_ru:'Партнёры по гуманитарному разминированию присоединились к сотрудникам ГКРМТТ для посадки деревьев в Учебном центре ГКРМТТ в Душанбе.', body_tj:'Шарикони гуманитарии минатозакунӣ ба кормандони МДМТ барои шинонидани дарахтон ва пок кардани Маркази таълимии МДМТ дар Душанбе ҳамроҳ шуданд.', image:null, link:'https://mineaction.tj/news/index.php?ELEMENT_ID=229', published_at:'2024-01-20', is_published:1, created_at:new Date().toISOString() },
  ]);
}

// Gallery — seed only if file missing
if (!fs.existsSync(filePath('gallery'))) {
  writeDB('gallery', [
    {id:1,title_en:'Mine Clearance Operations',title_ru:'Операции по разминированию',title_tj:'Амалиётҳои минатозакунӣ',image:'',category:'operations',sort_order:1,created_at:new Date().toISOString()},
    {id:2,title_en:'Mine Risk Education',title_ru:'Обучение минной безопасности',title_tj:'Таълими бехатарии минаҳо',image:'',category:'mre',sort_order:2,created_at:new Date().toISOString()},
    {id:3,title_en:'Victim Assistance Programme',title_ru:'Программа помощи пострадавшим',title_tj:'Барномаи кӯмак ба қурбониён',image:'',category:'victims',sort_order:3,created_at:new Date().toISOString()},
    {id:4,title_en:'Training & Capacity Building',title_ru:'Обучение и развитие потенциала',title_tj:'Омӯзиш ва рушди иқтидор',image:'',category:'training',sort_order:4,created_at:new Date().toISOString()},
    {id:5,title_en:'International Partners Visit',title_ru:'Визит международных партнёров',title_tj:'Боздиди шарикони байналмилалӣ',image:'',category:'events',sort_order:5,created_at:new Date().toISOString()},
    {id:6,title_en:'Field Survey Activities',title_ru:'Полевые обследования',title_tj:'Фаъолиятҳои баррасии майдонӣ',image:'',category:'operations',sort_order:6,created_at:new Date().toISOString()}
  ]);
}

// Contacts/Officials — seed only if file missing
if (!fs.existsSync(filePath('contacts'))) {
  writeDB('contacts', [
    {id:1,name:'Муминов Ш.',title_en:'Director General',title_ru:'Генеральный директор',title_tj:'Директори генералӣ',phone:'(992 37) 227-0947',email:'director@tnmac.gov.tj',photo:'',sort_order:1,created_at:new Date().toISOString()},
    {id:2,name:'Назаров А.',title_en:'Deputy Director',title_ru:'Заместитель директора',title_tj:'Муовини директор',phone:'(992 37) 221-6687',email:'deputy@tnmac.gov.tj',photo:'',sort_order:2,created_at:new Date().toISOString()},
    {id:3,name:'Рахматуллаев З.',title_en:'Head of Operations',title_ru:'Начальник оперативного отдела',title_tj:'Раиси шӯъбаи амалиётӣ',phone:'',email:'operations@tnmac.gov.tj',photo:'',sort_order:3,created_at:new Date().toISOString()},
    {id:4,name:'Давлатова М.',title_en:'Head of MRE Programme',title_ru:'Руководитель программы МБО',title_tj:'Роҳбари барномаи МРЕ',phone:'',email:'mre@tnmac.gov.tj',photo:'',sort_order:4,created_at:new Date().toISOString()},
    {id:5,name:'Ёров Б.',title_en:'Head of Victim Assistance',title_ru:'Руководитель помощи жертвам',title_tj:'Роҳбари кӯмак ба қурбониён',phone:'',email:'va@tnmac.gov.tj',photo:'',sort_order:5,created_at:new Date().toISOString()},
    {id:6,name:'Саидов П.',title_en:'International Relations',title_ru:'Международные отношения',title_tj:'Муносибатҳои байналмилалӣ',phone:'',email:'international@tnmac.gov.tj',photo:'',sort_order:6,created_at:new Date().toISOString()}
  ]);
}

console.log('✅ TNMAC Database (JSON) ready');
module.exports = db;
