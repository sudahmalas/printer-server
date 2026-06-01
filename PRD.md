# KLINIK PRINT SERVICE
## Product Requirement Document (PRD)
**Version:** 1.0

## 1. LATAR BELAKANG
Saya memiliki aplikasi Klinik / Hospital Information System (HIS) yang dibangun menggunakan:
- Laravel
- Vue.js
- SQLite / MySQL
- Laravel Reverb
- Electron (Desktop Mode)

Aplikasi dapat dijalankan dalam dua mode:

### Mode Web
Deploy ke:
- Shared Hosting (cPanel)
- VPS
- Dedicated Server

Akses melalui browser.

### Mode Desktop
Deploy ke:
- Windows PC
- Electron

Laravel berjalan secara lokal.

### Permasalahan
Browser tidak dapat:
- Silent Print
- Mengakses printer secara langsung
- Memilih printer otomatis
- Mengirim raw command ke printer

Karena itu dibutuhkan aplikasi terpisah bernama:
**Klinik Print Service**
yang berfungsi sebagai bridge antara aplikasi klinik dan printer lokal.

## 2. TUJUAN
Membuat aplikasi Print Service yang:
- Berjalan sebagai service lokal
- Ringan
- Stabil
- Dapat menerima perintah cetak dari aplikasi utama
- Mendukung Web dan Desktop Mode
- Mendukung berbagai jenis printer
- Memiliki monitoring
- Memiliki diagnostic tools
- Memiliki auto reconnect
- Mudah di-maintain

## 3. TEKNOLOGI
Gunakan:

**Backend**
- Node.js LTS
- TypeScript
- Express
- ws (WebSocket)

**Frontend Dashboard**
- Vue 3
- TypeScript
- Vite
- Pinia

**Build**
- pkg atau alternatif modern
- menghasilkan file `.exe`

**Database Lokal**
Gunakan:
- SQLite

Untuk menyimpan:
- konfigurasi
- printer mapping
- log
- queue

## 4. ARSITEKTUR

### High Level Architecture
```text
Aplikasi Klinik
       ↓
HTTP / WebSocket
       ↓
Klinik Print Service
       ↓
    Printer
```

### Deployment Architecture

#### Mode Web
```text
   Browser
       ↓
   Internet
       ↓
Laravel Hosting
       ↓
   WebSocket
       ↓
 Print Service
       ↓
 Printer Lokal
```

#### Mode Desktop
```text
   Electron
       ↓
 Laravel Lokal
       ↓
 Print Service
       ↓
 Printer Lokal
```

## 5. FITUR UTAMA

### 5.1 Service Background
Saat dijalankan:
- berjalan di background
- berjalan di system tray
- auto start Windows
- tidak membuka window utama

### 5.2 Dashboard
Dashboard digunakan untuk:
- monitoring
- konfigurasi
- troubleshooting

Menu:
- Dashboard
- Printers
- Printer Mapping
- Connection
- Logs
- Diagnostics
- Settings

## 6. CONFIGURATION

### General
**Field:** Service Name
**Contoh:** Printer CSSD Lantai 2

**Clinic Code**
**Contoh:** RS001

**Location Name**
**Contoh:** CSSD

**API Key**
Digunakan untuk autentikasi.

### Connection Settings
**Main Application URL**
**Contoh:** `https://klinikku.com`

**API URL**
**Contoh:** `https://klinikku.com/api`

**WebSocket URL**
**Contoh:** `wss://klinikku.com/app-print`

**HTTP Service Port**
**Default:** `18181`

**WebSocket Port**
**Default:** `18182`

**Reconnect Interval**
**Default:** `5 detik`

**Enable Auto Reconnect**
**Default:** `TRUE`

## 7. REGISTRASI KE APLIKASI UTAMA
Saat service aktif:
Service harus melakukan registrasi.

**Payload:**
```json
{
  "service_name": "Printer CSSD Lantai 2",
  "clinic_code": "RS001",
  "machine_name": "PC-CSSD",
  "ip_address": "192.168.1.10",
  "version": "1.0.0",
  "status": "online"
}
```

## 8. HEARTBEAT
Kirim heartbeat setiap 30 detik.

**Payload:**
```json
{
  "service_name": "Printer CSSD Lantai 2",
  "status": "online",
  "timestamp": "2026-01-01 10:00:00"
}
```

Jika tidak ada heartbeat selama 90 detik:
**Status:** OFFLINE

## 9. HTTP API
**Base URL:** `http://127.0.0.1:18181`

**GET /status**
**Response:**
```json
{ "success": true, "service": "running" }
```

**GET /printers**
**Response:**
```json
{ "success": true, "data": [] }
```

**POST /print/pdf**
**Request:**
```json
{ "printer": "EPSON L3210", "file": "base64_pdf" }
```

**POST /print/image**
**Request:**
```json
{ "printer": "Zebra", "file": "base64_png" }
```

**POST /print/raw**
**Request:**
```json
{ "printer": "Zebra", "content": "^XA..." }
```
Digunakan untuk:
- ZPL
- TSPL
- ESC/POS

**POST /test-print**
Cetak halaman test printer.

**POST /test-connection**
Test koneksi ke aplikasi utama.

## 10. WEBSOCKET
**Port:** `18182`

**Event:**
- `service.connected`
- `service.disconnected`
- `printer.list`
- `printer.status`
- `print.job`
- `print.success`
- `print.failed`
- `heartbeat`

## 11. SUPPORTED PRINTER

**Inkjet**
- Support: PDF, Image

**Laser**
- Support: PDF, Image

**Thermal**
- Support: ESC/POS

**Label Printer**
- Support: Zebra (ZPL), TSC (TSPL), Godex

## 12. PRINT QUEUE
Implementasikan queue.

**Status:**
- `pending`
- `printing`
- `success`
- `failed`
- `cancelled`

Queue diproses FIFO.

## 13. PRINTER MAPPING
**Tujuan:**
User tidak perlu memilih printer setiap cetak.

**Contoh:**
- PENDAFTARAN → EPSON L3210
- KASIR → EPSON TM-T82X
- CSSD → TSC TE244
- LABORATORIUM → Zebra GX420
- RADIOLOGI → HP LaserJet

**Payload dari aplikasi:**
```json
{ "module": "CSSD", "content": "..." }
```
Service otomatis menentukan printer.

## 14. TEST PRINT
**Button:** Test Print

**Output:**
```text
KLINIK PRINT SERVICE
Printer Test
Service: Printer CSSD Lantai 2
Status: SUCCESS
Date: 2026-01-01 10:00
```

## 15. TEST CONNECTION
**Button:** Test Connection

Melakukan:
- Ping API
- Ping WebSocket
- Test Authentication
- Test Registration

**Result:**
- ✓ API Connected
- ✓ WebSocket Connected
- ✓ Authentication Success
- ✓ Registered

## 16. DIAGNOSTICS CONSOLE
Buat halaman seperti terminal.

**Contoh:**
```text
[10:00:01] Service Started
[10:00:02] HTTP Server Started
[10:00:03] WebSocket Started
[10:00:04] Connecting...
[10:00:05] Connected
[10:01:00] Printer Found
[10:05:12] Print Job Received
[10:05:13] Printing...
[10:05:15] Success
```

**Fitur:**
- Auto Scroll
- Search
- Filter
- Export
- Copy
- Clear

## 17. LOGGING
**Folder:** `logs/`
**Format:** `YYYY-MM-DD.log`

Simpan:
- startup
- shutdown
- reconnect
- printer event
- print event
- error

## 18. OFFLINE MODE
Jika koneksi internet terputus:
Service tetap:
- berjalan
- menerima print localhost
- menyimpan queue sementara

Saat koneksi kembali:
- reconnect otomatis

## 19. SECURITY
Hanya menerima request:
- 127.0.0.1
- localhost
- IP yang di-whitelist

Gunakan:
- Header: `X-API-KEY`

Tambahkan:
- Rate Limit

Validasi seluruh payload.

## 20. DATABASE
Gunakan SQLite.

**Tabel:**
- settings
- printers
- printer_mappings
- print_jobs
- logs
- service_status

## 21. SYSTEM TRAY
Klik kanan tray:
- Open Dashboard
- Printers
- Test Print
- Test Connection
- View Logs
- Restart Service
- Exit

## 22. WINDOWS AUTO START
Saat Windows boot:
Service otomatis berjalan.

## 23. ERROR HANDLING
Tangani:
- Printer tidak ditemukan
- Printer offline
- Port digunakan aplikasi lain
- WebSocket disconnect
- API timeout
- File corrupt
- Queue gagal

Semua error harus tercatat di log.

## 24. PROJECT STRUCTURE
```text
src/
├── api/
├── websocket/
├── printer/
├── queue/
├── services/
├── database/
├── config/
├── logger/
├── tray/
├── views/
├── stores/
├── router/
├── utils/
├── types/
└── index.ts
```

## 25. DELIVERABLES
Buat:
- Source Code Lengkap
- TypeScript
- Vue 3 Dashboard
- SQLite
- REST API
- WebSocket Server
- Queue Manager
- Printer Manager
- Printer Mapping
- System Tray
- Auto Start Windows
- Installer Windows
- README Lengkap
- API Documentation
- Unit Test Dasar
- Integration Test Dasar
- Build Script Production
- Logging System
- Diagnostic Console
- Test Connection Tool

## 26. NON FUNCTIONAL REQUIREMENTS
- **Target RAM Idle:** < 100 MB
- **Target Startup:** < 5 Detik
- **Target Print Dispatch:** < 2 Detik
- **Target Availability:** 99.9%

Harus mendukung:
- Windows 10
- Windows 11
- Windows Server 2019
- Windows Server 2022

## 27. KONSEP UTAMA
- Print Service TIDAK mengambil data dari database aplikasi.
- Print Service TIDAK mengetahui data pasien.
- Print Service hanya menerima hasil render dari aplikasi utama berupa:
  - PDF
  - PNG
  - HTML
  - ZPL
  - TSPL
  - ESC/POS
- Kemudian meneruskan ke printer yang sesuai.
- Seluruh business logic tetap berada di aplikasi Klinik Laravel.
