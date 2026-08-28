# B41M 17PlayBox

## Local WebKit Host for PlayStation 4 and PlayStation 5

B41M 17PlayBox adalah host web lokal untuk menjalankan workflow WebKit pada browser PlayStation 4 dan PlayStation 5 yang didukung. Beranda utama mendeteksi firmware bila memungkinkan, mengarahkan pengguna ke host yang sesuai, dan menyediakan cache offline setelah resource selesai diunduh.

> Gunakan hanya pada perangkat yang Anda miliki atau kelola secara sah. Proses ini dapat menyebabkan crash, reboot, kehilangan data, pembatalan garansi, atau pelanggaran ketentuan layanan.

## Fitur Utama

- Beranda pemilih host dengan deteksi firmware dan pilihan manual.
- Antarmuka terminal B41M yang konsisten pada halaman PS4 dan PS5.
- Dukungan cache offline melalui Application Cache.
- Host PS4 untuk firmware legacy dan modern.
- Pilihan chain PS4 NetCtrl atau Lapse pada folder `6`.
- Chain Lapse dan Poops untuk firmware yang tersedia pada host `11`.
- Host PS5 SlopKit dengan pengiriman payload ELF.
- Favicon dan identitas visual B41M pada halaman HTML utama.

## Dukungan Firmware

### PlayStation 4

| Host | Firmware | Keterangan |
| --- | --- | --- |
| `6/` | 6.00-10.50 | Host legacy dengan pilihan chain NetCtrl atau Lapse. |
| `11/` | 11.00, 11.50, 12.00, 12.02, 12.50, 12.52, 13.00 | Host modern dengan chain sesuai tabel offset. |

Versi firmware harus cocok dengan offset yang tersedia. Jangan menganggap semua versi di antara angka pada tabel otomatis didukung.

### PlayStation 5

| Host | Firmware |
| --- | --- |
| `ps5/` | 9.00-12.00, sesuai offset yang tersedia |

Offset PS5 tersedia di `ps5/offsets/`. Payload ELF dan BIN tersedia di `ps5/payloads/`.

## Menjalankan Host

Host harus disajikan melalui HTTP atau HTTPS. Jangan membuka file HTML langsung dengan skema `file://`, karena worker, module script, fetch, dan cache offline dapat gagal.

1. Hubungkan perangkat dan komputer/server ke jaringan yang sama.
2. Jalankan web server dari direktori proyek.
3. Buka alamat server dari browser konsol.
4. Tunggu cache awal selesai sebelum menggunakan mode offline.
5. Pilih host dan workflow sesuai firmware perangkat.

Contoh dengan Python:

```bash
python3 -m http.server 8000
```

Buka alamat berikut dari browser konsol:

```text
http://IP-SERVER:8000/
```

## Struktur Proyek

```text
.
├── index.html                 # Beranda pemilih host PS4/PS5
├── cache.manifest             # Cache beranda utama
├── 6/                         # Host PS4 firmware 6.00-10.50
│   ├── index.html
│   ├── cache.manifest
│   ├── includes/              # UI dan kontrol auto-jailbreak
│   └── src/                   # Userland, kernel, worker, dan chain
├── 11/                        # Host PS4 firmware modern
│   ├── index.html
│   ├── cache.appcache
│   ├── run_lapse.html
│   ├── run_poops.html
│   ├── chain_lapse.js
│   ├── chain_poops.js
│   └── patches/               # Patch firmware
└── ps5/                       # Host PlayStation 5
    ├── index.html
    ├── cache.manifest
    ├── main.css
    ├── offsets/               # Offset per firmware
    ├── payloads/              # Payload ELF dan BIN
    └── slopkit/               # Runtime dan halaman eksekusi
```

## Cache Offline

Manifest yang digunakan proyek:

| Area | Manifest |
| --- | --- |
| Beranda utama | `cache.manifest` |
| PS4 legacy | `6/cache.manifest` |
| PS4 modern | `11/cache.appcache` |
| PS5 | `ps5/cache.manifest` |

Cache harus dibuat atau diperbarui ketika server masih dapat diakses. Setelah file JavaScript, CSS, HTML, payload, offset, atau patch berubah, perbarui versi komentar manifest atau regenerasi manifest agar browser mendeteksi perubahan.

Server perlu mengirim file `.manifest` dan `.appcache` dengan MIME type `text/cache-manifest` bila browser target masih memerlukan Application Cache.

## Troubleshooting

| Gejala | Pemeriksaan |
| --- | --- |
| Halaman putih atau module gagal dimuat | Pastikan host dijalankan melalui HTTP/HTTPS, bukan `file://`. |
| Firmware tidak terdeteksi | Gunakan pilihan manual dan pastikan firmware memiliki offset yang tersedia. |
| Cache tidak diperbarui | Ubah versi manifest, hapus cache browser bila perlu, lalu muat ulang dari server. |
| Proses meminta reboot | Ikuti status yang tampil dan jangan mengulangi proses pada kondisi kernel yang belum bersih. |
| Payload tidak muncul | Pastikan file payload berada di folder yang sesuai dan terdaftar dalam manifest. |
| Gambar dekoratif tidak tampil | Periksa resource gambar dan path relatif halaman yang memanggilnya. |

## Informasi Proyek

- **Nama:** B41M 17PlayBox
- **Pemilik:** Ibrahim Yusuf
- **Alamat:** Jl. Tahir, Muara Jawa, Kukar, Kalimantan Timur, Indonesia
- **Kontak:** 085555551497
- **Hak cipta:** © 2026 B41M 17PlayBox / Ibrahim Yusuf

## Penafian

Perangkat lunak ini disediakan apa adanya tanpa jaminan. Pengguna bertanggung jawab atas perangkat, data, akun, payload, dan lingkungan pengujian yang digunakan. Jangan menjalankan payload yang tidak tepercaya, dan jangan gunakan proyek ini pada perangkat yang bukan milik Anda atau tanpa izin pemiliknya.
