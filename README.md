![FoodPlace — restoran boshqaruv tizimi](docs/banner.jpg)

# FoodPlace — Restoran boshqaruv tizimi

[![CI](https://github.com/Feruzbek0318/foodplace-restoran/actions/workflows/ci.yml/badge.svg)](https://github.com/Feruzbek0318/foodplace-restoran/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Restoran va kafe uchun boshqaruv paneli: kassa (POS), oshxona ekrani (KDS), stollar xaritasi, mahsulotlar va omborxona, xarajatlar, moliya hisoboti, mijozlar, xodimlar, kassa smenalari va audit jurnali. Interfeys o'zbek, rus va ingliz tillarida.

> **Demo / offline rejim.** Server yo'q: barcha ma'lumotlar shu qurilmaning brauzerida (`localStorage`) saqlanadi. Bir nechta kassa yoki qurilma o'rtasida sinxronizatsiya yo'q. Muntazam zaxira nusxa oling — batafsil [Cheklovlar](#cheklovlar) bo'limida.

**Jonli demo:** https://feruzbek0318.github.io/foodplace-restoran/ — har bir tashrif buyuruvchining ma'lumotlari faqat o'z brauzerida saqlanadi.

## Yuklab olish

Tayyor ilovalar [Releases](https://github.com/Feruzbek0318/foodplace-restoran/releases/latest) sahifasida:

| Platforma | Fayl | O'rnatish |
|---|---|---|
| Windows 10/11 (64-bit) | `FoodPlace-1.0.0-windows-setup.exe` | O'rnatuvchini ishga tushiring. SmartScreen chiqsa: **Batafsil → Baribir ishga tushirish** (ilova imzolanmagan). |
| macOS 11+ (Intel va Apple Silicon) | `FoodPlace-1.0.0-macos.dmg` | DMG'ni oching va FoodPlace'ni **Applications** papkasiga torting. Birinchi marta: o'ng tugma bilan bosib **Open** tanlang. |
| Android 7.0+ | `FoodPlace-1.0.0-android.apk` | Telefon yoki planshetga yuklab oching; "Noma'lum manbalardan o'rnatish"ga ruxsat bering. |
| Manba kodi | `Source code (zip / tar.gz)` | Har bir relizga GitHub avtomatik qo'shadi. |

Har bir qurilmada ma'lumotlar shu qurilmaning o'zida saqlanadi. Boshqa qurilmaga o'tkazish uchun **Sozlamalar → zaxira nusxa** faylidan foydalaning.

![Bosh sahifa](docs/screenshots/03-bosh-sahifa.jpg)

## Qanday ishlaydi

> Rasmlardagi taomlar, buyurtmalar va mijozlar — test rejimida kiritilgan namunaviy ma'lumotlar.

### 1. Birinchi ishga tushirish

Tizim birinchi marta ochilganda yangi restoran ochish yoki mavjud zaxira faylidan tiklash tanlanadi. Keyin 4 qadamda admin akkaunt, restoran va birinchi filial yaratiladi.

| Xush kelibsiz | Admin akkaunt yaratish |
|---|---|
| ![Xush kelibsiz](docs/screenshots/01-xush-kelibsiz.jpg) | ![Onboarding](docs/screenshots/02-onboarding.jpg) |

### 2. Kassa (POS)

Taomlar toifalar bo'yicha ko'rsatiladi; bosilgan taom savatga tushadi. Buyurtma turi (zalda, olib ketish, yetkazish), stol, chegirma va oshxona uchun izoh tanlanadi. To'lov usuli (naqd, karta, Click, Payme, Uzum yoki aralash) tanlanadi va chek chiqariladi; chekda buyurtma raqamining skanerlanadigan Code 128 shtrix-kodi bor. To'lov qabul qilish uchun kassa smenasi ochiq bo'lishi kerak.

> Click, Payme va Uzum bilan **integratsiya yo'q**: tizim to'lov usulini faqat qayd etadi (hisobot va smena uchun), pul o'tkazmasini o'zi amalga oshirmaydi.

![Kassa](docs/screenshots/04-kassa-pos.jpg)

### 3. Stollar xaritasi

Zal, VIP va terrasa stollari rang bilan holatini ko'rsatadi: bo'sh (yashil), band (sariq), buyurtma kutmoqda, bron qilingan (ko'k). "Tahrirlash" rejimida stollarni sudrab joylashtirish mumkin.

![Stollar](docs/screenshots/05-stollar.jpg)

### 4. Oshxona ekrani (KDS)

Kassadan yuborilgan buyurtmalar oshxonada uch ustunda ko'rinadi: **Yangi → Tayyorlanmoqda → Tayyor**. Har bir kartada stol, taomlar va o'tgan vaqt taymeri bor; yangi buyurtma kelganda ovozli signal chalinadi.

![Oshxona](docs/screenshots/06-oshxona-kds.jpg)

### 5. Buyurtmalar

Barcha buyurtmalar holati bo'yicha filtrlanadi (yangi, tayyorlanmoqda, tayyor, yopilgan, bekor qilingan), qidiriladi, chek qayta chop etiladi yoki bekor qilinadi.

![Buyurtmalar](docs/screenshots/07-buyurtmalar.jpg)

### 6. Moliya hisoboti

Tanlangan davr (bugun, hafta, oy, yil) bo'yicha tushum, buyurtmalar soni, o'rtacha chek va sof foyda (tushum − tannarx − xarajatlar) hisoblanadi; oldingi davrga nisbatan o'sish foizi, kunlik grafik va toifalar bo'yicha savdo ko'rsatiladi. Hisobotni CSV (Excel) ga yuklab olish mumkin.

![Moliya](docs/screenshots/08-moliya.jpg)

### 7. Omborxona va xarajatlar

Har bir sotuv ombordagi qoldiqni avtomatik kamaytiradi; minimal qoldiqdan kam qolgan mahsulotlar "Kam qoldi" deb belgilanadi. Kirim, chiqim va inventarizatsiya shu yerdan qilinadi. Ijara, ish haqi, kommunal va xomashyo xarajatlari alohida bo'limda yuritiladi va moliya hisobotiga qo'shiladi.

| Omborxona | Xarajatlar |
|---|---|
| ![Omborxona](docs/screenshots/09-omborxona.jpg) | ![Xarajatlar](docs/screenshots/10-xarajatlar.jpg) |

### 8. Mijozlar (CRM)

Doimiy mijozlar telefon raqami bilan saqlanadi; ularning buyurtmalar soni va umumiy xaridi avtomatik hisoblanadi.

![Mijozlar](docs/screenshots/11-mijozlar.jpg)

Shuningdek: **Xodimlar** (rollar va ruxsatlar), **Smenalar** (Z-hisobot, kassadagi naqd pul nazorati), **Tizim jurnali** (kim, qachon, nima qilgani), **Sozlamalar** (til, valyuta, soliq, mavzu, zaxira nusxa).

## Cheklovlar

Bu loyiha hozircha bitta qurilmada ishlaydigan, serversiz ilova. Haqiqiy restoranda ishlatishdan oldin quyidagilarni bilish kerak:

- **Ma'lumotlar brauzerda.** Brauzer ma'lumotlari tozalansa yoki qurilma almashsa, hammasi yo'qoladi. Himoya: **Sozlamalar → Tizim → Zaxira nusxa yuklab olish** (faylni boshqa joyda saqlang).
- **Sinxronizatsiya yo'q.** Har bir qurilma (kassa, oshxona planshet) o'z ma'lumotlari bilan ishlaydi.
- **Xavfsizlik brauzer darajasida.** Parollar PBKDF2 (tuz bilan) xeshlangan, rollar va ruxsatlar ilova ichida tekshiriladi. Ammo qurilmaga kira olgan va DevTools'dan foydalana oladigan odam ma'lumotlarni, jumladan tizim jurnalini, o'zgartira oladi. Haqiqiy himoya uchun server kerak.
- **To'lov tizimlari** (Click, Payme, Uzum) ulanmagan — faqat to'lov usuli belgisi.
- **Desktop ilovalar imzolanmagan** (Windows SmartScreen va macOS Gatekeeper ogohlantiradi).

Rejada: ma'lumotlarni serverga (masalan, Supabase) ko'chirish va qurilmalar o'rtasida sinxronizatsiya.

## Ishga tushirish

Talab: Node.js 20+

```bash
npm install
npm run dev
```

So'ng brauzerda http://localhost:3000 ni oching. Birinchi ochilishda admin akkaunt, restoran va birinchi filialni yaratish oynasi chiqadi.

## Buyruqlar

| Buyruq | Vazifasi |
|---|---|
| `npm run dev` | Ishlab chiqish serveri (port 3000) |
| `npm run build` | `dist/` ga production build |
| `npm run lint` | TypeScript tekshiruvi |
| `npm test` | Hisob-kitob testlari (Vitest): chegirma, soliq, qaytim, ombor qoldig'i, smena farqi, moliya hisoboti |
| `npm run electron` | Build qilib, desktop (Electron) ilova sifatida ochadi |
| `npm run build:windows` | Windows o'rnatuvchisi (EXE) → `desktop/installer/` |
| `npm run build:mac` | macOS DMG (Intel + Apple Silicon) → `desktop/installer/` |
| `npm run build:android` | Android APK (Capacitor) → `android/app/build/outputs/apk/release/` |

Windows va macOS fayllari macOS kompyuterda ham yig'iladi (electron-builder). Android uchun Android SDK va JDK 17+ kerak (`JAVA_HOME`, `ANDROID_HOME`). Ilova belgisi manbasi: `desktop/assets/src/icon.html`.

## GitHub Pages'ga joylash

Sayt `gh-pages` tarmog'idan beriladi. Yangilash uchun build qilib, `dist/` ichidagini shu tarmoqqa push qiling:

```bash
npm run build
cd dist && touch .nojekyll && git init -b gh-pages && git add -A && git commit -m deploy && git push -f https://github.com/Feruzbek0318/foodplace-restoran.git gh-pages && rm -rf .git
```

## Tuzilishi

- `src/services/store.ts` — ma'lumotlar va biznes mantiq (buyurtmalar, smenalar, ombor, xodimlar)
- `src/utils/calc.ts` — sof hisob-kitob funksiyalari (testlari: `calc.test.ts`)
- `src/utils/permissions.ts` — rollar, ruxsatlar va qaysi bo'lim kimga ko'rinishi
- `src/services/backup.ts` — zaxira nusxa olish va tiklash
- `src/components/views/` — har bir bo'lim sahifasi
- `src/locales/` — tarjimalar: `index.ts` (kalitlar, `tr()`), `phrases.ts` (iboralar), `dynamic.ts` (jurnal/bildirishnoma qoliplari)
- `desktop/` — Electron qobig'i: Windows va macOS o'rnatuvchi sozlamalari
- `android/` — Capacitor orqali Android ilova (`capacitor.config.ts`)

## Banner

`docs/banner.jpg` (README) va `docs/social-preview.png` (GitHub Social preview, 1280×640) [docs/banner/banner.html](docs/banner/banner.html) faylidan yasalgan. Ekran rasmlari yangilansa, qayta suratga oling:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --allow-file-access-from-files --virtual-time-budget=4000 --window-size=1280,640 --screenshot=docs/social-preview.png "file://$PWD/docs/banner/banner.html"
```

## CI

Har bir push va pull request'da GitHub Actions TypeScript tekshiruvi, testlar va build'ni ishga tushiradi ([.github/workflows/ci.yml](.github/workflows/ci.yml)).

## Litsenziya

[MIT](LICENSE)
