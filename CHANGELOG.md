# O'zgarishlar tarixi

Format: [Keep a Changelog](https://keepachangelog.com/), versiyalar: [SemVer](https://semver.org/).

## [1.1.0] — 2026-10-16

### Yangi
- **Bulut sinxronizatsiya (Firebase).** Kassa, oshxona planshet va ofitsiant qurilmalari bitta ma'lumot bilan real vaqtda ishlaydi: kassada berilgan buyurtma oshxona ekranida 1 soniyadan kam vaqtda paydo bo'ladi, oshpaz qabul qilsa kassada holat darhol o'zgaradi. Internet uzilsa o'zgarishlar navbatda turadi.
- **Restoran kaliti.** Egasi Sozlamalar → Bulut'da restoranni ulaydi va 32 belgili kalit oladi; yangi qurilma Xush kelibsiz → "Menda akkaunt bor" orqali kalit bilan qo'shiladi, so'ng xodim o'z login-paroli bilan kiradi.
- Admin boshqa qurilmada xodimni bloklasa yoki huquqini o'zgartirsa, u barcha qurilmalarda darhol qo'llanadi.
- Sarlavhada bulut holati belgisi (onlayn / internet yo'q / xato).
- Firestore xavfsizlik qoidalari: kalitsiz restoranni ko'rib bo'lmaydi.
- MIT litsenziya, GitHub Actions CI (TypeScript, testlar, build), 41 ta unit test.

### Tuzatildi
- "Meni eslab qolish"siz kirilganda chiqishdan keyin sahifa yangilansa, foydalanuvchi yana kirgan holda qolardi.
- Buyurtma raqamida yil 2026 deb qattiq yozilgan edi.
- Kassada chegirma qatori endi QQS qatoridan oldin (QQS chegirmadan keyingi summaga hisoblanadi).
- Login sahifasidagi noto'g'ri "PostgreSQL & Express" yozuvi va soxta admin telefon raqami olib tashlandi.

### O'zgardi
- `windovs feruzbek/` papkasi `desktop/` deb qayta nomlandi.
- README: cheklovlar, to'lov tizimlari (Click/Payme/Uzum faqat to'lov usuli sifatida qayd etiladi), Firebase sozlash yo'riqnomasi.

> Bulut sinxronizatsiya ishlashi uchun build Firebase sozlamalari bilan yig'ilishi kerak (README → "Firebase'ni sozlash"). Sozlanmagan nusxa avvalgidek oflayn ishlaydi.

## [1.0.0] — 2026-10-16

- Birinchi reliz: kassa (POS), oshxona ekrani (KDS), stollar xaritasi, buyurtmalar, omborxona, xarajatlar, moliya hisoboti, mijozlar, xodimlar va ruxsatlar, smenalar (Z-hisobot), tizim jurnali, zaxira nusxa. O'zbek, rus va ingliz tillari. Windows, macOS, Android va web.

[1.1.0]: https://github.com/Feruzbek0318/foodplace-restoran/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Feruzbek0318/foodplace-restoran/releases/tag/v1.0.0
