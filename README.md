# Köy Kapısı (Villagedoor)

Telefonda dikey oynanan, izometrik, tek kişilik köy stratejisi oyunu. Köylüler ana binanın kapısında sıra bekler; sen sadece kapıdan çıkanların ne iş yapacağını ve her mesleğin hangi emirle çalışacağını seçersin.

Saf HTML, CSS ve JavaScript. Kurulum veya derleme gerekmez: `index.html` dosyasını bir tarayıcıda açmak yeterli.

## Testler

```sh
node tests/sim.js --save   # 10 dakikalık başsız simülasyon ve kaydet/yükle testi
node tests/ui.js           # Chromium'da tıklama testi (Playwright gerekir)
```

Kurallar, sayılar, dosya haritası ve tasarım kararları için: [NOTES.md](NOTES.md)
