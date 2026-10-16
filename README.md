# FoodPlace — Restoran boshqaruv tizimi

Restoran va kafe uchun boshqaruv paneli: kassa (POS), oshxona ekrani (KDS), stollar xaritasi, mahsulotlar va omborxona, xarajatlar, moliya hisoboti, mijozlar, xodimlar, kassa smenalari va audit jurnali. Interfeys o'zbek, rus va ingliz tillarida.

Ma'lumotlar brauzerning `localStorage` xotirasida saqlanadi (server yoki ma'lumotlar bazasi talab qilinmaydi).

**Jonli demo:** https://feruzbek0318.github.io/foodplace-restoran/ — har bir tashrif buyuruvchining ma'lumotlari faqat o'z brauzerida saqlanadi.

![Bosh sahifa](docs/screenshots/03-bosh-sahifa.jpg)

## Qanday ishlaydi

> Rasmlardagi taomlar, buyurtmalar va mijozlar — test rejimida kiritilgan namunaviy ma'lumotlar.

### 1. Birinchi ishga tushirish

Tizim birinchi marta ochilganda yangi restoran ochish yoki mavjud zaxira faylidan tiklash tanlanadi. Keyin 4 qadamda admin akkaunt, restoran va birinchi filial yaratiladi.

| Xush kelibsiz | Admin akkaunt yaratish |
|---|---|
| ![Xush kelibsiz](docs/screenshots/01-xush-kelibsiz.jpg) | ![Onboarding](docs/screenshots/02-onboarding.jpg) |

### 2. Kassa (POS)

Taomlar toifalar bo'yicha ko'rsatiladi; bosilgan taom savatga tushadi. Buyurtma turi (zalda, olib ketish, yetkazish), stol, chegirma va oshxona uchun izoh tanlanadi. To'lov naqd, karta, Click, Payme, Uzum yoki aralash usulda qabul qilinadi va chek chiqariladi. To'lov qabul qilish uchun kassa smenasi ochiq bo'lishi kerak.

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

Shuningdek: **Xodimlar** (rollar va ruxsatlar), **Smenalar** (Z-hisobot, kassadagi naqd pul nazorati), **Tizim jurnali** (o'chirib bo'lmaydigan audit log), **Sozlamalar** (til, valyuta, soliq, mavzu, zaxira nusxa).

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
| `npm run electron` | Build qilib, desktop (Electron) ilova sifatida ochadi |
| `npm run build:windows` | Windows o'rnatuvchisini (`windovs feruzbek/installer`) yig'adi |

## GitHub Pages'ga joylash

Sayt `gh-pages` tarmog'idan beriladi. Yangilash uchun build qilib, `dist/` ichidagini shu tarmoqqa push qiling:

```bash
npm run build
cd dist && touch .nojekyll && git init -b gh-pages && git add -A && git commit -m deploy && git push -f https://github.com/Feruzbek0318/foodplace-restoran.git gh-pages && rm -rf .git
```

## Tuzilishi

- `src/services/store.ts` — barcha ma'lumotlar va biznes mantiq (buyurtmalar, smenalar, ombor, xodimlar)
- `src/components/views/` — har bir bo'lim sahifasi
- `src/locales/` — tarjimalar: `index.ts` (kalitlar, `tr()`), `phrases.ts` (iboralar), `dynamic.ts` (jurnal/bildirishnoma qoliplari)
- `windovs feruzbek/` — Electron qobig'i va Windows o'rnatuvchi sozlamalari
