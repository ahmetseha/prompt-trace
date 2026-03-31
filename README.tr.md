# PromptTrace

**Gelisitriciler icin yerel-oncelikli prompt zeka araci.**

PromptTrace, AI kodlama asistanlarinizin gecmisini tarar -- Cursor, Claude Code ve diger araclar -- ve bunlari yapilandirilmis bir prompt analiz panosuna donusturur. Tum veriler makinenizde kalir; hicbir sey disari cikmaz.

---

## Ne Ise Yarar?

Gunluk olarak AI kodlama araclari kullaniyorsaniz, su sorulari sormussunuzdur:

- Hangi prompt kaliplarini en cok kullaniyorum?
- Hangi promptlarim basarili kod degisikliklerine yol aciyor?
- Tekrar eden promptlarim var mi, farkedemiyor muyum?
- Projelerim arasinda AI kullanim dagilimim nasil?
- En iyi promptlarimdan yeniden kullanilabilir sablonlar cikarabilir miyim?

PromptTrace tam olarak bunlari yapar. AI arac gecmisinizi tarar, siniflandirir, puanlar ve gorsellestirir.

---

## Temel Ozellikler

### Coklu Kaynak Destegi
Cursor (`~/.cursor/projects/`) ve Claude Code (`~/.claude/projects/`) gecmislerini otomatik olarak tarar. Adapter mimarisi sayesinde yeni kaynaklar kolayca eklenebilir.

### Otomatik Siniflandirma
Her prompt otomatik olarak 14 kategoriden birine atanir:
- Bug duzeltme, refactor, mimari, kod uretimi, debug
- Stil/UI, test, dokumantasyon, deployment/CI
- Veri/backend, performans, arastirma, inceleme

Ayrica 8 niyet (intent) etiketi atanir:
- Sor, talimat ver, karsilastir, uret, duzelt, acikla, planla, donustur

### Yeniden Kullanim Puanlamasi
Her prompt'un ne kadar "yeniden kullanilabilir" oldugunu 0-100 arasinda puanlar. Yuksek puan alan promptlar sablon adayidir.

Puani artiran faktorler:
- Yapisal olarak genel (proje-spesifik degil)
- Aksiyon fiilleri iceriyor
- Orta uzunlukta (ne cok kisa ne cok uzun)
- Yaygin muhendislik kaliplarina uyuyor

### Basari Puanlamasi
Her prompt'un ne kadar "basarili" oldugunu tahmin eder:
- Dosya degisikligi var mi? (+30 puan)
- Yanit yeterince uzun mu? (+20 puan)
- Prompt net ve spesifik mi? (+20 puan)
- Aksiyon odakli mi? (+15 puan)

### Sablon Cikarimi
Benzer promptlari otomatik gruplar ve yeniden kullanilabilir sablonlar olusturur. Jaccard benzerlik algoritmasi ile prompt metinlerini karsilastirir, ortak kaliplari bulur ve sablon adaylari cikarir.

Ornek sablonlar:
- "Write [unit/integration] tests for [component] covering [scenarios]"
- "Refactor [module] to use [pattern] instead of [current approach]"
- "Create a [component] with [variants]. Support [features]."

### Interaktif Dashboard
- Gunluk prompt aktivite grafigi
- Kategori dagilimi (bar chart)
- Kaynak dagilimi (pie chart)
- Model kullanim dagilimi
- Son promptlar listesi
- En iyi sablon adaylari
- Proje bazli ozet

### Prompt Gezgini
Tum prompt gecmisini arayabilir ve filtreleyebilirsiniz:
- Metin arama
- Kaynaga gore filtre (Cursor, Claude Code)
- Kategoriye gore filtre
- Modele gore filtre
- Projeye gore filtre
- Siralama (en yeni, en eski, en yuksek yeniden kullanim puani, en uzun)

### Oturum Gezgini
AI etkilesim oturumlarinizi zaman cizgisi olarak goruntuler:
- Oturum basligi, suresi, prompt sayisi
- Kullanilan modeller
- Kategori dagilimi
- Kronolojik prompt zaman cizgisi

### Proje Analizi
Her proje icin ayri analiz sayfasi:
- Toplam prompt, oturum, aktif gun sayisi
- En cok kullanilan kategoriler
- En cok degistirilen dosyalar
- Ortalama prompt uzunlugu
- Zaman icinde AI kullanim trendi

### Komut Paleti
`/` veya `Cmd+K` ile hizli arama ve navigasyon. Promptlar, oturumlar, projeler arasinda aninda gec.

---

## Teknik Mimari

### Teknoloji Yigini

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Dil | TypeScript |
| Stil | Tailwind CSS 4 |
| Veritabani | SQLite (better-sqlite3) |
| ORM | Drizzle ORM |
| Arama | Fuse.js |
| Grafikler | Recharts |
| Animasyon | Framer Motion |
| Ikonlar | Lucide React |

### Veritabani Semasi

7 ana tablo:

- **sources** - Bagli AI araclari (Cursor, Claude Code vs.)
- **projects** - Taranan projeler ve yollari
- **sessions** - AI etkilesim oturumlari
- **prompts** - Her bir prompt kaydi (metin, model, kategori, puanlar)
- **prompt_files** - Prompt sonrasi degisen dosyalar
- **prompt_tags** - Prompt etiketleri
- **template_candidates** - Otomatik cikarilan sablon adaylari

### Adapter Mimarisi

Her AI araci icin ayri bir adapter var. Adapter arayuzu:

```typescript
interface SourceAdapter {
  id: string;
  name: string;
  type: SourceType;
  detect(): Promise<boolean>;       // Arac yuklu mu?
  getDefaultPath(): string;          // Varsayilan veri yolu
  parse(basePath: string): Promise<ParsedPrompt[]>;  // Gercek parse
  healthCheck(): Promise<AdapterHealth>;              // Saglik kontrolu
}
```

Yeni bir AI araci destegi eklemek icin bu arayuzu implement etmek yeterli.

### Veri Akisi

```
AI Araci (Cursor/Claude Code)
    |
    v
Adapter (JSONL dosyalarini oku ve parse et)
    |
    v
Runner (ParsedPrompt -> DB entity donusumu)
    |
    v
Classification Engine (kategori + niyet ata)
    |
    v
Scoring Engine (yeniden kullanim + basari puanla)
    |
    v
Template Extraction (benzer promptlari grupla)
    |
    v
SQLite Veritabani
    |
    v
Dashboard (Next.js App Router)
```

---

## Kurulum ve Kullanim

### Gereksinimler
- Node.js 18+
- npm

### Kurulum

```bash
git clone https://github.com/ahmetseha/prompt-trace.git
cd prompt-trace
npm install
```

### Demo Modu (Ornek Veriyle)

```bash
npm run db:seed    # 95 ornek prompt ile veritabanini doldur
npm run dev        # Gelistirme sunucusunu baslat
```

Tarayicida `http://localhost:3001` adresini ac.

### Gercek Veriyle Kullanim

Dashboard'a gir, **Sources** sayfasina git, herhangi bir kaynakta **Scan Now** butonuna tikla. Gercek AI gecmisin otomatik olarak taranir, siniflandirilir ve dashboard'da gosterilir.

Veya API uzerinden:

```bash
# Claude Code gecmisini tara
curl -X POST http://localhost:3001/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"sourceType": "claude-code"}'

# Cursor gecmisini tara
curl -X POST http://localhost:3001/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"sourceType": "cursor"}'
```

### Veritabanini Temizleme

Settings sayfasindaki "Clear All Data" butonu ile tum verileri silebilirsiniz. Veya API ile:

```bash
curl -X DELETE http://localhost:3001/api/data
```

---

## Sayfa Yapisi

| Sayfa | Yol | Aciklama |
|-------|-----|----------|
| Landing | `/` | Tanitim sayfasi |
| Dashboard | `/dashboard` | Ana ozet paneli |
| Promptlar | `/dashboard/prompts` | Aranabilir prompt gezgini |
| Prompt Detay | `/dashboard/prompts/[id]` | Tek prompt detayi |
| Oturumlar | `/dashboard/sessions` | Oturum listesi |
| Oturum Detay | `/dashboard/sessions/[id]` | Zaman cizgisi gorunumu |
| Projeler | `/dashboard/projects` | Proje listesi |
| Proje Detay | `/dashboard/projects/[id]` | Proje analizi |
| Sablonlar | `/dashboard/templates` | Sablon adaylari |
| Kaynaklar | `/dashboard/sources` | Bagli AI araclari |
| Ayarlar | `/dashboard/settings` | Yapilandirma |

---

## API Endpointleri

| Method | Endpoint | Aciklama |
|--------|----------|----------|
| GET | `/api/stats` | Dashboard istatistikleri |
| GET | `/api/prompts` | Prompt listesi (filtreleme destekli) |
| GET | `/api/prompts/[id]` | Tek prompt detayi |
| GET | `/api/sessions` | Oturum listesi |
| GET | `/api/sessions/[id]` | Oturum detayi |
| GET | `/api/projects` | Proje listesi |
| GET | `/api/projects/[id]` | Proje detayi |
| GET | `/api/templates` | Sablon adaylari |
| GET | `/api/sources` | Kaynak listesi |
| GET | `/api/search?q=...` | Global arama |
| POST | `/api/ingest` | Kaynak tara ve iceri aktar |
| GET | `/api/ingest` | Mevcut adapterleri kesfet |
| GET | `/api/data` | Veritabani bilgisi |
| DELETE | `/api/data` | Tum verileri sil |

---

## Klasor Yapisi

```
prompt-trace/
├── docs/                    # Dokumantasyon
├── scripts/
│   └── seed.ts              # Demo veri olusturucu
├── src/
│   ├── app/                 # Next.js sayfalari ve API route'lari
│   │   ├── api/             # REST API endpointleri
│   │   ├── dashboard/       # Dashboard sayfalari
│   │   └── page.tsx         # Landing page
│   ├── components/          # Paylasilan UI bileisenleri
│   │   └── ui/              # Temel UI kutuphanesi (button, card, badge vs.)
│   ├── features/            # Sayfa-spesifik bilesenler
│   │   ├── dashboard/       # Dashboard grafikleri
│   │   ├── prompts/         # Prompt gezgini
│   │   ├── sessions/        # Oturum bileisenleri
│   │   ├── projects/        # Proje kartlari
│   │   ├── templates/       # Sablon kartlari
│   │   ├── sources/         # Kaynak kartlari
│   │   └── landing/         # Landing page bilesenleri
│   └── lib/                 # Is mantigi ve altyapi
│       ├── adapters/        # AI arac adapterleri (Claude Code, Cursor)
│       ├── classification/  # Prompt siniflandirma motoru
│       ├── scoring/         # Yeniden kullanim ve basari puanlama
│       ├── templates/       # Sablon cikarim motoru
│       ├── search/          # Fuse.js arama
│       ├── db/              # Veritabani (schema, queries, migrations)
│       ├── data/            # Veri erisim katmani (DB + demo fallback)
│       ├── demo/            # Demo/ornek veri
│       ├── types/           # TypeScript tip tanimlari
│       └── utils/           # Yardimci fonksiyonlar
└── data/                    # SQLite veritabani (gitignore'da)
```

---

## Gizlilik ve Guvenlik

- Tum veriler yerel SQLite veritabaninda saklanir
- Hicbir ag istegi yapilmaz
- Telemetri, izleme veya bulut senkronizasyonu yok
- Acik kaynak -- her satir kod incelenebilir
- AI API cagirisi yok -- siniflandirma ve puanlama tamamen yerel kurallara dayanir

---

## Gelecek Planlar

- `npx prompttrace` CLI araci -- tek komutla kur ve calistir
- Copilot, Gemini CLI, Codex CLI adapterleri
- ML-tabanli siniflandirma (yerel model ile)
- Sablon yonetimi (kaydet, duzenle, disari aktar)
- VS Code uzantisi
- Takim ozellikleri ve paylasilan sablonlar

---

## Lisans

MIT
