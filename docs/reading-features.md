# Okuma ve keşif özellikleri

- 20 satırdan uzun kod blokları kısaltılmış açılır. “Tamamını göster” tüm satırları açar; “Kopyala” her durumda tam içeriği kopyalar. Yazdırırken tam çıktı gösterilir.
- Yazı içindeki görseller düğmeyle büyütülür. Escape, Kapat veya pencere dışına tıklama kapatır. Mevcut görsel bağlantıları korunur. Başlıkta varsa figcaption, ardından anlamlı alt metni kullanılır; dosya adı alt metinleri nötr görsel numarasıyla gösterilir.
- `/search/` sayfası başlık, özet, içerik, kategori ve etiketlerde arar. Türkçe karakterler desteklenir; sorgu URL'de `?q=` ile paylaşılabilir. Sonuçlarda aşağı/yukarı oklar, temizlemek için Escape kullanılabilir.
- Yazı sonunda etiket/kategori ilişkisine göre en fazla üç yazı gösterilir. İlişki bulunamazsa bölüm “Diğer yazılar” olarak adlandırılır. RSS bağlantısı hem menüde hem yazı sonunda bulunur.

JavaScript kapalıyken yazı ve kodlar okunabilir; ilgili yazılar ve RSS çalışır. Arama ve görsel penceresi JavaScript kullanır. Arama için sunucu veya harici servis gerekmez; Hugo `index.json` üretir ve tema içindeki Fuse kullanılır.

## Doğrulama

Hugo extended ve Node.js kurulu bir ortamda:

```sh
npm ci
npm test
npm run build
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
```

Testler geçici içerik kullanır; gerçek bloga yazı eklemek testleri bozmaz. Tarayıcı testi ağ isteklerini yerel üretilmiş dosyalara yönlendirir ve sunucu açmaz. Varsayılan Chromium yolu `/usr/sbin/chromium`; ekran görüntüleri geçici bir dizine yazılır.

Bu sürümde Node/DOM testleri ve Hugo derlemesi çalıştırıldı. Sandbox Chromium'un başlamasını engellediği için gerçek tarayıcı kontrolü tamamlanamadı.
