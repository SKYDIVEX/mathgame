/* ══ MathGame · js/core/i18n.js ══ (index.html'de sırayla yüklenir) */
/* --------------------------
   MathGame v4.0 - Logic JS
   -------------------------- */

/* ══════════════════════════════════════════════
   i18n — Çok Dilli Destek Sistemi
   ══════════════════════════════════════════════ */

/* Tüm UI string'leri — kaynak dil: Türkçe */
var I18N_STRINGS = {
  /* Genel */
  'close':           'Kapat',
  'save':            'Kaydet',
  'cancel':          'İptal',
  'confirm':         'Onayla',
  'yes':             'Evet',
  'no':              'Hayır',
  'ok':              'Tamam',
  'loading':         'Yükleniyor...',
  'error':           'Hata',
  'success':         'Başarılı',
  'retry':           'Tekrar Dene',
  'back':            'Geri',
  'send':            'Gönder',
  'delete':          'Sil',
  'edit':            'Düzenle',
  'copy':            'Kopyala',
  'share':           'Paylaş',
  /* Auth */
  'login':           'Giriş Yap',
  'register':        'Kayıt Ol',
  'logout':          'Çıkış',
  'google_login':    'Google ile Devam Et',
  'email':           'E-posta',
  'password':        'Şifre',
  'display_name':    'Kullanıcı adı',
  'login_subtitle':  'Skorlarını kaydet, dünyayla yarış',
  'pin_set':         'PIN Belirle',
  'pin_login':       'PIN ile Giriş',
  'pin_sub':         'Google hesabına erişim olmadığında bu PIN ile girebilirsin.',
  'pin_enter':       'PIN gir',
  'pin_repeat':      'PIN tekrar',
  'pin_skip':        'Atla',
  /* Menü */
  'math_mode':       'Matematik',
  'math_sub':        'Klasik mod',
  'absurd_mode':     'Absürt',
  'absurd_sub':      'AI sorular',
  'play_btn':        'OYNA',
  'leaderboard':     'Liderlik',
  'local':           'Lokal',
  'online_tab':      '🌐 Online',
  'online_status':   'Online',
  'online':          'Online',
  'all_ops':         '🌍 Tümü',
  'mixed':           '🌀 Karma',
  'daily_tasks':     'Günlük Görevler',
  'stats':           'İstatistikler',
  'refresh':         'Yenile',
  'next_reset':      'Yenileme',
  'all_done':        '🌟 Tüm günlük görevleri tamamladın!',
  /* Oyun */
  'level':           'Seviye',
  'score':           'Puan',
  'correct':         'Doğru',
  'wrong':           'Yanlış',
  'streak':          'Seri',
  'pause':           'Duraklat',
  'resume':          'Devam Et',
  'menu':            'Ana Menü',
  'settings':        'Ayarlar',
  'score_board':     'Puan Tablosu',
  'level_up':        'Seviye Atladın!',
  'touch_continue':  'Devam etmek için dokun',
  'no_score':        'Puan yok, sadece eğlence 🎉',
  'score_mult':      'Puan Çarpanı',
  'paused':          'Oyun Duraklatıldı',
  'correct_msg':     'Doğru!',
  'wrong_msg':       'Yanlış!',
  'answer_input':    'Cevabın?',
  /* Profil */
  'profile':         'Profil',
  'about_me':        'Hakkımda',
  'username':        'Takma Ad',
  'new_password':    'Yeni Şifre',
  'pw_hint':         '(boş bırakırsan değişmez)',
  'save_profile':    '💾 Kaydet',
  'admin_panel':     'Admin Paneli',
  'set_pin':         'PIN Belirle / Değiştir',
  'request':         'İstek / Şikayet Gönder',
  'stat_score':      'Puan',
  'stat_level':      'Seviye',
  'stat_streak':     'En Seri',
  /* Başarımlar */
  'achievements':    'Başarımlar',
  'unlocked':        'kazanıldı',
  'locked':          'Henüz kazanılmadı',
  'ach_unlocked':    '🎉 Başarım Açıldı!',
  'rarity_legend':   'Efsane',
  'rarity_rare':     'Nadir',
  'rarity_valuable': 'Değerli',
  /* Ayarlar */
  'settings_title':  'Ayarlar',
  'sound':           'Ses açık',
  'ops_title':       'İşlem Türleri',
  'ops_hint':        'En az bir işlem türü seçili olmalı.',
  'level_speed':     'Seviye Atlama Hızı',
  'level_speed_desc':'Her {n} doğru cevaptan sonra seviye atla.',
  'theme':           'Tema',
  'bg_image':        'Arka Plan Resmi',
  'bg_clear':        '🗑 Temizle',
  'reset_score':     '🔁 Skoru Sıfırla',
  /* Public profil */
  'rank':            'Sıra',
  'joined':          'Kayıt',
  'online_now':      '🟢 Online',
  'offline':         'Çevrimdışı',
  /* Hakkında */
  'about':           'Hakkında',
  'how_to_play':     'Nasıl Oynanır',
  'version_history': 'Versiyon Geçmişi',
  'developer':       'Yapımcı',
  /* Toast mesajları */
  'toast_save_ok':   '✅ Profil kaydedildi',
  'toast_name_ok':   '✅ İsim güncellendi',
  'toast_pin_set':   '✅ PIN ayarlandı',
  'toast_logout':    '👋 Çıkış yapıldı',
  'toast_cloud':     '☁️ Skor buluttan yüklendi',
  'toast_copy':      '📋 Kopyalandı',
  /* Admin */
  'ban':             '🚫 Ban',
  'unban':           '✅ Banı Kaldır',
  'set_score':       '🏆 Skor Ayarla',
  'give_admin':      '👑 Admin Ver',
  'take_admin':      '❌ Admin Al',
  /* Hata mesajları */
  'err_answer':      'Cevap gir!',
  'err_number':      'Sayı gir!',
  'err_network':     'İnternet bağlantısı yok.',
  'err_login':       'Giriş başarısız',
  'err_session':     'Oturum geçersiz',
};

/* ── Sabit İngilizce çeviriler — Groq yok ── */
var EN_STRINGS = {
  'close':'Close','save':'Save','cancel':'Cancel','confirm':'Confirm','yes':'Yes','no':'No','ok':'OK',
  'loading':'Loading...','error':'Error','success':'Success','retry':'Retry','back':'Back',
  'send':'Send','delete':'Delete','edit':'Edit','copy':'Copy','share':'Share',
  'login':'Sign In','register':'Sign Up','logout':'Sign Out','google_login':'Continue with Google',
  'email':'Email','password':'Password','display_name':'Username',
  'login_subtitle':'Save your scores, compete worldwide',
  'pin_set':'Set PIN','pin_login':'Login with PIN',
  'pin_sub':'Use this PIN when Google is unavailable.',
  'pin_enter':'Enter PIN','pin_repeat':'Repeat PIN','pin_skip':'Skip',
  'math_mode':'Math','math_sub':'Classic mode','absurd_mode':'Absurd','absurd_sub':'AI questions',
  'play_btn':'PLAY','leaderboard':'Leaderboard','local':'Local',
  'online_tab':'🌐 Online','online_status':'Online','online':'Online',
  'all_ops':'🌍 All','mixed':'🌀 Mixed',
  'daily_tasks':'Daily Quests','stats':'Statistics','refresh':'Refresh',
  'next_reset':'Reset','all_done':'🌟 All daily quests completed!',
  'level':'Level','score':'Score','correct':'Correct','wrong':'Wrong',
  'streak':'Streak','pause':'Pause','resume':'Resume','menu':'Main Menu',
  'settings':'Settings','score_board':'Leaderboard','level_up':'Level Up!',
  'touch_continue':'Tap to continue','no_score':'No score, just fun 🎉',
  'score_mult':'Score Multiplier','paused':'Game Paused',
  'correct_msg':'Correct!','wrong_msg':'Wrong!','answer_input':'Your answer?',
  'profile':'Profile','about_me':'About Me','username':'Nickname',
  'new_password':'New Password','pw_hint':'(leave blank to keep current)',
  'save_profile':'💾 Save','admin_panel':'Admin Panel',
  'set_pin':'Set / Change PIN','request':'Send Request',
  'stat_score':'Score','stat_level':'Level','stat_streak':'Best Streak',
  'achievements':'Achievements','unlocked':'unlocked','locked':'Not yet unlocked',
  'ach_unlocked':'🎉 Achievement Unlocked!',
  'rarity_legend':'Legendary','rarity_rare':'Rare','rarity_valuable':'Valuable',
  'settings_title':'Settings','sound':'Sound on','ops_title':'Operation Types',
  'ops_hint':'At least one operation must be selected.',
  'level_speed':'Level Up Speed','level_speed_desc':'Level up every {n} correct answers.',
  'theme':'Theme','bg_image':'Background Image','bg_clear':'🗑 Clear','reset_score':'🔁 Reset Score',
  'rank':'Rank','joined':'Joined','online_now':'🟢 Online','offline':'Offline',
  'about':'About','how_to_play':'How to Play','version_history':'Version History','developer':'Developer',
  'toast_save_ok':'✅ Profile saved','toast_name_ok':'✅ Name updated',
  'toast_pin_set':'✅ PIN set','toast_logout':'👋 Signed out',
  'toast_cloud':'☁️ Score loaded from cloud','toast_copy':'📋 Copied',
  'ban':'🚫 Ban','unban':'✅ Unban','set_score':'🏆 Set Score',
  'give_admin':'👑 Give Admin','take_admin':'❌ Remove Admin',
  'err_answer':'Enter an answer!','err_number':'Enter a number!',
  'err_network':'No internet connection.','err_login':'Login failed',
  'err_session':'Session invalid',
  /* v3.1 — Eksik çeviriler */
  'clan':'Clan','clan_tab':'Clans','create_clan':'Create Clan','join_clan':'Join Clan',
  'clan_name':'Clan Name','clan_tag':'Tag','clan_desc':'Description',
  'clan_members':'Members','clan_score':'Clan Score','clan_rank':'Rank',
  'invite_link':'Invite Link','copy_link':'Copy','share_link':'Share',
  'discord_webhook':'Discord Integration','webhook_url':'Webhook URL',
  'webhook_save':'Save','webhook_test':'Test',
  'daily_quests':'Daily Quests','weekly_quests':'Weekly Quests',
  'permanent_quests':'Permanent','achievement_quests':'Achievements',
  'quest_claim':'Claim','quest_claimed':'Claimed','quest_done':'Done',
  'quest_progress':'Progress','quest_target':'Target',
  'absurd_loading':'AI is generating questions...','absurd_fallback':'Using local questions',
  'player_search':'Search Players','search_placeholder':'Search player...',
  'profile_page':'Profile','online_now_str':'🟢 Online',
  'download_app':'Download App','download_android':'Android APK',
  'download_ios':'iOS / Other','download_pwa':'Add to Home Screen',
  'push_on':'Notifications On','push_off':'Enable Notifications',
  'version_current':'Current','version_play_old':'⚠️ Play this version (no score saved)',
  'invite_accept':'✅ Accept','invite_decline':'Decline',
  'time_up':'Time\'s up!',
  'challenge_mode':'Challenge Mode','challenge_sub':'Race against time',
  'my_inventory':'My Inventory','chest':'Chest',
  'coins':'Coins','diamonds':'Diamonds','jokers':'Jokers',
  'shop_tab_jokers':'Jokers','shop_tab_avatars':'Avatars',
  'shop_tab_badges':'Badges','shop_tab_skins':'Skins',
};

var LANG_NAMES = {
  'tr': '🇹🇷 Türkçe',
  'en': '🇬🇧 English',
};

/* Aktif dil ve çeviri tablosu */
var _i18nLang = 'tr';
var _i18nTable = {};

/* Çeviri fonksiyonu */
function t(key, vars) {
  var text = (_i18nLang === 'en')
    ? (EN_STRINGS[key] || I18N_STRINGS[key] || key)
    : (I18N_STRINGS[key] || key);
  if (vars) {
    Object.keys(vars).forEach(function(k) {
      text = text.replace('{' + k + '}', vars[k]);
    });
  }
  return text;
}

/* Dili algıla */
function initI18n() {
  var savedLang = localStorage.getItem('mathgame_lang') || 'tr';
  _i18nLang = (savedLang === 'en') ? 'en' : 'tr';
  applyI18n();
  renderLangMenu();
}

/* Dil menüsünü render et */
function renderLangMenu() {
  var menu = document.getElementById('langMenu');
  if (!menu) return;
  menu.innerHTML = Object.entries(LANG_NAMES).map(function(e) {
    var active = e[0] === _i18nLang;
    return '<div onclick="switchLang(\'' + e[0] + '\')" style="padding:8px 12px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;color:' + (active ? 'var(--neon)' : 'var(--text)') + ';background:' + (active ? 'var(--neon-dim)' : 'transparent') + '">' + e[1] + '</div>';
  }).join('');
}

/* Dili değiştir */
function switchLang(lang) {
  if (lang !== 'tr' && lang !== 'en') lang = 'tr';
  _i18nLang = lang;
  localStorage.setItem('mathgame_lang', lang);
  applyI18n();
  renderLangMenu();
  var menu = document.getElementById('langMenu');
  if (menu) menu.style.display = 'none';
  showToast('✅ ' + LANG_NAMES[lang], '#00ff88');
}

function loadTranslations() {} /* artık kullanılmıyor */

/* DOM'daki data-i18n elementlerini güncelle */
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    var translated = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = translated;
    } else {
      el.textContent = translated;
    }
  });
  /* RTL diller */
  var rtlLangs = ['ar', 'fa', 'he', 'ur'];
  document.documentElement.dir = rtlLangs.includes(_i18nLang) ? 'rtl' : 'ltr';
  /* Dil seçici varsa güncelle */
  var sel = document.getElementById('langSelector');
  if (sel) sel.value = _i18nLang;
}

/* State */
