# TaskFi

TaskFi adalah aplikasi manajemen **tugas (Todo)** dan **keuangan (Transactions)** berbasis **Expo React Native**.  
Menggunakan **Supabase** sebagai backend (auth + database + storage) dan **React Query** untuk caching & sinkronisasi realtime.

---

## ✨ Fitur Utama
- ✅ Autentikasi dengan Supabase (sign-in, sign-up, sign-out)
- ✅ Todo list dengan filter, prioritas, realtime sync
- ✅ Transaksi keuangan (income/expense) dengan kategori
- ✅ Dashboard ringkasan saldo, pemasukan/pengeluaran, grafik
- ✅ Profile management (username, avatar, currency)
- ✅ Settings: Theme (light/dark), Terms/Privacy, sign-out
- ✅ Offline-first dengan cache AsyncStorage
- ✅ Supabase Realtime → data selalu segar

---

## 🛠️ Arsitektur
- `app/_layout.tsx` → provider global (SafeArea, GestureHandler, Theme, QueryClient, Auth)
- `utils/queryClient.ts` → konfigurasi React Query offline-first
- `features/auth/AuthProvider.tsx` → state & session Supabase
- `features/auth/guard.tsx` → ProtectedRoute / PublicRoute
- `features/todos`, `features/transactions`, `features/categories`, `features/profiles` → API + Hooks
- `app/(tabs)` → UI: Dashboard, Todos, Transactions, Reports, Settings

---

## 🔄 Alur Kerja
1. Saat aplikasi dibuka → AuthProvider cek sesi Supabase
2. Jika belum login → redirect ke Sign-in
3. Jika login → navigasi ke Dashboard (via expo-router stack + tabs)
4. Data todos/transactions diambil via React Query + Supabase
5. CRUD action → update optimistis → sync realtime
6. UI selalu sinkron, offline cache tetap jalan

---

## 🚀 Teknologi
- [Expo](https://expo.dev/) + React Native
- [Supabase](https://supabase.com/) (Auth, DB, Storage, Realtime)
- [React Query](https://tanstack.com/query) (caching, optimistic update)
- [expo-router](https://expo.github.io/router) (navigation)
- AsyncStorage (offline cache)
- Tailwind / Custom style (UI)

---

## 📌 Roadmap
- [ ] OCR Receipt Scan → auto ekstrak transaksi dari struk
- [ ] Integrasi Chat Bot (Telegram/WhatsApp) untuk input
- [ ] Automation Rules (IF–THEN)
- [ ] Laporan mingguan & notifikasi pintar

---
starterKit [rnr-base-bare](https://github.com/a0m0rajab/rnr-base-bare).

