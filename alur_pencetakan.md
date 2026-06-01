# Alur Sistem Pencetakan & Simulasi Penggunaan

Dokumen ini menjelaskan secara teknis bagaimana data mengalir dari tahap desain *template* hingga dokumen keluar dari mesin *printer* fisik, serta contoh skenario penggunaan sehari-hari di lingkungan klinik.

---

## 1. Flow Alur Data Pencetakan (End-to-End)

Sistem ini memisahkan otak pemrosesan (Aplikasi Utama) dengan eksekutor perangkat keras (Print Service). Berikut adalah tahapan lengkapnya:

### Fase 1: Desain Master Template
- Administrator menggunakan plugin **Label Editor** di Aplikasi Web Utama (Klinik) untuk mendesain format struk atau stiker *barcode*.
- Desain ini (yang mengandung variabel *placeholder* seperti `{{nama_pasien}}`) disimpan di *database* Laravel sebagai **Master Template**.

### Fase 2: Pencampuran Data & Rendering (Aplikasi Utama)
- **Aksi Petugas**: Petugas loket melayani pasien dan menekan tombol **"Cetak Antrian"**.
- **Data Binding**: Aplikasi Utama mengambil *Master Template* dari *database*, lalu mengganti variabel dinamisnya dengan data asli pasien saat itu (misal: `{{nama_pasien}}` diganti `"Budi"`).
- **Rendering**: Aplikasi Utama mem-format hasil pencampuran tersebut ke dalam bahasa yang dipahami mesin printer:
  - *Printer Thermal/Barcode (Zebra/TSC)*: Dirender menjadi instruksi murni (*RAW data* seperti ZPL, TSPL, ESC/POS).
  - *Printer Biasa (Inkjet/Laser)*: Dirender menjadi dokumen PDF dan diubah ke format teks *Base64*.

### Fase 3: Dispatch (Pengiriman)
- **Routing Berdasarkan Kategori Label**: Setiap jenis label/dokumen memiliki "Target Kategori" masing-masing. Misalnya, dalam 1x klik cetak pendaftaran, sistem bisa menghasilkan 2 dokumen berbeda:
  1. Label "Gelang Pasien"
  2. Dokumen "Lembar Rujukan (A4)"
- Aplikasi Utama mengetahui bahwa petugas saat ini sedang dilayani oleh **Print Service PC-A**.
- Aplikasi Utama membungkus semua dokumen tersebut ke dalam satu *batch payload* dan mengirimkannya ke Print Service PC-A.
- *Contoh Payload:*
  ```json
  {
    "jobs": [
      {
        "category": "Gelang Pasien",
        "type": "raw",
        "content": "^XA...Budi...^XZ"
      },
      {
        "category": "Dokumen A4",
        "type": "pdf",
        "content": "JVBERi0xLjQKJcOkw7..."
      }
    ]
  }
  ```

### Fase 4: Eksekusi (Di Komputer Lokal Petugas)
- Aplikasi **Electron Print Service** (yang berada di PC-A) menerima paket *batch* tersebut.
- Print Service membaca *property* `category` pada setiap dokumen. Ia lalu mengecek *database* SQLite lokalnya:
  - *"Untuk kategori 'Gelang Pasien', saya harus pakai printer apa ya? Oh, Zebra ZD230."*
  - *"Untuk kategori 'Dokumen A4', saya pakai printer EPSON L3110."*
- Print Service secara otomatis memisahkan dokumen-dokumen tersebut dan mengirimkannya ke masing-masing printer fisik yang tepat.
- Kertas dan gelang keluar bersamaan dari dua mesin printer yang berbeda secara instan, tanpa ada pop-up konfirmasi atau *dialog print* di layar petugas.

---

## 2. Simulasi Skenario Penggunaan

Mari kita simulasikan penerapannya di ruang Pendaftaran yang memiliki 2 buah loket.

### A. Tahap Setup Infrastruktur (Oleh IT / Superadmin)

**Di PC Loket 1:**
1. Staf IT menginstal aplikasi **Print Service (Electron)**.
2. PC ini terhubung dengan printer kabel USB bernama `"EPSON L3110"`.
3. Di dalam aplikasi Print Service, IT mengonfigurasi *mapping*:
   - Printer fisik `EPSON L3110` didaftarkan dengan Kategori **"Pendaftaran"**, Sub-Kategori **"Loket 1"**.
4. IT menekan tombol **"Register"**. Data profil mesin ini akan dikirim dan disimpan secara permanen di *database* Laravel Aplikasi Utama.

**Di PC Loket 2:**
1. Melakukan instalasi Print Service yang sama. PC ini kebetulan dicolok printer `"Zebra ZD230"`.
2. Di-mapping sebagai Kategori **"Pendaftaran"**, Sub-Kategori **"Loket 2"**.
3. Menekan **"Register"**.

### B. Tahap Operasional Harian (Oleh Petugas Klinik)

1. Petugas Loket 1 datang ke kantor, membuka *browser* Google Chrome, dan *login* ke dalam Aplikasi Klinik Utama.
2. Saat pertama kali *login* (atau telah diset sebelumnya oleh Admin), sistem otomatis mendeteksi profil petugas tersebut dan menetapkan **Printer Default**-nya ke mesin *Print Service* milik Loket 1 (EPSON L3110).
3. Petugas Loket 1 mulai melayani pendaftaran pasien pertama.
4. Di akhir proses pendaftaran, petugas cukup menekan tombol **"Cetak Pendaftaran"**.
5. Sistem akan menampilkan layar *Preview* singkat (jika dikonfigurasi). Di layar tersebut sudah terpilih printer Loket 1 secara otomatis.
6. Saat petugas klik "Konfirmasi Cetak", proses cetak akan berjalan secara siluman (*silent print*). Kertas antrian atau bukti pendaftaran langsung keluar dari printer EPSON L3110. Petugas tidak perlu lagi berurusan dengan menu "Manajemen Printer" atau memusingkan pengaturan perangkat keras.
