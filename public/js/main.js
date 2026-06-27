/* ════════════════════════════════════════
   TNMAC – Main Frontend (Full i18n)
════════════════════════════════════════ */

// ── State ─────────────────────────────────────────────────
let currentLang = localStorage.getItem('tnmac_lang') || 'en';
let siteSettings = {};
const $ = id => document.getElementById(id);
const fmt = (d, lang) => {
  const locales = { en:'en-GB', ru:'ru-RU', tj:'tg-TJ' };
  try {
    return new Date(d).toLocaleDateString(locales[lang] || 'en-GB',
      { day:'numeric', month:'long', year:'numeric' });
  } catch { return d; }
};
const tr = key => (TRANSLATIONS[currentLang] || TRANSLATIONS.en)[key] || (TRANSLATIONS.en[key] || key);
const t  = (item, field) => item[`${field}_${currentLang}`] || item[`${field}_en`] || '';

// ════════════════════════════════════════
//  LANGUAGE ENGINE
// ════════════════════════════════════════
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('tnmac_lang', lang);
  document.documentElement.lang = lang;

  // Update lang buttons
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });

  // Apply all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = tr(key);
    if (val) el.innerHTML = val;
  });

  // Apply settings-driven text
  applySettings(siteSettings);

  // Re-render dynamic content
  renderNews();
  renderActivities();
  renderTimeline();
  renderStats();
  renderDonors();
  renderRegions();
  buildGalleryGrid(galleryItems, currentCat);
  renderContacts();
}

// Init language buttons
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.dataset.lang));
  if (btn.dataset.lang === currentLang) btn.classList.add('active');
});

// ════════════════════════════════════════
//  SETTINGS APPLICATION
// ════════════════════════════════════════
function applySettings(s) {
  if (!s || !Object.keys(s).length) return;

  // Hero — multilingual keys: hero_title_en / hero_title_ru / hero_title_tj
  const heroTitle = s[`hero_title_${currentLang}`] || s.hero_title || tr('hero_title_default');
  const heroSub   = s[`hero_sub_${currentLang}`]   || s.hero_sub   || tr('hero_sub_default');
  const heroTag   = s[`hero_tag_${currentLang}`]   || s.hero_tag   || tr('hero_tag_default');
  const btn1      = s[`hero_btn1_${currentLang}`]  || s.hero_btn1  || tr('hero_btn1_default');
  const btn2      = s[`hero_btn2_${currentLang}`]  || s.hero_btn2  || tr('hero_btn2_default');

  if ($('hero-tag'))   $('hero-tag').textContent   = heroTag;
  if ($('hero-title')) $('hero-title').innerHTML   = heroTitle;
  if ($('hero-sub'))   $('hero-sub').textContent   = heroSub;
  if ($('hero-btn1'))  $('hero-btn1').textContent  = btn1;
  if ($('hero-btn2'))  $('hero-btn2').textContent  = btn2;
  if ($('nav-badge') && s.nav_badge) $('nav-badge').textContent = s.nav_badge;

  // Colors from admin settings
  if (s.color_primary) document.documentElement.style.setProperty('--accent', s.color_primary);
  if (s.color_dark)    document.documentElement.style.setProperty('--dark',   s.color_dark);
  if (s.color_navy)    document.documentElement.style.setProperty('--navy',   s.color_navy);

  // Footer contact
  const addr  = s.address || '';
  const phone = s.phone   || '';
  const email = s.email   || '';
  if ($('footer-contact'))
    $('footer-contact').innerHTML = `${addr} &nbsp;|&nbsp; Tel: ${phone} &nbsp;|&nbsp; <a href="mailto:${email}" style="color:inherit">${email}</a>`;

  // Page title
  if (s.site_title) document.title = s.site_title;

  // Regions text
  const rTitle = s[`regions_title_${currentLang}`] || s.regions_title_en || '';
  const rBody  = s[`regions_body_${currentLang}`]  || s.regions_body_en  || '';
  if ($('regions-title') && rTitle) $('regions-title').textContent = rTitle;
  if ($('regions-body')  && rBody)  $('regions-body').textContent  = rBody;
}

// ════════════════════════════════════════
//  NAVBAR
// ════════════════════════════════════════
$('burger').addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('open');
});
window.addEventListener('scroll', () => {
  document.querySelector('nav').classList.toggle('scrolled', window.scrollY > 60);
});

// ════════════════════════════════════════
//  PARTICLES
// ════════════════════════════════════════
(function(){
  const c = $('particles');
  const pColors = ['#25C26E','#52d688','#a8f0c6','#1FAD60','#d4f7e4','#0f9e55','#7ae8b0'];
  for(let i=0;i<45;i++){
    const d = document.createElement('div');
    d.className = 'particle';
    const s = Math.random()*10+2;
    const col = pColors[Math.floor(Math.random()*pColors.length)];
    d.style.cssText = `width:${s}px;height:${s}px;left:${Math.random()*100}%;
      background:${col};box-shadow:0 0 ${Math.round(s*2)}px ${col};
      animation-duration:${Math.random()*14+7}s;animation-delay:${Math.random()*12}s;`;
    c.appendChild(d);
  }
})();

// ════════════════════════════════════════
//  PARALLAX
// ════════════════════════════════════════
window.addEventListener('scroll', () => {
  const hero = $('hero');
  const content = hero?.querySelector('.hero-content');
  const s = window.scrollY;
  if (content && s < window.innerHeight) {
    content.style.transform = `translateY(${s*0.35}px)`;
    content.style.opacity   = 1 - (s / window.innerHeight) * 1.4;
  }
});

// ════════════════════════════════════════
//  INTERSECTION OBSERVERS
// ════════════════════════════════════════
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('visible');
    e.target.querySelectorAll?.('.region-bar').forEach(b => b.style.width = b.dataset.w + '%');
    e.target.querySelectorAll?.('.ring-progress').forEach(r => animateRing(r));
  });
}, { threshold: 0.15 });

function observeAll() {
  document.querySelectorAll('.fade-up,.fade-left,.fade-right').forEach(el => observer.observe(el));
}

// Rings
const ringObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting)
      e.target.querySelectorAll('.ring-progress').forEach(r => animateRing(r));
  });
}, { threshold: 0.3 });
document.querySelectorAll('.ring-item').forEach(el => ringObs.observe(el));

function animateRing(r) {
  const offset = 283 - (283 * Number(r.dataset.pct) / 100);
  setTimeout(() => {
    r.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)';
    r.style.strokeDashoffset = offset;
  }, 300);
}

// Counters
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting && !e.target.dataset.counted) {
      e.target.dataset.counted = '1';
      const raw = (e.target.dataset.target || '').replace(/[^0-9]/g, '');
      const target = parseInt(raw);
      if (isNaN(target)) return;
      const dur = 2000, start = performance.now();
      const step = now => {
        const p = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 4);
        e.target.textContent = Math.floor(ease * target).toLocaleString();
        if (p < 1) requestAnimationFrame(step);
        else e.target.textContent = target.toLocaleString();
      };
      requestAnimationFrame(step);
    }
  });
}, { threshold: 0.5 });

// Regions bars
const regionObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting)
      e.target.querySelectorAll('.region-bar')
        .forEach(b => setTimeout(() => b.style.width = b.dataset.w + '%', 200));
  });
}, { threshold: 0.2 });
const regSec = $('regions');
if (regSec) regionObs.observe(regSec);

// ════════════════════════════════════════
//  CHARTS (lazy init)
// ════════════════════════════════════════
Chart.defaults.color = 'rgba(255,255,255,.65)';
Chart.defaults.borderColor = 'rgba(255,255,255,.1)';
let chartsInitialized = false;

function initCharts() {
  if (chartsInitialized) return;
  chartsInitialized = true;

  // Animate chart cards in
  document.querySelectorAll('.chart-card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    setTimeout(() => {
      card.style.transition = 'opacity .6s ease, transform .6s ease';
      card.style.opacity = '1';
      card.style.transform = 'none';
    }, i * 150);
  });

  // Shared tooltip style
  const tooltip = {
    backgroundColor:'rgba(10,15,26,.95)',
    borderColor:'rgba(37,194,110,.3)',
    borderWidth:1,
    padding:14,
    titleColor:'#25C26E',
    bodyColor:'rgba(255,255,255,.85)',
    cornerRadius:10,
    displayColors:true,
    boxPadding:4
  };

  // ── Chart 1: Line — Mine Incidents ──
  const ctx1 = $('chartIncidents').getContext('2d');
  const grad1 = ctx1.createLinearGradient(0, 0, 0, 280);
  grad1.addColorStop(0,   'rgba(37,194,110,.35)');
  grad1.addColorStop(0.6, 'rgba(37,194,110,.08)');
  grad1.addColorStop(1,   'rgba(37,194,110,0)');

  new Chart(ctx1, {
    type: 'line',
    data: {
      labels: ['2018','2019','2020','2021','2022','2023','2024'],
      datasets: [{ label: tr('nav_stats'), data: [18,15,12,9,7,5,3],
        borderColor:'#25C26E', backgroundColor: grad1,
        fill: true, tension: .42, borderWidth: 2.5,
        pointBackgroundColor:'#25C26E', pointBorderColor:'#fff',
        pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 9,
        pointHoverBackgroundColor:'#fff', pointHoverBorderColor:'#25C26E',
        pointHoverBorderWidth: 3 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 1800, easing: 'easeOutQuart' },
      plugins: { legend:{display:false}, tooltip },
      scales: {
        x: { grid:{color:'rgba(255,255,255,.04)'}, ticks:{color:'rgba(255,255,255,.5)',font:{size:11}} },
        y: { grid:{color:'rgba(255,255,255,.04)'}, ticks:{color:'rgba(255,255,255,.5)',font:{size:11}}, beginAtZero:true }
      },
      interaction: { mode:'index', intersect:false }
    }
  });

  // ── Chart 2: Bar — Land Released ──
  new Chart($('chartLand'), {
    type: 'bar',
    data: {
      labels: ['Sughd','Khatlon','GBAO','RRS'],
      datasets: [{ label:'km²', data:[92,75,62,31],
        backgroundColor:['rgba(37,194,110,.85)','rgba(59,130,246,.85)','rgba(245,158,11,.85)','rgba(239,68,68,.85)'],
        borderColor:['#1FAD60','#2563eb','#d97706','#dc2626'],
        borderWidth: 2, borderRadius: 12, borderSkipped: false }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: {
        duration: 1400, easing: 'easeOutBounce',
        delay: ctx => ctx.dataIndex * 120
      },
      plugins: { legend:{display:false}, tooltip },
      scales: {
        x: { grid:{display:false}, ticks:{color:'rgba(255,255,255,.5)'} },
        y: { grid:{color:'rgba(255,255,255,.04)'}, ticks:{color:'rgba(255,255,255,.5)'}, beginAtZero:true }
      }
    }
  });

  // ── Chart 3: Bar — MRE Beneficiaries ──
  new Chart($('chartMRE'), {
    type: 'bar',
    data: {
      labels: ['2019','2020','2021','2022','2023','2024'],
      datasets: [{ label:'MRE', data:[9500,7200,11000,13400,15800,18200],
        backgroundColor:['rgba(59,130,246,.8)','rgba(99,102,241,.8)','rgba(139,92,246,.8)',
                         'rgba(167,139,250,.8)','rgba(37,194,110,.85)','rgba(31,173,96,.85)'],
        borderColor:['#2563eb','#4f46e5','#7c3aed','#7c3aed','#1FAD60','#198248'],
        borderWidth: 2, borderRadius: 8, borderSkipped: false }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: {
        duration: 1600, easing: 'easeOutCubic',
        delay: ctx => ctx.dataIndex * 100
      },
      plugins: { legend:{display:false}, tooltip },
      scales: {
        x: { grid:{display:false}, ticks:{color:'rgba(255,255,255,.5)'} },
        y: { grid:{color:'rgba(255,255,255,.04)'}, ticks:{color:'rgba(255,255,255,.5)'}, beginAtZero:true }
      }
    }
  });

  // ── Chart 4: Doughnut — Donors ──
  const donorLabels = {
    en: ['US Dept. of State','OSCE','FSD Switzerland','NPA Norway','ICRC','UNDP','Other'],
    ru: ['Госдеп США','ОБСЕ','ШФ Швейцария','НПА Норвегия','МККК','ПРООН','Другие'],
    tj: ['ДД ИМА','СААМ','ФШД Швейтсария','НПА Норвегия','КШББ','БТММ','Дигарон'],
  };
  new Chart($('chartDonors'), {
    type: 'doughnut',
    data: {
      labels: donorLabels[currentLang] || donorLabels.en,
      datasets: [{ data:[28,22,18,14,9,6,3],
        backgroundColor:['#25C26E','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'],
        borderColor:'#1c2a3e', borderWidth:3, hoverOffset:18,
        hoverBorderColor:'rgba(255,255,255,.3)' }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout:'62%',
      animation: { animateRotate:true, animateScale:true, duration:1600, easing:'easeOutQuart' },
      plugins: {
        legend: { position:'right', labels:{ padding:16, font:{size:11}, color:'rgba(255,255,255,.65)',
          usePointStyle:true, pointStyleWidth:10 } },
        tooltip: { ...tooltip, callbacks:{
          label: ctx => ` ${ctx.label}: ${ctx.parsed}%`
        }}
      }
    }
  });
}

const chartsObs = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) initCharts();
}, { threshold: 0.15 });
chartsObs.observe($('charts'));

// ════════════════════════════════════════
//  DATA RENDERERS
// ════════════════════════════════════════

// ── Stats ─────────────────────────────────────────────────
async function renderStats() {
  try {
    const rows = await (await fetch('/api/stats')).json();
    const grid = $('stats-grid');
    grid.innerHTML = rows.map(s => `
      <div class="stat-card fade-up" style="--c:${s.color}">
        <div class="stat-icon">${s.icon || ''}</div>
        <div class="stat-number" data-target="${s.value_en.replace(/[^0-9]/g,'')}">${s.value_en}</div>
        <div class="stat-label">${t(s,'label')}</div>
        ${s.badge ? `<div class="stat-change ${s.badge_type||'up'}">${s.badge}</div>` : ''}
      </div>`).join('');
    grid.querySelectorAll('.stat-number[data-target]').forEach(el => counterObs.observe(el));
    observeAll();
  } catch(e) { console.warn('Stats error', e); }
}

// ── News ──────────────────────────────────────────────────
async function renderNews() {
  try {
    const rows = await (await fetch('/api/news?limit=6')).json();
    const grid = $('news-grid');
    grid.innerHTML = rows.map((n, i) => `
      <div class="news-card fade-up" data-delay="${(i%5)+1}" onclick="openNewsModal(${n.id})">
        ${n.image ? `<img class="news-card-img" src="${n.image}" alt="${t(n,'title')}" loading="lazy"/>` : ''}
        <div class="news-date">${fmt(n.published_at, currentLang)}</div>
        <h3>${t(n,'title')}</h3>
        <p>${t(n,'excerpt')}</p>
        <button class="news-link">${tr('read_more')}</button>
      </div>`).join('');
    observeAll();
  } catch(e) { console.warn('News error', e); }
}

// ── Activities ────────────────────────────────────────────
async function renderActivities() {
  try {
    const rows = await (await fetch('/api/activities')).json();
    $('act-grid').innerHTML = rows.map((a, i) => `
      <div class="act-card fade-up" data-delay="${(i%5)+1}" style="--c:${a.color}">
        <div class="act-icon">${a.icon || ''}</div>
        <h3>${t(a,'title')}</h3>
        <p>${t(a,'body')}</p>
        ${a.tag_en ? `<span class="act-tag">${t(a,'tag')}</span>` : ''}
      </div>`).join('');
    observeAll();
  } catch(e) { console.warn('Activities error', e); }
}

// ── Timeline ──────────────────────────────────────────────
async function renderTimeline() {
  try {
    const rows = await (await fetch('/api/timeline')).json();
    $('timeline-wrap').innerHTML = rows.map((tl, i) => `
      <div class="tl-item">
        <div class="tl-year ${i%2===0?'fade-right':'fade-left'}">${tl.year}</div>
        <div class="tl-content ${i%2===0?'fade-left':'fade-right'}">
          <h4>${t(tl,'title')}</h4>
          <p>${t(tl,'body')}</p>
        </div>
      </div>`).join('');
    observeAll();
  } catch(e) { console.warn('Timeline error', e); }
}

// ── Donors ────────────────────────────────────────────────
async function renderDonors() {
  try {
    const rows = await (await fetch('/api/donors')).json();
    $('donor-logos').innerHTML = rows.map(d =>
      d.website
        ? `<a class="donor-pill" href="${d.website}" target="_blank" rel="noopener">${d.name}</a>`
        : `<div class="donor-pill">${d.name}</div>`
    ).join('');
  } catch(e) { console.warn('Donors error', e); }
}

// ── Regions ───────────────────────────────────────────────
async function renderRegions() {
  try {
    const rows = await (await fetch('/api/regions')).json();
    $('regions-bars').innerHTML = rows.map(r => `
      <div class="region-row">
        <span class="region-name">${r.name}</span>
        <div class="region-bar-wrap">
          <div class="region-bar" data-w="${r.pct}" style="width:0"></div>
        </div>
        <span class="region-pct">${r.pct}%</span>
        <span class="region-count">${r.area_km2||''}</span>
      </div>`).join('');
  } catch(e) { console.warn('Regions error', e); }
}

// ── Gallery ───────────────────────────────────────────────
let galleryItems = [];
let currentCat   = 'all';
let slideshowIdx = 0;
let slideshowTimer = null;

async function renderGallery() {
  try {
    galleryItems = await (await fetch('/api/gallery')).json();
    buildSlideshow(galleryItems);
    setActiveFilter('all');
    setTimeout(startFilterCycle, FILTER_INTERVAL);
  } catch(e) { console.warn('Gallery error', e); }
}

function buildSlideshow(items) {
  const track  = $('slideshow-track');
  const dotsEl = $('slide-dots');
  if (!track) return;
  const imgs = items.filter(i => i.image);

  if (!imgs.length) {
    track.innerHTML = `<div class="slide-item active"><div class="slide-placeholder"><div class="sp-icon">🖼️</div><span>${tr('gallery_empty')}</span></div></div>`;
    if (dotsEl) dotsEl.innerHTML = '';
    return;
  }

  // Fade+zoom: all positioned absolute, only .active is visible
  track.innerHTML = imgs.map((img, i) => `
    <div class="slide-item${i===0?' active':''}">
      <img src="${img.image}" alt="${t(img,'title')}" loading="lazy"/>
      <div class="slide-caption">${t(img,'title')}</div>
    </div>`).join('');

  if (dotsEl) {
    dotsEl.innerHTML = imgs.map((_,i) =>
      `<button class="slide-dot${i===0?' active':''}" data-idx="${i}"></button>`).join('');
    dotsEl.querySelectorAll('.slide-dot').forEach(btn =>
      btn.addEventListener('click', () => { goSlide(parseInt(btn.dataset.idx)); }));
  }

  if ($('slide-prev')) $('slide-prev').onclick = () => goSlide(slideshowIdx - 1);
  if ($('slide-next')) $('slide-next').onclick = () => goSlide(slideshowIdx + 1);

  slideshowIdx = 0;
  clearInterval(slideshowTimer);
  slideshowTimer = setInterval(() => goSlide(slideshowIdx + 1), 5000);
}

function goSlide(idx) {
  const track = $('slideshow-track');
  if (!track) return;
  const slides = track.querySelectorAll('.slide-item');
  if (!slides.length) return;

  slides[slideshowIdx]?.classList.remove('active');
  slideshowIdx = ((idx % slides.length) + slides.length) % slides.length;
  slides[slideshowIdx]?.classList.add('active');

  $('slide-dots')?.querySelectorAll('.slide-dot').forEach((d,i) =>
    d.classList.toggle('active', i === slideshowIdx));
  clearInterval(slideshowTimer);
  slideshowTimer = setInterval(() => goSlide(slideshowIdx + 1), 5500);
}

function buildGalleryGrid(items, cat) {
  const grid = $('gallery-grid');
  if (!grid) return;
  const filtered = cat === 'all' ? items : items.filter(i => i.category === cat);
  if (!filtered.length) {
    grid.innerHTML = `<div class="gallery-empty-msg">${tr('gallery_empty')}</div>`;
    return;
  }
  grid.innerHTML = filtered.map((item, i) => `
    <div class="gallery-item" style="animation-delay:${i*0.06}s" data-id="${item.id}" onclick="openLightbox(${item.id})">
      ${item.image
        ? `<img src="${item.image}" alt="${t(item,'title')}" loading="lazy"/>
           <div class="gallery-item-overlay"><div class="gallery-item-title">${t(item,'title')}</div></div>`
        : `<div class="gallery-item-placeholder"><div class="pi">🖼️</div><span>${t(item,'title')}</span></div>`}
    </div>`).join('');
}

// ── Gallery filter tabs — auto-cycle ─────────────────────
const FILTER_CATS = ['all','operations','mre','events','training'];
let filterAutoIdx  = 0;
let filterAutoTimer = null;
const FILTER_INTERVAL = 5000;

function setActiveFilter(cat) {
  document.querySelectorAll('.gf-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === cat);
    // animate progress bar on active button
    const bar = b.querySelector('.gf-progress');
    if (bar) { bar.style.transition='none'; bar.style.width='0'; }
    if (b.dataset.cat === cat && bar) {
      requestAnimationFrame(() => {
        bar.style.transition = `width ${FILTER_INTERVAL}ms linear`;
        bar.style.width = '100%';
      });
    }
  });
  currentCat = cat;
  buildGalleryGrid(galleryItems, cat);
}

function startFilterCycle() {
  clearInterval(filterAutoTimer);
  filterAutoTimer = setInterval(() => {
    filterAutoIdx = (filterAutoIdx + 1) % FILTER_CATS.length;
    setActiveFilter(FILTER_CATS[filterAutoIdx]);
  }, FILTER_INTERVAL);
}

document.querySelectorAll('.gf-btn').forEach(btn => {
  // Add progress bar element
  const bar = document.createElement('span');
  bar.className = 'gf-progress';
  btn.appendChild(bar);

  btn.addEventListener('click', () => {
    filterAutoIdx = FILTER_CATS.indexOf(btn.dataset.cat);
    setActiveFilter(btn.dataset.cat);
    // Reset auto-cycle timer on manual click
    clearInterval(filterAutoTimer);
    setTimeout(startFilterCycle, 8000);
  });
});

// ── Lightbox ──────────────────────────────────────────────
let lbItems = [];
let lbIdx   = 0;

function openLightbox(id) {
  lbItems = galleryItems.filter(i => i.image);
  if (!lbItems.length) return;
  lbIdx = lbItems.findIndex(i => i.id === id);
  if (lbIdx < 0) lbIdx = 0;
  showLightboxSlide();
  $('lightbox').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function showLightboxSlide() {
  const item = lbItems[lbIdx];
  if (!item) return;
  const img = $('lb-img');
  img.style.animation = 'none';
  img.offsetHeight; // reflow
  img.style.animation = '';
  img.src = item.image;
  img.alt = t(item,'title');
  $('lb-caption').textContent = t(item,'title');
  $('lb-counter').textContent = `${lbIdx+1} / ${lbItems.length}`;
}

$('lb-close').onclick = closeLightbox;
$('lb-prev').onclick  = () => { lbIdx = (lbIdx - 1 + lbItems.length) % lbItems.length; showLightboxSlide(); };
$('lb-next').onclick  = () => { lbIdx = (lbIdx + 1) % lbItems.length; showLightboxSlide(); };
$('lightbox').addEventListener('click', e => { if(e.target === $('lightbox')) closeLightbox(); });

document.addEventListener('keydown', e => {
  if ($('lightbox').style.display === 'flex') {
    if (e.key === 'ArrowLeft')  { lbIdx = (lbIdx-1+lbItems.length)%lbItems.length; showLightboxSlide(); }
    if (e.key === 'ArrowRight') { lbIdx = (lbIdx+1)%lbItems.length; showLightboxSlide(); }
  }
});

function closeLightbox() {
  $('lightbox').style.display = 'none';
  document.body.style.overflow = '';
}

// ── Contacts / Officials — Org Chart ─────────────────────
async function renderContacts() {
  try {
    const officials = await (await fetch('/api/contacts')).json();
    const grid = $('officials-grid');
    if (!grid) return;

    // Group by level (default level=1 if not set)
    const byLevel = {};
    officials.forEach(p => {
      const lvl = parseInt(p.level) || 1;
      if (!byLevel[lvl]) byLevel[lvl] = [];
      byLevel[lvl].push(p);
    });
    const levels = Object.keys(byLevel).map(Number).sort();

    const nodeHtml = (p) => {
      // Use name_en for English, original name for RU/TJ
      const displayName = (currentLang === 'en' && p.name_en) ? p.name_en : p.name;
      const initials = displayName.trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
      return `<div class="org-node fade-up">
        ${p.photo
          ? `<div class="org-photo-wrap"><img class="org-photo" src="${p.photo}" alt="${displayName}" loading="lazy"/></div>`
          : `<div class="org-avatar">${initials}</div>`}
        <div class="org-name">${displayName}</div>
        <div class="org-title">${t(p,'title')}</div>
        ${p.phone ? `<div class="org-phone">${p.phone}</div>` : ''}
        ${p.email ? `<a class="org-email" href="mailto:${p.email}">${p.email}</a>` : ''}
      </div>`;
    };

    let html = '<div class="org-chart">';
    levels.forEach((lvl, idx) => {
      if (idx > 0) {
        const count = byLevel[lvl].length;
        html += `<div class="org-connector">
          <div class="org-v-line"></div>
          ${count > 1 ? '<div class="org-h-line"></div>' : ''}
        </div>`;
      }
      html += `<div class="org-row level-${lvl}">`;
      byLevel[lvl].forEach(p => { html += nodeHtml(p); });
      html += '</div>';
    });
    html += '</div>';

    grid.innerHTML = html;

    // Update contact info from settings
    const s = siteSettings;
    if ($('c-address') && s.address) $('c-address').textContent = s.address;
    if ($('c-phone')   && s.phone)   $('c-phone').textContent   = s.phone;
    if ($('c-email')   && s.email) {
      $('c-email').textContent = s.email;
      $('c-email').href = 'mailto:' + s.email;
    }
    observeAll();
  } catch(e) { console.warn('Contacts error', e); }
}

// ── Settings ──────────────────────────────────────────────
async function loadSettings() {
  try {
    siteSettings = await (await fetch('/api/settings')).json();
    applySettings(siteSettings);
  } catch(e) { console.warn('Settings error', e); }
}

// ════════════════════════════════════════
//  NEWS MODAL
// ════════════════════════════════════════
async function openNewsModal(id) {
  const modal = $('news-modal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  try {
    const n = await (await fetch(`/api/news/${id}`)).json();
    $('modal-date').textContent = fmt(n.published_at, currentLang);
    $('modal-title').textContent = t(n, 'title');
    $('modal-body').innerHTML = (t(n,'body') || t(n,'excerpt') || '').replace(/\n/g,'<br/>');

    // Attachments
    let extra = '';
    if (n.attachments?.length) {
      const icons = {pdf:'📄', doc:'📝', docx:'📝', xls:'📊', xlsx:'📊', ppt:'📑', pptx:'📑', zip:'🗜️'};
      extra += `<div style="margin-top:1.2rem;border-top:1px solid rgba(255,255,255,.08);padding-top:1rem">
        <div style="font-size:.75rem;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:.6rem">📎 Attachments</div>
        ${n.attachments.map(a => {
          const ext = a.name.split('.').pop().toLowerCase();
          const ic = icons[ext] || '📁';
          return `<a href="${a.url}" target="_blank" download style="display:flex;align-items:center;gap:.5rem;padding:.5rem .75rem;margin:.3rem 0;
            background:rgba(37,194,110,.08);border:1px solid rgba(37,194,110,.2);border-radius:8px;
            color:#fff;text-decoration:none;font-size:.82rem;transition:background .2s;"
            onmouseover="this.style.background='rgba(37,194,110,.16)'" onmouseout="this.style.background='rgba(37,194,110,.08)'">
            <span>${ic}</span><span>${a.name}</span>
            <span style="margin-left:auto;font-size:.72rem;color:#9ca3af">${Math.round((a.size||0)/1024)}KB ↓</span>
          </a>`;
        }).join('')}
      </div>`;
    }

    // Poll
    if (n.poll?.question) {
      const total = n.poll.options.reduce((s,o)=>s+(o.votes||0),0);
      extra += `<div style="margin-top:1.2rem;border-top:1px solid rgba(255,255,255,.08);padding-top:1rem" id="poll-${id}">
        <div style="font-size:.75rem;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:.8rem">📊 Poll</div>
        <div style="font-size:.95rem;font-weight:700;color:#fff;margin-bottom:1rem">${n.poll.question}</div>
        ${n.poll.options.map((o,i)=>{
          const pct = total ? Math.round((o.votes||0)/total*100) : 0;
          return `<button onclick="voteOnPoll(${id},${i})" style="display:block;width:100%;text-align:left;
            background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;
            padding:.65rem 1rem;margin:.4rem 0;cursor:pointer;transition:all .2s;color:#fff;font-size:.875rem;"
            onmouseover="this.style.background='rgba(37,194,110,.1)';this.style.borderColor='rgba(37,194,110,.3)'"
            onmouseout="this.style.background='rgba(255,255,255,.04)';this.style.borderColor='rgba(255,255,255,.08)'">
            <div style="display:flex;justify-content:space-between">
              <span>${o.text}</span><span style="color:#25C26E;font-weight:700">${pct}%</span>
            </div>
            <div style="margin-top:.35rem;height:4px;background:rgba(255,255,255,.08);border-radius:4px">
              <div style="width:${pct}%;height:100%;background:#25C26E;border-radius:4px;transition:width .6s"></div>
            </div>
          </button>`;
        }).join('')}
        <div style="font-size:.72rem;color:#9ca3af;margin-top:.5rem">${total} vote${total!==1?'s':''}</div>
      </div>`;
    }

    const mb = $('modal-body');
    mb.insertAdjacentHTML('afterend', `<div id="modal-extra">${extra}</div>`);
    // Remove old extra if re-opened
    document.querySelectorAll('#modal-extra').forEach((el,i)=>{ if(i>0) el.remove(); });

    const link = $('modal-link');
    if (link) link.style.display = 'none';
  } catch(e) { console.warn(e); }
}

async function voteOnPoll(newsId, optIdx) {
  try {
    const res = await fetch(`/api/news/${newsId}/vote`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({option: optIdx})
    });
    const data = await res.json();
    // Re-open modal to refresh poll
    $('modal-extra')?.remove();
    openNewsModal(newsId);
  } catch(e) { console.warn(e); }
}

$('modal-close').addEventListener('click', closeModal);
$('news-modal').addEventListener('click', e => { if (e.target === $('news-modal')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
function closeModal() {
  $('news-modal').style.display = 'none';
  document.body.style.overflow = '';
}

// ════════════════════════════════════════
//  INIT
// ════════════════════════════════════════
async function init() {
  // Apply static translations first
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = tr(el.dataset.i18n);
    if (val) el.innerHTML = val;
  });

  // Load settings
  await loadSettings();

  // Load all dynamic content in parallel
  await Promise.all([
    renderStats(),
    renderNews(),
    renderActivities(),
    renderTimeline(),
    renderDonors(),
    renderRegions(),
    renderGallery(),
    renderContacts()
  ]);

  observeAll();
}

init();
