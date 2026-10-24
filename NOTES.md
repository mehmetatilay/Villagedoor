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
| `js/town.js` | Yollar (aşınma → patika → toprak yol) ve mahalleler: kuruluş, ev arsası seçimi, yol çizimi. |
| `js/save.js` | `localStorage` kaydı (`koy-kapisi-kayit-v1`), yükleme ve eski kayıtlarla uyum. |
| `js/villagers.js` | Köylü davranışları: toplama, fidan dikme, araştırma, tarım, inşaat, güçlendirme, av, savaş. Emir sistemi (`order()`). |
| `js/enemies.js` | Kurt/akıncı dalgaları, hedef seçimi, hasar. |
| `js/update.js` | Oyun döngüsünün bir adımı: nüfus, kapı, fidan büyümesi, kuleler, bina seviyeleri, dalgalar, ipuçları. |
| `js/render.js` | Canvas çizimi: binalar, köylüler, bekleyen köylü balonu, ekran dışı düşman okları. |
| `js/ui.js` | Komuta şeridi, emir tepsisi, köylü/bina kartı, haber şeridi, üst çubuk. |
| `js/input.js` | Sürükleme, iki parmakla yakınlaştırma, haritaya dokunma. |
| `js/main.js` | Düğmeler, duraklat menüsü, açılış, ana döngü, otomatik kayıt. |
| `tests/sim.js` | Başsız 10 dk simülasyon + kaydet/yükle testi: `node tests/sim.js --save` |
| `tests/ui.js` | Chromium'da tıklama testi ve ekran görüntüleri: `node tests/ui.js` (önce `node tests/sim.js --save`) |

Scriptler sıradan (modül olmayan) script; üst düzey `const`/`let` dosyalar arasında paylaşılır. Yükleme sırası önemli.

## Yeni vizyon: köyden şehre (2026-10-24'te kararlaştırıldı)

Oyun bir köy savaş oyunundan **yaşayan bir şehir kurma oyununa** dönüşüyor: Caesar 3'teki gibi canlı sokaklar, Age of Empires'ın savaşsız hali, durmadan ama **yavaş** gelişen bir yerleşim. Oyuncu bina yerleştirmez; köyün muhtarıdır (sonra valisi), kararları mesleklere ve mahallelere verir.

### Tempo
- Obadan şehre kabaca **5 saatlik** oyun. Kayıt sistemi sayesinde birkaç oturumda oynanır. Gerekirse oyun hızlandırılır.

### Yerleşim aşamaları
Ana bina köyle birlikte büyür. Aşama atlamak kendiliğinden olmaz; mühendis ve mimarların malzeme ve zamanla yaptığı büyük bir projedir.

| Aşama | Ana bina | Kabaca nüfus |
|---|---|---|
| Oba | Muhtar kulübesi | 10–30 |
| Köy | Muhtarlık | 30–80 |
| Kasaba | Belediye konağı | 80–200 |
| İlçe | Hükümet konağı | 200–500 |
| Şehir | Valilik | 500+ |

### Önce düzen
- **Sokaklar kendiliğinden oluşur:** sık yürünen yerde çimen ezilip patika olur, patika toprak yola, mimarın olduğu yerde taş yola döner. Başta ilkel ve loş ama gelişigüzel değil.
- **Evler yola bakar:** rastgele boş kare yok, evler yol kenarındaki arsalara dizilir.
- **Mahalleler öbek öbek:** her mahalle kabaca 50 kişilik. Dolunca başka bir yerde yeni mahalle açılır ve yolla bağlanır. Mahalle kulübe kümesinden siteye kadar kendi içinde gelişir.

### Mahalle ihtiyaç basamakları
Mahalle bunları sırayla çıkar. Bir basamak karşılanınca sonrakinin binaları mahalle kartında açılır. Oyuncuya soru sorulmaz: neyin açık olduğunu mahallenin durumu, neyin yapılacağını oyuncu belirler.
1. **Barınma:** evler. Başta mahallede sadece evler var.
2. **İş ve yiyecek:** market, kuyu, mahalle işyerleri.
3. **Eğitim:** okul.
4. **Mimar:** mahallenin kendi mimarı; binalar gelişir, sokaklar düzelip güzelleşir.
- Sonra eklenebilir: ibadet, eğlence.

### İki seviye meslek
- **Muhtarın meslekleri (şehrin geneline hizmet eder):** Mühendis, Çiftçi, Oduncu, Taş ustası (madencinin yerine). Bugünkü emir mantığıyla çalışırlar, her mahalleye ve binaya giderler. Aşama büyüdükçe liste uzar. Asker şimdilik yok.
- **Mahallenin meslekleri (sadece o mahalleye hizmet eder):** mimar, market çalışanları, öğretmen, sucu…
- Hepsi insan olarak bir mahallede oturur. Şehre fazla adam almak mahallenin işyerlerini boş bırakır; denge oyuncunun işi.
- Mahalleli evden işe yürür, akşam döner. Mahalleler arası bu gidip gelme sokakları canlı tutar.

### Binaların içi: rollü çalışma yerleri
- Market: 1 satıcı + 1 taşıyıcı (tarladan mal getirir).
- Okul: 1 öğretmen, sonra 2.
- Kuyu: 1 sucu, evlere su taşır.

### Mahalle kartı
Mahalleye dokununca açılır, iki bölüm:
- **Bina kartı:** mahallenin basamağı ve açık binalar. Seçilen binayı muhtarın mühendisleri yapar.
- **Çalışan kartı:** işyerleri ve rolleri, her rolde − / + düğmesi, en altta boştaki kişi sayısı. Ayar bir kez yapılır ve kalır; yeni gelenler oranlara göre dağılır.
- Şehrin geneline ait işler (ana binanın büyümesi, mahalleler arası yollar, ticaret) ana binada.
- Mahalleler kararlara göre kimlik kazanabilir (aile mahallesi, zanaatkâr mahallesi); adı ve görüntüsü değişir.

### Yaşayan sokaklar
- Kadınlar ve erkekler kuyuya, pazara, işe gidip gelir; çocuklar ev önlerinde ve meydanda oynar.
- Gece–gündüz: akşam herkes evine döner, sokaklar boşalır.

### Yol haritası
1. **Düzen:** yollar/patikalar, yola dizilen evler, ilk mahalle (sadece barınma). Rastgele yerleşim kalkar. ✅ Yapıldı (bkz. "Yollar ve mahalleler").
2. **Yaşayan sokaklar:** sivil yürüyüşçüler, çocuklar, gece–gündüz.
3. **Mahalleler ve ihtiyaçlar:** mahalle kartı (bina + çalışan), basamaklar, market/kuyu/okul, yeni mahalle açılması.
4. **Aşamalar:** ana binanın büyümesi, aşamayla açılan meslekler, mahalle mimarı.
5. Ticaret (odun fazlası → taş), mevsimler, olaylar.
6. En son askeri işler.

## Oyun kuralları (şu anki sürüm, yeni vizyonla değişecek)

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

### Yollar ve mahalleler
- Köylünün bastığı kare aşınır. 12 sn yürünen kare **patika**, 70 sn yürünen **toprak yol** olur. Patikada %12, yolda %30 daha hızlı yürünür. Patika ve yol kalıcı; patikaya dönmemiş aşınma yavaşça silinir.
- Oyun başında ilk mahalle (Çeşme Mahallesi) kurulur: ana binadan 8–16 kare uzakta en boş yer. Alandaki ağaç ve kayalar temizlenir, ana binaya patika açılır, ortasında küçük bir meydan olur.
- Mahalle yarıçapı 5,5 kare, en çok **6 ev**. Evler yalnız mahallede, yola bakan arsaya yapılır (kapı yola dönük). Mahalle dolunca ya da yer kalmayınca yeni mahalle açılır (Yukarı, Bayır, Aşağı…).
- Her yeni binadan en yakın yola patika açılır (planlı sokak). Planlı sokağa ve toprak yola bina yapılmaz; kendiliğinden oluşan patikanın üstüne yapılabilir.
- Tarla, meslek binası ve kule mahalle alanına yapılmaz; fidan da dikilmez.
- Yollardan önceki kayıtlar yüklenince evler tek mahallede toplanır ve binalara patika açılır.

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

- Denge: odun 10 dakikada ~1900'e birikiyor, taş 30'un altında kalıyor. Ölçüm: testere bunun sebebi değil (testeresiz de aynı), sebep odunun harcanacak yeri olmaması. Testere kalıyor; çözüm yol haritasının 5. adımında (ticaret) ve yeni binaların maliyetlerinde.
- Asker toplanma noktası: askeri işler sona kaldı.
