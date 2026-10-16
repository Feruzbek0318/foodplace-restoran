
import { store } from '../services/store';
import { phrases } from './phrases';
import { dynamicPatterns } from './dynamic';

export const dictionaries = {
  uz: {
  "s_backup_title": "Zaxira nusxa",
  "s_backup_desc": "Barcha ma'lumotlar (xodimlar, mahsulotlar, buyurtmalar, rasmlar) bitta faylga saqlanadi. Shu fayl orqali boshqa kompyuterda ham tizimga kirish mumkin.",
  "s_backup_download": "Zaxira nusxa yuklab olish",
  "s_backup_restore": "Zaxiradan tiklash",
  "s_backup_done": "Zaxira fayli yuklab olindi",
  "s_restore_confirm": "Joriy barcha ma'lumotlar zaxira fayldagi ma'lumotlar bilan almashtiriladi. Davom etasizmi?",
  "add_table": "Stol qo'shish",
  "confirm_delete": "Rostdan ham o'chirmoqchimisiz?",
  "no_permission": "Bu bo'limga kirish huquqingiz yo'q",
  "s_subtitle": "Tizim va restoran sozlamalarini boshqarish",
  "s_saved": "Sozlamalar saqlandi",
  "s_profile_title": "Shaxsiy profil",
  "s_full_name": "Ism va familiya",
  "s_role": "Lavozim",
  "s_restaurant_title": "Restoran ma'lumotlari",
  "s_logo": "Restoran logotipi",
  "s_logo_hint": "Rasm 1:1 o'lchamda bo'lishi tavsiya etiladi.",
  "s_logo_remove": "Logotipni o'chirish",
  "s_restaurant_name": "Restoran nomi",
  "s_currency": "Valyuta",
  "s_tax": "QQS / xizmat haqi (%)",
  "s_tax_hint": "Kassada har bir buyurtmaga qo'shiladi. 0 — qo'shilmaydi.",
  "s_receipt_footer": "Chek pastidagi matn",
  "s_language_title": "Til sozlamalari",
  "s_system_language": "Tizim tili",
  "s_language_hint": "Til darhol butun tizim bo'ylab o'zgaradi.",
  "s_theme": "Mavzu",
  "s_theme_hint": "Mavzu darhol qo'llanadi.",
  "s_sound_alerts": "Yangi buyurtma kelganda ovozli signal",
  "s_shift_alerts": "Smena yopilganda hisobot bildirishnomasi",
  "s_sms_alerts": "Mijozlarga SMS xabarnomalar (tez orada)",
  "s_old_password": "Joriy parol",
  "s_new_password": "Yangi parol",
  "s_confirm_password": "Yangi parolni tasdiqlang",
  "s_change_password": "Parolni o'zgartirish",
  "s_pw_wrong": "Joriy parol noto'g'ri",
  "s_pw_short": "Yangi parol kamida 6 belgidan iborat bo'lsin",
  "s_pw_mismatch": "Yangi parollar mos kelmadi",
  "s_pw_changed": "Parol muvaffaqiyatli o'zgartirildi",
  "s_version": "Versiya",
  "s_storage": "Ma'lumotlar saqlanishi",
  "s_storage_value": "Shu qurilma brauzerida (localStorage)",
  "s_reload": "Sahifani qayta yuklash",
  "s_reset_title": "Zavod sozlamalariga qaytarish",
  "s_reset_desc": "Barcha ma'lumotlar (xodimlar, mahsulotlar, buyurtmalar va h.k.) butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi!",
  "s_reset_button": "Tizimni tozalash",
  "s_reset_confirm": "Tasdiqlash uchun TOZALASH deb yozing",
  "s_reset_yes": "Ha, hammasini o'chirish",
  "map_layout": "Zal xaritasi",
  "restaurant": "Restoran",
  "language": "Til",
  "dashboard": "Bosh sahifa",
  "pos": "Kassa (POS)",
  "orders": "Buyurtmalar",
  "tables": "Stollar",
  "kitchen": "Oshxona (KDS)",
  "products": "Mahsulotlar",
  "inventory": "Omborxona",
  "expenses": "Xarajatlar",
  "finance": "Moliya",
  "customers": "Mijozlar",
  "employees": "Xodimlar",
  "branches": "Filiallar",
  "shifts": "Smenalar",
  "audit": "Tizim Jurnali",
  "settings": "Sozlamalar",
  "profile": "Profil",
  "logout": "Chiqish",
  "add_product": "+ Mahsulot",
  "edit": "Tahrirlash",
  "delete": "O‘chirish",
  "save": "Saqlash",
  "cancel": "Bekor qilish",
  "delete_confirm": "Ushbu ma'lumotni o‘chirishni xohlaysizmi? Bu amalni qaytarib bo‘lmaydi.",
  "loading": "Yuklanmoqda...",
  "error_save": "Saqlashda xatolik yuz berdi. Qayta urinib ko‘ring.",
  "search": "Qidirish...",
  "no_data": "Hozircha ma'lumot yo'q.",
  "active": "Faol",
  "inactive": "Nofaol",
  "photo_upload": "Rasm yuklash",
  "change_photo": "Rasmni o‘zgartirish",
  "delete_photo": "Rasmni o‘chirish",
  "branch": "Filial",
  "name": "Nomi",
  "phone": "Telefon",
  "address": "Manzil",
  "category": "Kategoriya",
  "price": "Narx",
  "cost": "Tannarx",
  "stock": "Mavjud",
  "role": "Lavozim",
  "login": "Login",
  "password": "Parol",
  "dark_mode": "Qorong'u",
  "light_mode": "Yorug'",
  "system_mode": "Tizim",
  "notifications": "Bildirishnomalar",
  "security": "Xavfsizlik",
  "roles": "Rollar va huquqlar",
  "appearance": "Ko'rinish",
  "system": "Tizim"
},
  ru: {
  "s_backup_title": "Резервная копия",
  "s_backup_desc": "Все данные (сотрудники, товары, заказы, изображения) сохраняются в один файл. С его помощью можно войти в систему и на другом компьютере.",
  "s_backup_download": "Скачать резервную копию",
  "s_backup_restore": "Восстановить из копии",
  "s_backup_done": "Файл резервной копии скачан",
  "s_restore_confirm": "Все текущие данные будут заменены данными из копии. Продолжить?",
  "add_table": "Добавить стол",
  "confirm_delete": "Вы уверены, что хотите удалить?",
  "no_permission": "У вас нет доступа к этому разделу",
  "s_subtitle": "Управление настройками системы и ресторана",
  "s_saved": "Настройки сохранены",
  "s_profile_title": "Личный профиль",
  "s_full_name": "Имя и фамилия",
  "s_role": "Должность",
  "s_restaurant_title": "Данные ресторана",
  "s_logo": "Логотип ресторана",
  "s_logo_hint": "Рекомендуется изображение 1:1.",
  "s_logo_remove": "Удалить логотип",
  "s_restaurant_name": "Название ресторана",
  "s_currency": "Валюта",
  "s_tax": "НДС / обслуживание (%)",
  "s_tax_hint": "Добавляется к каждому заказу на кассе. 0 — не добавляется.",
  "s_receipt_footer": "Текст внизу чека",
  "s_language_title": "Настройки языка",
  "s_system_language": "Язык системы",
  "s_language_hint": "Язык сразу меняется во всей системе.",
  "s_theme": "Тема",
  "s_theme_hint": "Тема применяется сразу.",
  "s_sound_alerts": "Звуковой сигнал при новом заказе",
  "s_shift_alerts": "Уведомление об отчёте при закрытии смены",
  "s_sms_alerts": "SMS-уведомления клиентам (скоро)",
  "s_old_password": "Текущий пароль",
  "s_new_password": "Новый пароль",
  "s_confirm_password": "Подтвердите новый пароль",
  "s_change_password": "Сменить пароль",
  "s_pw_wrong": "Неверный текущий пароль",
  "s_pw_short": "Новый пароль должен быть не короче 6 символов",
  "s_pw_mismatch": "Новые пароли не совпадают",
  "s_pw_changed": "Пароль успешно изменён",
  "s_version": "Версия",
  "s_storage": "Хранение данных",
  "s_storage_value": "В браузере этого устройства (localStorage)",
  "s_reload": "Перезагрузить страницу",
  "s_reset_title": "Сброс к заводским настройкам",
  "s_reset_desc": "Все данные (сотрудники, товары, заказы и т.д.) будут удалены безвозвратно!",
  "s_reset_button": "Очистить систему",
  "s_reset_confirm": "Для подтверждения введите TOZALASH",
  "s_reset_yes": "Да, удалить всё",
  "map_layout": "Схема зала",
  "restaurant": "Ресторан",
  "language": "Язык",
  "dashboard": "Дашборд",
  "pos": "Касса (POS)",
  "orders": "Заказы",
  "tables": "Столы",
  "kitchen": "Кухня (KDS)",
  "products": "Товары",
  "inventory": "Склад",
  "expenses": "Расходы",
  "finance": "Финансы",
  "customers": "Клиенты",
  "employees": "Сотрудники",
  "branches": "Филиалы",
  "shifts": "Смены",
  "audit": "Журнал системы",
  "settings": "Настройки",
  "profile": "Профиль",
  "logout": "Выйти",
  "add_product": "+ Товар",
  "edit": "Изменить",
  "delete": "Удалить",
  "save": "Сохранить",
  "cancel": "Отмена",
  "delete_confirm": "Вы уверены, что хотите удалить это? Действие необратимо.",
  "loading": "Загрузка...",
  "error_save": "Ошибка сохранения. Попробуйте еще раз.",
  "search": "Поиск...",
  "no_data": "Пока нет данных.",
  "active": "Активен",
  "inactive": "Неактивен",
  "photo_upload": "Загрузить фото",
  "change_photo": "Изменить фото",
  "delete_photo": "Удалить фото",
  "branch": "Филиал",
  "name": "Имя/Название",
  "phone": "Телефон",
  "address": "Адрес",
  "category": "Категория",
  "price": "Цена",
  "cost": "Себестоимость",
  "stock": "В наличии",
  "role": "Должность",
  "login": "Логин",
  "password": "Пароль",
  "dark_mode": "Тёмная",
  "light_mode": "Светлая",
  "system_mode": "Системная",
  "notifications": "Уведомления",
  "security": "Безопасность",
  "roles": "Роли и права",
  "appearance": "Внешний вид",
  "system": "Система"
},
  en: {
  "s_backup_title": "Backup",
  "s_backup_desc": "All data (staff, products, orders, images) is saved to one file. Use it to sign in on another computer too.",
  "s_backup_download": "Download backup",
  "s_backup_restore": "Restore from backup",
  "s_backup_done": "Backup file downloaded",
  "s_restore_confirm": "All current data will be replaced with the backup. Continue?",
  "add_table": "Add table",
  "confirm_delete": "Are you sure you want to delete this?",
  "no_permission": "You do not have access to this section",
  "s_subtitle": "Manage system and restaurant settings",
  "s_saved": "Settings saved",
  "s_profile_title": "Personal profile",
  "s_full_name": "Full name",
  "s_role": "Role",
  "s_restaurant_title": "Restaurant details",
  "s_logo": "Restaurant logo",
  "s_logo_hint": "A square (1:1) image is recommended.",
  "s_logo_remove": "Remove logo",
  "s_restaurant_name": "Restaurant name",
  "s_currency": "Currency",
  "s_tax": "VAT / service charge (%)",
  "s_tax_hint": "Added to every POS order. 0 disables it.",
  "s_receipt_footer": "Receipt footer text",
  "s_language_title": "Language settings",
  "s_system_language": "System language",
  "s_language_hint": "The language changes across the app immediately.",
  "s_theme": "Theme",
  "s_theme_hint": "The theme applies immediately.",
  "s_sound_alerts": "Sound alert on new order",
  "s_shift_alerts": "Report notification when a shift closes",
  "s_sms_alerts": "SMS notifications to customers (coming soon)",
  "s_old_password": "Current password",
  "s_new_password": "New password",
  "s_confirm_password": "Confirm new password",
  "s_change_password": "Change password",
  "s_pw_wrong": "Current password is incorrect",
  "s_pw_short": "New password must be at least 6 characters",
  "s_pw_mismatch": "New passwords do not match",
  "s_pw_changed": "Password changed successfully",
  "s_version": "Version",
  "s_storage": "Data storage",
  "s_storage_value": "In this device's browser (localStorage)",
  "s_reload": "Reload page",
  "s_reset_title": "Factory reset",
  "s_reset_desc": "All data (staff, products, orders, etc.) will be permanently deleted. This cannot be undone!",
  "s_reset_button": "Wipe system",
  "s_reset_confirm": "Type TOZALASH to confirm",
  "s_reset_yes": "Yes, delete everything",
  "map_layout": "Floor map",
  "restaurant": "Restaurant",
  "language": "Language",
  "dashboard": "Dashboard",
  "pos": "POS",
  "orders": "Orders",
  "tables": "Tables",
  "kitchen": "Kitchen (KDS)",
  "products": "Products",
  "inventory": "Inventory",
  "expenses": "Expenses",
  "finance": "Finance",
  "customers": "Customers",
  "employees": "Employees",
  "branches": "Branches",
  "shifts": "Shifts",
  "audit": "Audit Log",
  "settings": "Settings",
  "profile": "Profile",
  "logout": "Logout",
  "add_product": "+ Product",
  "edit": "Edit",
  "delete": "Delete",
  "save": "Save",
  "cancel": "Cancel",
  "delete_confirm": "Are you sure you want to delete this? This action cannot be undone.",
  "loading": "Loading...",
  "error_save": "Error saving. Please try again.",
  "search": "Search...",
  "no_data": "No data available yet.",
  "active": "Active",
  "inactive": "Inactive",
  "photo_upload": "Upload photo",
  "change_photo": "Change photo",
  "delete_photo": "Delete photo",
  "branch": "Branch",
  "name": "Name",
  "phone": "Phone",
  "address": "Address",
  "category": "Category",
  "price": "Price",
  "cost": "Cost",
  "stock": "Stock",
  "role": "Role",
  "login": "Login",
  "password": "Password",
  "dark_mode": "Dark",
  "light_mode": "Light",
  "system_mode": "System",
  "notifications": "Notifications",
  "security": "Security",
  "roles": "Roles & Permissions",
  "appearance": "Appearance",
  "system": "System"
}
};

export type LangKey = keyof typeof dictionaries.uz;

export function t(key: LangKey | string): string {
  const lang = store.settings?.language || 'uz';
  const dict = dictionaries[lang as 'uz' | 'ru' | 'en'] || dictionaries.uz;
  // @ts-ignore
  return dict[key] || key;
}

// Translates a UI phrase written in Uzbek; falls back to the Uzbek text when no translation exists
export function tr(text: string): string {
  const lang = store.settings?.language || 'uz';
  if (lang === 'uz') return text;
  const entry = phrases[text];
  if (!entry) return text;
  return lang === 'ru' ? entry[0] : entry[1];
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Menejer',
  CASHIER: 'Kassir',
  WAITER: 'Ofitsiant',
  KITCHEN: 'Oshpaz (Kitchen)',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: 'Yangi',
  PREPARING: 'Tayyorlanmoqda',
  READY: 'Tayyor',
  SERVED: 'Mijozga berildi',
  COMPLETED: 'Yopilgan',
  CANCELLED: 'Bekor qilingan',
};

export const roleLabel = (role?: string) => (role ? tr(ROLE_LABELS[role] || role) : '');
export const statusLabel = (status?: string) => (status ? tr(ORDER_STATUS_LABELS[status] || status) : '');

const ORDER_TYPE_LABELS: Record<string, string> = {
  DINE_IN: 'Zalda',
  TAKEAWAY: 'Olib ketish',
  DELIVERY: 'Yetkazish',
};

const UNIT_LABELS: Record<string, string> = {
  dona: 'dona',
  kg: 'kg',
  litr: 'litr',
  portion: 'porsiya',
};

export const orderTypeLabel = (type?: string) => (type ? tr(ORDER_TYPE_LABELS[type] || type) : '');
export const unitLabel = (unit?: string) => (unit ? tr(UNIT_LABELS[unit] || unit) : '');

// Translates a store-generated message: exact phrases first, then the dynamic templates
export function trMessage(text?: string): string {
  if (!text) return '';
  const lang = store.settings?.language || 'uz';
  let result = text;
  if (lang !== 'uz') {
    if (phrases[text]) result = tr(text);
    else {
      const match = dynamicPatterns.find(([pattern]) => pattern.test(text));
      if (match) result = text.replace(match[0], lang === 'ru' ? match[1] : match[2]);
    }
  }
  return humanizeCodes(result);
}

const PAYMENT_LABELS: Record<string, string> = { CASH: 'Naqd', CARD: 'Karta', MIXED: 'Aralash', CLICK: 'Click', PAYME: 'Payme', UZUM: 'Uzum' };

export const paymentLabel = (method?: string) => (method ? tr(PAYMENT_LABELS[method] || method) : '');

// Replaces technical codes inside messages (DINE_IN, PREPARING, SUPER_ADMIN, CASH...) with readable labels
function humanizeCodes(text: string): string {
  return text.replace(/\b[A-Z][A-Z_]{2,}\b/g, code => {
    if (ORDER_TYPE_LABELS[code]) return orderTypeLabel(code);
    if (ORDER_STATUS_LABELS[code]) return statusLabel(code);
    if (ROLE_LABELS[code]) return roleLabel(code);
    if (PAYMENT_LABELS[code]) return tr(PAYMENT_LABELS[code]);
    if (MOVEMENT_LABELS[code]) return tr(MOVEMENT_LABELS[code]);
    if (code === 'BLOCKED') return tr('Bloklangan');
    if (code === 'ACTIVE') return tr('Faol');
    return code;
  })
    .replace(/\(IN, /g, `(${tr('Kirim')}, `)
    .replace(/\b(portion|dona|litr)\b/g, unit => unitLabel(unit));
}

const MOVEMENT_LABELS: Record<string, string> = {
  OUT: 'Chiqim',
  WASTE: 'Hisobdan chiqarish',
  ADJUSTMENT: 'Inventarizatsiya',
};

const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

// Browsers often lack Uzbek month names ("M10 15"), so Uzbek is formatted by hand
export function formatDayMonth(date: Date = new Date()): string {
  const lang = store.settings?.language || 'uz';
  if (lang === 'uz') return `${date.getDate()}-${UZ_MONTHS[date.getMonth()]}`;
  return date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { month: 'long', day: 'numeric' });
}

const ACTION_LABELS: Record<string, string> = {
  AUTH_BLOCKED: "Bloklangan kirish",
  AUTH_FAILED: "Kirish xatosi",
  BRANCH_CREATED: "Filial qo'shildi",
  BRANCH_DELETED: "Filial o'chirildi",
  BRANCH_UPDATED: "Filial tahrirlandi",
  CUSTOMER_ADDED: "Mijoz qo'shildi",
  CUSTOMER_DELETED: "Mijoz o'chirildi",
  EXPENSE_ADDED: "Xarajat kiritildi",
  ORDER_CREATED: "Buyurtma yaratildi",
  ORDER_PAID: "Buyurtma to'landi",
  ORDER_STATUS_CHANGED: "Buyurtma holati",
  PERMISSIONS_UPDATED: "Ruxsatlar yangilandi",
  PRICE_CHANGED: "Narx o'zgardi",
  PRODUCT_ADDED: "Mahsulot qo'shildi",
  PRODUCT_DELETED: "Mahsulot o'chirildi",
  PRODUCT_UPDATED: "Mahsulot tahrirlandi",
  SETTINGS_UPDATED: "Sozlamalar yangilandi",
  SHIFT_OPENED: "Smena ochildi",
  SHIFT_CLOSED: "Smena yopildi",
  TABLE_RESERVED: "Stol band qilindi",
  TABLES_UPDATED: "Stollar yangilandi",
  USER_CREATED: "Xodim yaratildi",
  USER_DELETED: "Xodim o'chirildi",
  USER_LOGIN: "Tizimga kirdi",
  USER_LOGOUT: "Tizimdan chiqdi",
  USER_STATUS_CHANGED: "Xodim holati",
  USER_SWITCH: "Foydalanuvchi almashdi",
  USER_UPDATE: "Parol o'zgartirildi",
  USER_UPDATED: "Xodim yangilandi",
  INVENTORY_UPDATE: "Ombor harakati",
};

export const actionLabel = (action?: string) => (action ? tr(ACTION_LABELS[action] || action) : '');

const ZONE_LABELS: Record<string, string> = { HALL: 'Zal', VIP: 'VIP', TERRACE: 'Terrasa' };
export const zoneLabel = (zone?: string) => (zone ? tr(ZONE_LABELS[zone] || zone) : '');
