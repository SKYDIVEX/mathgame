# MathGame — dosya haritası

`index.html` sadece iskelet (HTML). Kod `css/` ve `js/` altında, **index.html'deki sırayla** yüklenir.
Tüm dosyalar klasik `<script>` — global scope ortak, yani fonksiyonlar birbirini eskisi gibi çağırır.

| Klasör | İçerik |
|---|---|
| `js/config.js` | WORKER_URL, APP_VERSION, hata yakalayıcılar, `mgOnReady` kapısı (en önce yüklenir) |
| `js/core/` | i18n, state/kayıt, DOM referansları, ses, yardımcılar |
| `js/ui/` | ekran geçişi, modallar, ayarlar, giriş ekranı, ripple |
| `js/game/` | oyun motoru (matematik + absürt), sayaç yamaları |
| `js/features/` | ekonomi, klan, başarımlar, istatistik/efektler, tema, günlük görevler, arka plan kütüphanesi |
| `js/auth/` | Firebase/Worker giriş, oturum, PIN |
| `js/admin/` | admin paneli, rozetler, süper admin |
| `js/social/` | sohbet, genel profil, etkinlik, duyuru/anket, geri bildirim, meydan okuma, klan sohbet |
| `js/boot/init.js` | açılış (INIT) — **tüm modüllerden sonra** çalışır |
| `js/patches/` | v3.1 / v3.2 yamaları |
| `js/boot/ready.js` | en son; `mgOnReady` ile bekleyen işleri serbest bırakır |

## Kurallar
- **Yeni dosya eklersen:** hem `index.html`'e `<script>` olarak hem `sw.js` içindeki `OFFLINE_URLS` listesine ekle.
- **Sıra önemli:** dosyanın üst düzeyinde (fonksiyon dışında) çalışan kod, *sonra* yüklenen bir dosyadaki
  fonksiyon/değişkeni kullanamaz. Fonksiyonların içinde kullanmak serbest (çağrıldığında hepsi yüklü olur).
- **Yayına çıkarken:** `index.html` ve `sw.js` içinde `?v=4.0` ifadesini bul-değiştir ile yükselt (tarayıcı eski dosyayı tutmasın diye).
