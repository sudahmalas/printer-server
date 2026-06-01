# ID-GROW Print Service

ID-GROW Print Service adalah aplikasi jembatan lokal (Desktop-based) yang berfungsi sebagai *print server* mandiri di setiap komputer (PC) loket rumah sakit/klinik Anda. Aplikasi ini memungkinkan **Aplikasi Utama (Klinik Web)** untuk mencetak dokumen (seperti resep obat, nomor antrean, gelang pasien) secara **langsung tanpa muncul dialog print browser (Zero-Click Printing)**.

Aplikasi ini dibangun menggunakan teknologi modern: **Electron, Vue 3, Vite, dan Express.js**.

## Fitur Utama

- 🚀 **Zero-Click Printing:** Mencetak otomatis ke printer fisik di latar belakang (*background*).
- 🔀 **Smart Printer Routing:** Mengarahkan cetakan secara cerdas berdasarkan kategori (misalnya: kategori "Gelang Pasien" otomatis dicetak ke Printer Thermal Zebra, kategori "Laporan" dicetak ke Printer Epson A4) menggunakan satu jalur IP.
- 🔗 **Auto-Sync Server:** Memiliki antarmuka pengguna (UI) lokal untuk mendaftarkan nama ruangan dan nama PC (unik) ke Server Laravel pusat dengan sekali klik.
- 🌐 **Local HTTP Server:** Membuka *port* `18181` secara lokal untuk menerima dokumen (PDF atau instruksi) yang ditembak langsung oleh aplikasi utama.

## Arsitektur Singkat

1. **Print Service** berjalan di setiap komputer PC di klinik (misal di PC Registrasi, PC Farmasi, dsb).
2. Setiap kali dijalankan, Print Service membuka API lokal di `http://127.0.0.1:18181/print`.
3. Dari *browser* Aplikasi Utama, saat dokter/kasir menekan "Cetak", *browser* akan menembak data HTTP POST secara *peer-to-peer* ke IP komputer Print Service tersebut tanpa harus mengirim file PDF kembali ke *Cloud*.

---

## Cara Instalasi

Pastikan komputer Anda sudah terinstal **Node.js** (rekomendasi versi 18 atau ke atas) dan **Git**.

1. **Kloning Repositori ini:**
   ```bash
   git clone git@github.com-ibnu:sudahmalas/printer-server.git
   cd printer-server
   ```
   *(Catatan: Sesuaikan URL remote SSH dengan yang Anda miliki jika diperlukan).*

2. **Instalasi Dependencies (Pustaka):**
   ```bash
   npm install
   ```

## Cara Menjalankan (Tahap Development)

Untuk menjalankan aplikasi ini pada saat proses *development* / pengkodean, jalankan perintah:
```bash
npm run dev:electron
```
Perintah ini akan menggunakan `concurrently` untuk menyalakan Vite Server di satu sisi dan Electron App di sisi lainnya.

## Cara Menggunakan (Konfigurasi Awal)

1. Setelah aplikasi Print Service terbuka, Anda akan melihat tampilan *dashboard* utama.
2. Di bagian **Server Configuration**:
   - Isi **Nama Ruangan** (Contoh: "Loket Pendaftaran").
   - Isi **Nama PC** secara unik (Contoh: "PC-LOKET-01").
   - Pastikan **URL Server Aplikasi** sudah terisi mengarah ke alamat *Backend* Laravel Anda (misal: `http://192.168.1.10:8000`).
3. Di bagian **Active Mappings**:
   - Klik **Add Route**.
   - Isi kolom **Label Category** (contoh: "Gelang Pasien"). Kategori ini harus sama persis dengan yang dikirimkan oleh Aplikasi Utama.
   - Pada kolom drop-down **Target Hardware**, pilih mesin printer fisik yang sedang tercolok ke komputer Anda.
4. Klik tombol **Sync to Server** (atau "Save Changes"). Pengaturan ini akan tersimpan permanen di PC Anda dan sekaligus didaftarkan (*registered*) ke *database* Aplikasi Utama.
5. Selesai! Print Service akan berjalan diam di pojok layar (System Tray) Anda dan siap menerima perintah cetak.

## Cara *Build* untuk Tahap Production (Rilis)

Jika Anda ingin membungkus (*package*) aplikasi ini menjadi satu file `.exe` yang bisa di-klik dua kali oleh orang awam (tanpa perlu Node.js), Anda bisa menggunakan *electron-builder*:
```bash
npm run build
# perintah build Anda disesuaikan dengan script di package.json
```
