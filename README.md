# FoodPlace — Restoran boshqaruv tizimi

Restoran va kafe uchun boshqaruv paneli: kassa (POS), oshxona ekrani (KDS), stollar xaritasi, mahsulotlar va omborxona, xarajatlar, moliya hisoboti, mijozlar, xodimlar, kassa smenalari va audit jurnali. Interfeys o'zbek, rus va ingliz tillarida.

Ma'lumotlar brauzerning `localStorage` xotirasida saqlanadi (server yoki ma'lumotlar bazasi talab qilinmaydi).

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

## Tuzilishi

- `src/services/store.ts` — barcha ma'lumotlar va biznes mantiq (buyurtmalar, smenalar, ombor, xodimlar)
- `src/components/views/` — har bir bo'lim sahifasi
- `src/locales/` — tarjimalar: `index.ts` (kalitlar, `tr()`), `phrases.ts` (iboralar), `dynamic.ts` (jurnal/bildirishnoma qoliplari)
- `windovs feruzbek/` — Electron qobig'i va Windows o'rnatuvchi sozlamalari
