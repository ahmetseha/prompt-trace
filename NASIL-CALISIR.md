# PromptTrace - Nasil Calisir?

## Ne Yapar?

AI kodlama araclarinin (Cursor, Claude Code) yerel gecmis dosyalarini okur, her promptu siniflandirir, puanlar ve bir dashboard'da gosterir. Hicbir veri disari cikmaz.

---

## Kullaniciya Sagladigi Degerler

1. **Prompt aliskanliklarin gorunur olur** - Hangi tip promptlari ne siklikla yazdigini gorursun
2. **Tekrar eden kaliplari farkerdersin** - Ayni seyleri tekrar tekrar yazip yazmadigini anlayabilirsin
3. **En iyi promptlarin sablona donusur** - Yuksek puanli promptlar otomatik sablon adayi olur
4. **Proje bazli AI kullanim analizi** - Hangi projede ne kadar AI kullandigini gorursun
5. **Oturum zaman cizgisi** - Bir AI oturumunda ne yaptigini adim adim inceleyebilirsin

---

## Simdi Nasil Test Edersin?

```bash
cd prompt-trace
npm run dev
```

Tarayicida `localhost:3001` ac. Eger daha once `npm run db:seed` yapildiysa demo veri gorursun. Gercek veri icin:

1. Dashboard'da **Sources** sayfasina git
2. Claude Code veya Cursor kaynaginda **Scan Now** tikla
3. Gercek prompt gecmisin taranir ve tum sayfalara yansir

---

## npx prompttrace Suan Calisir mi?

**Hayir.** Suan proje sadece yerel gelistirme modunda calisiyor. `npx prompttrace` icin su adimlar gerekiyor:

### Yapilmasi Gerekenler

1. **bin/cli.ts** - Bir CLI entry point yazilacak:
   - Portu sec (3001 varsayilan)
   - Veritabanini olustur
   - Mevcut adapterleri otomatik kesfet ve tara
   - Next.js sunucusunu baslat
   - Tarayiciyi otomatik ac

2. **package.json** duzenleme:
   ```json
   {
     "name": "prompttrace",
     "bin": {
       "prompttrace": "./bin/cli.js"
     }
   }
   ```

3. **npm publish** - Paketi npm registry'ye yayinla

### npx prompttrace Yapildiginda Ne Olacak?

```
$ npx prompttrace

  PromptTrace v0.1.0
  Scanning sources...
    Claude Code: 114 prompts found (7 projects)
    Cursor: 25 prompts found (3 projects)
  Classifying prompts... done
  Extracting templates... 6 templates found
  Starting dashboard on http://localhost:3001
  Opening browser...
```

Kullanici tek komutla:
- Paketi indirir
- AI arac gecmisleri otomatik taranir
- Siniflandirma ve puanlama yapilir
- Dashboard acilir

---

## Veri Akisi (Teknik)

```
~/.claude/projects/**/*.jsonl    -->  Claude Code Adapter
~/.cursor/projects/**/**.jsonl   -->  Cursor Adapter
                                          |
                                          v
                                    ParsedPrompt[]
                                          |
                              +-----------+-----------+
                              |           |           |
                         Classifier    Scorer    Template
                         (14 kategori) (0-100)   Extractor
                              |           |           |
                              +-----------+-----------+
                                          |
                                          v
                                     SQLite DB
                                          |
                                          v
                                   Next.js Dashboard
```

---

## Desteklenen Kaynaklar ve Okunan Dosyalar

| Kaynak | Dosya Yolu | Format |
|--------|-----------|--------|
| Claude Code | `~/.claude/projects/{proje}/*.jsonl` | JSONL (type, message, timestamp, model, usage) |
| Cursor | `~/.cursor/projects/{proje}/agent-transcripts/**/*.jsonl` | JSONL (role, message) |

Claude Code JSONL'de: timestamp, model, token kullanimi, tool_use (dosya islemleri) bilgisi var.
Cursor JSONL'de: sadece mesaj icerigi var, timestamp ve model bilgisi yok (dosya tarihi kullanilir).

---

## Siniflandirma Ornekleri

| Prompt | Kategori | Niyet |
|--------|----------|-------|
| "Fix the login bug that crashes on empty password" | bug-fixing | fix |
| "Refactor the auth middleware to use JWT" | refactor | instruct |
| "Write unit tests for the UserService" | testing | generate |
| "Why is useEffect causing infinite loop?" | debugging | ask |
| "Compare REST vs GraphQL for our use case" | exploratory | compare |
| "Set up GitHub Actions CI/CD pipeline" | deployment | instruct |

---

## Ozet

| Durum | Aciklama |
|-------|----------|
| Calisiyor | Dashboard, adapter'ler, siniflandirma, puanlama, sablon cikarimi |
| Calisiyor | Gercek Claude Code ve Cursor verisi parse ediliyor |
| Calisiyor | Demo modu (bos DB'de otomatik ornek veri) |
| Calisiyor | Sources sayfasinda Scan Now butonu |
| Calisiyor | Settings'de Clear Data ve Export |
| Eksik | `npx prompttrace` CLI paketi (Faz 5) |
| Eksik | Copilot, Gemini, Codex adapterleri |
| Eksik | npm publish |
