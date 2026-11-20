/* ══ MathGame · js/features/bg-library.js ══ (index.html'de sırayla yüklenir) */
/* ════════════════════════════════════════════════════════════
   ARKA PLAN KÜTÜPHANESİ — CSS gradient koleksiyonu
   ════════════════════════════════════════════════════════════ */

var BG_LIBRARY = [
  {
    cat: '🌿 Doğa & Orman',
    items: [
      { id:'n_forest1',  name:'Sisli Orman',     photo:'1448375240586-882707db888b', fallback:'linear-gradient(135deg,#0a2e0a,#1a5e1a,#2d8a2d)' },
      { id:'n_forest2',  name:'Orman Işığı',     photo:'1542601906990-b4d3fb778b09', fallback:'linear-gradient(160deg,#0a1e06,#1a4010,#2d6020)' },
      { id:'n_forest3',  name:'Ormanlık Yol',    photo:'1425913397705-9d9b0d5c3b5a', fallback:'linear-gradient(180deg,#061008,#102010,#204020)' },
      { id:'n_forest4',  name:'Bambu',           photo:'1518495973542-4542adad0218', fallback:'linear-gradient(160deg,#0a1a04,#1c3808,#2e5010)' },
      { id:'n_mtn1',     name:'Dağ Zirvesi',     photo:'1464822759023-fed622ff2c3b', fallback:'linear-gradient(180deg,#0d1b2e,#2e5f8a,#e8e8ee)' },
      { id:'n_mtn2',     name:'Karlı Dağ',       photo:'1501854140801-50d01698950b', fallback:'linear-gradient(180deg,#0a1020,#2040a0,#e0e8ff)' },
      { id:'n_mtn3',     name:'Göl Manzarası',   photo:'1506905925346-21bda4d32df4', fallback:'linear-gradient(180deg,#061428,#104070,#4090c0)' },
      { id:'n_aurora',   name:'Kuzey Işığı',     photo:'1531366936337-7c912a4589a7', fallback:'linear-gradient(135deg,#020810,#083820,#00c870,#00a850)' },
      { id:'n_waterfall',name:'Şelale',          photo:'1432405972618-c3b346fe0a9f', fallback:'linear-gradient(160deg,#021018,#066090,#40c8e0)' },
    ]
  },
  {
    cat: '🌊 Deniz & Sahil',
    items: [
      { id:'w_ocean1',   name:'Okyanus',         photo:'1505118380757-91f5f5632de0', fallback:'linear-gradient(180deg,#020b18,#0556a0,#04a8e4)' },
      { id:'w_beach1',   name:'Sahil',           photo:'1507525428034-b723cf961d3e', fallback:'linear-gradient(160deg,#021b2e,#0576a8,#038cc4)' },
      { id:'w_beach2',   name:'Tropikal',        photo:'1519046904884-53103b34b206', fallback:'linear-gradient(180deg,#021828,#0880a0,#40c0d8)' },
      { id:'w_wave',     name:'Dalga',           photo:'1518020382113-a7e8fc38eac9', fallback:'linear-gradient(180deg,#020c18,#0c4890,#20a8e0)' },
      { id:'w_under',    name:'Su Altı',         photo:'1682687219573-3fd75b570f1d', fallback:'linear-gradient(180deg,#000408,#002840,#004870)' },
      { id:'w_sunset',   name:'Deniz Günbatımı', photo:'1507003211169-0a1dd7228f2d', fallback:'linear-gradient(180deg,#0a0208,#600820,#f08020)' },
    ]
  },
  {
    cat: '🌅 Gökyüzü & Gün Batımı',
    items: [
      { id:'s_sunset1',  name:'Gün Batımı',      photo:'1470252649378-9c29740c9fa8', fallback:'linear-gradient(180deg,#0a0208,#c02010,#f8c030)' },
      { id:'s_sunset2',  name:'Turuncu Gökyüzü', photo:'1502481851512-e9e2529bfbf9', fallback:'linear-gradient(180deg,#080410,#d04010,#f8a820)' },
      { id:'s_clouds1',  name:'Bulutlar',        photo:'1517483000871-1dbf64a6e1c6', fallback:'linear-gradient(180deg,#060810,#304878,#90a8d0)' },
      { id:'s_clouds2',  name:'Fırtına Bulutu',  photo:'1492011221367-f47e3ccd77a0', fallback:'linear-gradient(160deg,#04060a,#101824,#283848)' },
      { id:'s_milkyway', name:'Samanyolu',       photo:'1419242902214-272b3f66ee7a', fallback:'radial-gradient(ellipse at 50% 50%,#1a1060,#06041a,#000008)' },
      { id:'s_stars',    name:'Yıldızlı Gece',   photo:'1534796636912-3b952d2ba7b9', fallback:'radial-gradient(ellipse at 70% 20%,#14043a,#06020e,#000005)' },
    ]
  },
  {
    cat: '🌌 Uzay',
    items: [
      { id:'sp_nebula',  name:'Nebula',          photo:'1462331940025-496dfbfc7564', fallback:'radial-gradient(ellipse at 60% 40%,#2a0050,#500080,#0a0020)' },
      { id:'sp_galaxy',  name:'Galaksi',         photo:'1543722530-d2c3201371e6', fallback:'radial-gradient(ellipse at 50% 50%,#1a1060,#06041a)' },
      { id:'sp_earth',   name:'Dünyadan Uzay',   photo:'1446776811953-b23d57bd21aa', fallback:'linear-gradient(160deg,#00040e,#001030,#002060)' },
      { id:'sp_moon',    name:'Ay',              photo:'1532693322450-2cb5c511067d', fallback:'radial-gradient(circle at 40% 40%,#c0c0d0,#404050,#000008)' },
    ]
  },
  {
    cat: '🏙 Şehir & Gece',
    items: [
      { id:'c_night1',   name:'Gece Şehri',      photo:'1477959858617-67f85cf4f1df', fallback:'linear-gradient(180deg,#020408,#0c2034,#101828)' },
      { id:'c_night2',   name:'Neon Sokak',      photo:'1514565131-ffa0fcde5f8b', fallback:'linear-gradient(180deg,#020408,#183060,#244080)' },
      { id:'c_bridge',   name:'Köprü Geceleri',  photo:'1426122402199-be02db90eb90', fallback:'linear-gradient(160deg,#04060a,#101824,#303e50)' },
      { id:'c_rain',     name:'Yağmurlu Cam',    photo:'1501691223387-dd0500403074', fallback:'linear-gradient(180deg,#04060a,#101828,#181e2c)' },
      { id:'c_tokyo',    name:'Tokyo',           photo:'1540959733332-eab4deabeeaf', fallback:'linear-gradient(180deg,#040208,#200840,#400060)' },
    ]
  },
  {
    cat: '🔮 Neon & Soyut',
    items: [
      { id:'ab_cyber1',  name:'Cyberpunk',       photo:'1518770660439-4636190af475', fallback:'linear-gradient(135deg,#040010,#1a0050,#000818)' },
      { id:'ab_neon1',   name:'Neon Işıklar',    photo:'1558618666-fcd25c85cd64', fallback:'linear-gradient(160deg,#000a04,#001808,#00ff66 40%)' },
      { id:'ab_geo',     name:'Geometrik',       photo:'1557682250-33bd709cbe85', fallback:'linear-gradient(135deg,#040814,#1428a0,#2840c0)' },
      { id:'ab_lava',    name:'Lav Lambası',     photo:'1560015534-cee980ba7e13', fallback:'radial-gradient(ellipse at 50% 80%,#800010,#200000,#000000)' },
      { id:'ab_liquid',  name:'Sıvı Renk',       photo:'1579546929518-9e396f3cc809', fallback:'linear-gradient(135deg,#0a0018,#1a0040,#300060)' },
      { id:'ab_smoke',   name:'Duman',           photo:'1520034475321-cbe63696469a', fallback:'linear-gradient(160deg,#04060a,#0c101a,#202030)' },
    ]
  },
  {
    cat: '🌸 Çiçek & Doğa Detay',
    items: [
      { id:'fl_cherry',  name:'Kiraz Çiçeği',    photo:'1522748906645-95d8adfd52c7', fallback:'linear-gradient(160deg,#0e0410,#702860,#f0a0c0)' },
      { id:'fl_sunfl',   name:'Ayçiçeği',        photo:'1490750967868-88df5691240e', fallback:'linear-gradient(160deg,#0c0800,#503010,#f8d060)' },
      { id:'fl_lavnd',   name:'Lavanta',         photo:'1499002238440-d264edd596ec', fallback:'linear-gradient(160deg,#0e0818,#6040a0,#a080d8)' },
      { id:'fl_autumn',  name:'Sonbahar',        photo:'1507003211169-0a1dd7228f2d', fallback:'linear-gradient(160deg,#0c0800,#602010,#d06020)' },
      { id:'fl_snow',    name:'Karlı Orman',     photo:'1418985991508-e47386d96a71', fallback:'linear-gradient(180deg,#060810,#204060,#c0dce8)' },
    ]
  },
];

/* ── Kütüphane Render ──────────────────────────────────── */
const UNSPLASH_BASE = 'https://images.unsplash.com/photo-';
const UNSPLASH_THUMB_PARAMS = '?w=400&q=65&fit=crop&auto=format';
const UNSPLASH_FULL_PARAMS  = '?w=1920&q=85&fit=crop&auto=format';

function renderBgLibrary() {
  try {
    const content = document.getElementById('bgLibContent');
    if (!content) return;

    content.innerHTML = '';

    BG_LIBRARY.forEach(category => {
      /* Kategori başlığı */
      const catTitle = document.createElement('div');
      catTitle.className = 'bglib-cat-title';
      catTitle.textContent = category.cat;
      content.appendChild(catTitle);

      /* Grid */
      const grid = document.createElement('div');
      grid.className = 'bglib-grid';

      category.items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'bglib-item' + (state.bgLibId === item.id ? ' active' : '');
        el.dataset.id = item.id;

        /* Fallback gradient arka plan */
        const fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'bg-fallback';
        fallbackDiv.style.background = item.fallback || '#0a1020';
        el.appendChild(fallbackDiv);

        /* Gerçek fotoğraf varsa img ekle */
        if (item.photo) {
          const img = document.createElement('img');
          img.className = 'loading';
          img.loading   = 'lazy';
          img.alt       = item.name;
          img.src       = UNSPLASH_BASE + item.photo + UNSPLASH_THUMB_PARAMS;

          img.onload = () => {
            try {
              img.classList.remove('loading');
              /* Yüklendi — fallback'i gizle */
              fallbackDiv.style.opacity = '0';
            } catch(e) {}
          };
          img.onerror = () => {
            try {
              /* Hata — fallback göster */
              img.style.display = 'none';
              fallbackDiv.style.opacity = '1';
            } catch(e) {}
          };

          el.appendChild(img);

          /* Wifi göstergesi */
          const netBadge = document.createElement('span');
          netBadge.className = 'bglib-net-badge';
          netBadge.textContent = '📡';
          el.appendChild(netBadge);
        }

        /* İsim etiketi */
        const label = document.createElement('span');
        label.textContent = item.name;
        el.appendChild(label);

        /* Tıklama */
        el.addEventListener('click', () => {
          try {
            content.querySelectorAll('.bglib-item.active').forEach(a => a.classList.remove('active'));
            el.classList.add('active');

            state.bgLibId = item.id;
            state.bgImage = null;

            if (item.photo) {
              /* Gerçek fotoğraf URL'si */
              const fullUrl = UNSPLASH_BASE + item.photo + UNSPLASH_FULL_PARAMS;
              state.bgLibGradient = null;
              state.bgLibPhotoUrl = fullUrl;
              applyBgLibPhoto(fullUrl, item.fallback);
            } else {
              state.bgLibGradient = item.fallback;
              state.bgLibPhotoUrl = null;
              applyBgLibGradient(item.fallback);
            }

            try { saveState(); } catch(e) {}
            showToast('🖼 ' + item.name + ' uygulandı');
          } catch(e) { console.warn('bglib click hata:', e); }
        });

        grid.appendChild(el);
      });

      content.appendChild(grid);
    });
  } catch(e) {
    console.warn('renderBgLibrary hata:', e);
  }
}

/* Gerçek fotoğrafı uygula — yüklenirken fallback göster */
function applyBgLibPhoto(url, fallback) {
  try {
    /* Önce fallback gradient göster */
    if (fallback) {
      document.body.style.backgroundImage    = fallback;
      document.body.style.backgroundSize     = 'cover';
    }
    document.body.classList.add('has-bg-image');
    if (bgLayer) bgLayer.style.background = 'rgba(4,6,14,0.55)';
    /* card-bg CSS class üzerinden yönetiliyor */

    /* Arka planda gerçek fotoğrafı yükle */
    const preloader = new Image();
    preloader.onload = () => {
      try {
        document.body.style.backgroundImage    = 'url(' + url + ')';
        document.body.style.backgroundSize     = 'cover';
        document.body.style.backgroundPosition = 'center center';
        document.body.style.backgroundRepeat   = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
      } catch(e) {}
    };
    preloader.onerror = () => {
      /* Yüklenemedi — fallback yeterli */
      showToast('⚠️ Fotoğraf yüklenemedi, gradient kullanılıyor', '#f59e0b');
    };
    preloader.src = url;
  } catch(e) { console.warn('applyBgLibPhoto hata:', e); }
}

/* ── Gradient arka planı uygula ──────────────────────── */
function applyBgLibGradient(gradient) {
  try {
    /* Önce custom fotoğrafı temizle */
    document.body.style.backgroundImage    = gradient;
    document.body.style.backgroundSize     = 'cover';
    document.body.style.backgroundPosition = 'center center';
    document.body.style.backgroundRepeat   = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';

    /* card-bg CSS class üzerinden yönetiliyor */
    document.body.classList.add('has-bg-image');

    /* bgLayer'ı şeffaf yap, gradient görünsün */
    bgLayer.style.background = 'rgba(4,6,14,0.55)';
  } catch(e) { console.warn('applyBgLibGradient hata:', e); }
}

/* ── Kaydedilmiş kütüphane seçimini uygula ─────────── */
function applyStoredBgLib() {
  try {
    if (state.bgLibGradient && !state.bgImage) {
      applyBgLibGradient(state.bgLibGradient);
    }
  } catch(e) {}
}

/* ── Modal aç/kapa ──────────────────────────────────── */
function openBgLib() {
  try {
    renderBgLibrary();
    document.getElementById('bgLibModal').classList.add('show');
  } catch(e) { console.warn('openBgLib hata:', e); }
}
function closeBgLib() {
  try {
    closeModal(document.getElementById('bgLibModal'));
  } catch(e) {}
}

/* ── Event listeners ─────────────────────────────────── */
document.addEventListener('click', (e) => {
  const libBtn   = e.target.closest('#bgLibBtn');
  const closeBtn = e.target.closest('#bgLibClose');
  if (libBtn)   { try { clickSound(); openBgLib();  } catch(e) {} }
  if (closeBtn) { try { clickSound(); closeBgLib(); } catch(e) {} }
});


/* ── Modal kapatma yardımcısı — animasyonlu ─────────── */
function closeModal(el, cb) {
  try {
    if (!el || !el.classList.contains('show')) return;
    el.classList.add('modal-closing');
    setTimeout(() => {
      try {
        el.classList.remove('show', 'modal-closing');
        if (cb) cb();
      } catch(e) {}
    }, 240);
  } catch(e) {
    if (el) el.classList.remove('show');
    if (cb) cb();
  }
}
