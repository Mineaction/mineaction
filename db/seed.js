/**
 * Local-mode seed data. Only writes a collection file if it does not yet exist.
 * (Supabase mode is seeded separately via supabase-schema.sql / scripts/migrate.js.)
 */
module.exports = function seed(filePath, writeDB, fs, bcrypt) {
  // Users
  if (!fs.existsSync(filePath('users'))) {
    const hash = bcrypt.hashSync('Admin@TNMAC2024!', 10);
    writeDB('users', [{
      id: 1, username: 'admin', password: hash, role: 'superadmin',
      created_at: new Date().toISOString()
    }]);
    console.log('✅ Admin user created: admin / Admin@TNMAC2024!');
  }

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

  if (!fs.existsSync(filePath('regions'))) {
    writeDB('regions', [
      { id:1, name:'Sughd', pct:88, area_km2:'~92 km²', sort_order:1 },
      { id:2, name:'Khatlon', pct:72, area_km2:'~75 km²', sort_order:2 },
      { id:3, name:'GBAO', pct:60, area_km2:'~62 km²', sort_order:3 },
      { id:4, name:'RRS', pct:38, area_km2:'~31 km²', sort_order:4 },
      { id:5, name:'Dushanbe', pct:12, area_km2:'~0 km²', sort_order:5 },
    ]);
  }
};
