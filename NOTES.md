# Köy Kapısı — proje notları

Telefonda dikey oynanan, izometrik, tek kişilik köy stratejisi. Saf HTML/CSS/JS, kütüphane yok.
Kaynak kod: GitHub `mehmetatilay/Villagedoor` (ana dal `main`). Oynanan sürüm: çok dosyalı Artifact "Köy Kapısı"; her değişiklikte depo ve Artifact birlikte güncellenir.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `index.html` | Sayfa iskeleti: giriş/bitiş/duraklat pencereleri, üst çubuk, komuta şeridi, tepsi. Scriptleri sırayla yükler. |
| `css/style.css` | Tüm stiller. Renk ve yazı tipleri `:root` içinde. Tek koyu tema (bilerek). |
| `js/config.js` | Sabitler: meslekler, bina maliyetleri (`BSPEC`), emirler (`ORD`), geliştirmeler (`TECH`), seviyeler (`HLV`, `FLV`). Ortak durum değişkenleri (`G`, kamera). |
| `js/world.js` | Harita üretimi, zemin çizimi, kamera dönüşümleri, `newGame`, `freshMeta`. |
| `js/save.js` | `localStorage` kaydı (`koy-kapisi-kayit-v1`), yükleme ve eski kayıtlarla uyum. |
| `js/villagers.js` | Köylü davranışları: toplama, fidan dikme, araştırma, tarım, inşaat, güçlendirme, av, savaş. Emir sistemi (`order()`). |
| `js/enemies.js` | Kurt/akıncı dalgaları, hedef seçimi, hasar. |
| `js/update.js` | Oyun döngüsünün bir adımı: nüfus, kapı, fidan büyümesi, kuleler, bina seviyeleri, dalgalar, ipuçları. |
| `js/render.js` | Canvas çizimi: binalar, köylüler, bekleyen köylü balonu, ekran dışı düşman okları. |
| `js/ui.js` | Komuta şeridi, emir tepsisi, köylü/bina kartı, haber şeridi, üst çubuk. |
| `js/input.js` | Sürükleme, iki parmakla yakınlaştırma, haritaya dokunma. |
| `js/main.js` | Düğmeler, duraklat menüsü, açılış, ana döngü, otomatik kayıt. |
| `tests/sim.js` | Başsız 10 dk simülasyon + kaydet/yükle testi: `node tests/sim.js --save` |
| `tests/ui.js` | Chromium'da tıklama testi ve ekran görüntüleri: `NODE_PATH=/opt/npm-tools/node_modules node tests/ui.js` |

Scriptler sıradan (modül olmayan) script; üst düzey `const`/`let` dosyalar arasında paylaşılır. Yükleme sırası önemli.

## Oyun kuralları (şu anki)

- 10 kişiyle başlar, sırada beklerler. Kapıdan her **5 sn**'de bir kişi seçili meslekle çıkar.
- Yemek varsa (15) ve boş yer varsa nüfus artar. Yemek bitince sadece artış durur. Kişi başı yemek tüketimi 1/18 sn.
- **Ana bina yıkılırsa oyun biter.** Saldırılar varsayılan **kapalı**, duraklat menüsünden açılır.
- Dalgalar: ilk 120 sn, sonra 93 − 3×dalga sn (en az 57). Önce kurtlar, 3. dalgadan sonra akıncılar.
- Meslek binası yoksa meslek temel işini yapar; bina diğer emirleri açar. İşçiler topladığını en yakın teslim noktasına (kendi binası ya da ana bina) bırakır.

### Emirler

| Meslek | Bina | Emirler |
|---|---|---|
| Mühendis | Atölye (25 odun) | Ev yap · Tarla yap · Kule yap · Tamir et; ayrıca meslek binalarını bir kez yapar |
| Oduncu | Kamp (20 odun, 5 taş) | Odun kes · Ağaç dik (fidan 60 sn) · Testere geliştir |
| Madenci | Ocak (30 odun) | Taş kır · Kazma geliştir · Ana binayı güçlendir (5 taş → +20 can, en çok 20 kez) |
| Çiftçi | Çiftlik evi (25 odun, 10 taş) | Hasat et · Toprağı sür · Saban geliştir |
| Asker | Kışla (30 odun, 20 taş) | Nöbet tut · Talim yap · Avlan |

Geliştirmeler çalışan sayısı × süre ile ilerler: Testere 200/400, Kazma 160/320, Saban 160/320, Talim 120/240/360. Her seviye %40 hız (talimde %25 güç).

### Binalar

- Ev 30 odun + 15 taş. Hasarsız kaldıkça büyür: 5 → 7 (90 sn) → 10 kişi (150 sn).
- Tarla 20 odun. 2 → 3 → 4 çiftçi, aynı süreler. "Toprağı sür" her turda +12 sn gelişim verir.
- Kule 20 odun + 30 taş. 6,5 kare menzil, 1,2 sn'de bir 10 hasar.

## Arayüz kararları

- Bütün kararlar alttaki **komuta şeridinde**: meslek ikonu = kapıdan o meslek çıksın, altındaki düğme = emir tepsisi.
- Tepsi şeridin üstünde açılır, köyün üst yarısı hep görünür. Açıklama sadece seçili emirde, tek satır.
- Durum önce renk/ikonla: sütunda kırmızı rozet, köylünün başında "!" balonu. Neden tepside yazar.
- Gizli hareket (kaydırma, basılı tutma) yok; her şey görünen düğme. Dokunma alanı en az 44 px.
- Haber şeridi tek satır, aynı anda tek mesaj.
- Tasarım panosu ayrı bir Design Artifact'ta: "Köy Kapısı Arayüz Önerisi".

## Kullanıcının istekleri ve kararları

- Dikey ekran, telefon öncelikli; kullanıcı telefon, tablet ve PC'den yazıyor.
- Yemek bitince ölüm yok, sadece üreme durur. Tıkanma önlemi: geri çağırma + çiftçi yemek harcamadan üretir.
- Evler/tarlalar beklemeyle seviye atlar. Saldırı aralıkları 1,5 kat uzatıldı.
- Oyuncu sadece yönlendirir ("karar verme"), mikro yönetim yok; ama sık karar gerektiren emir sistemi istendi.
- Ekonomi oturana kadar saldırılar kapalı.

## Açık konular

- Denge: testere sonrası odun çok birikiyor, darboğaz taş.
- Konuşulan ama yapılmayan fikirler: mevsimler, olay kartları (göçmen, tüccar), asker toplanma noktası.
