# B41M 17PlayBox — PS4 WebKit Host

Host web lokal untuk memilih dan menjalankan rantai WebKit yang tersedia pada PlayStation 4. Proyek ini menyediakan beranda pemilih firmware, cache offline, dan dua host terpisah untuk rentang firmware yang berbeda.

> Gunakan hanya pada perangkat yang Anda miliki atau kelola secara sah. Penggunaan perangkat lunak seperti ini dapat melanggar ketentuan layanan, membatalkan garansi, atau menimbulkan risiko crash/reboot.

## Fitur

- Pemilih firmware dari satu halaman utama.
- Pilihan firmware terakhir disimpan di browser agar halaman berikutnya langsung membuka host yang sama.
- Tombol **GANTI PILIHAN FIRMWARE** pada beranda dan pada setiap host.
- Dukungan cache AppCache untuk penggunaan offline setelah cache awal selesai.
- Host firmware lama dengan pilihan rantai NetCtrl atau Lapse.
- Host firmware modern yang memilih metode sesuai firmware yang terdeteksi.

## Firmware yang tersedia

| Folder | Firmware | Keterangan |
| --- | --- | --- |
| `6` | 6.00–10.50 | Host legacy. Memuat pilihan rantai NetCtrl atau Lapse. |
| `11` | 11.00, 11.50, 12.00, 12.02, 12.50, 12.52, 13.00 | Host modern. Menggunakan Lapse sampai 12.02 dan Poops mulai 12.50. |

Jangan menganggap seluruh versi di antara angka di atas didukung. Khusus host `11`, offset harus cocok persis dengan versi firmware yang tersedia pada tabel offset.

## Cara menggunakan

1. Sajikan folder proyek ini melalui web server HTTP/HTTPS pada jaringan lokal. Jangan membuka file HTML langsung dari penyimpanan lokal.
2. Pastikan PS4 dan server berada di jaringan yang sama.
3. Dari browser PS4, buka alamat host, misalnya `http://IP-SERVER:PORT/`.
4. Saat pertama kali membuka beranda dan host firmware, biarkan proses cache selesai.
5. Pilih firmware yang sesuai, lalu lanjutkan melalui antarmuka host.

Contoh menjalankan server lokal:

```bash
python3 -m http.server 8000
```

Kemudian buka `http://IP-SERVER:8000/` pada browser PS4.

## Penggunaan offline

Setiap bagian menggunakan manifest cache:

| Halaman | Manifest |
| --- | --- |
| Beranda utama | `cache.manifest` |
| Host firmware 6 | `6/cache.manifest` |
| Host firmware 11 | `11/cache.appcache` |

Untuk penggunaan tanpa internet, buka beranda dan host firmware yang dipilih sekali ketika server masih dapat diakses. Setelah indikator cache selesai, resource yang terdaftar dapat dimuat dari cache browser.

Server harus mengirim file `.manifest` dan `.appcache` sebagai MIME type `text/cache-manifest`. Bila isi file host diubah, perbarui manifest cache agar browser mengunduh revisi terbaru.

## Mengganti firmware

Pilihan firmware disimpan secara lokal pada browser. Saat membuka beranda lagi, pengguna akan diarahkan otomatis ke pilihan sebelumnya.

Untuk memilih ulang:

1. Tekan **GANTI PILIHAN FIRMWARE** pada host yang sedang terbuka, atau tombol yang sama di beranda.
2. Pilihan tersimpan akan dihapus.
3. Pilih firmware yang benar dari beranda.

## Kepemilikan

**Nama proyek:** B41M 17PlayBox — PS4 WebKit Host  
**Pemilik:** Ibrahim Yusuf  
**Alamat:** Jl. Tahir, Muara Jawa, Kukar, Kalimantan Timur, Indonesia  
**Kontak:** 085555551497  
**Hak cipta:** © 2026 B41M 17PlayBox / Ibrahim Yusuf. Seluruh hak cipta atas penyesuaian antarmuka, konfigurasi, dan dokumentasi proyek ini dimiliki oleh pemilik yang tercantum di atas.

## Penafian

Proyek disediakan apa adanya tanpa jaminan. Pemilik tidak bertanggung jawab atas kerusakan perangkat, kehilangan data, penangguhan akun, atau konsekuensi lain yang timbul dari penggunaan proyek ini. Selalu gunakan payload yang tepercaya dan pahami risikonya sebelum menjalankan proses apa pun.
