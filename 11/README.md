# B41M 17PlayBox — PS4 Exploit Host

Host web lokal dengan tampilan B41M untuk menjalankan chain eksploit WebKit pada browser PlayStation 4. Halaman utama mendeteksi versi firmware, memilih chain yang sesuai, lalu memuat payload yang tersedia di proyek.

> Gunakan hanya pada perangkat yang Anda miliki atau kelola secara sah. Risiko kegagalan, crash, atau reboot tetap ada.

## Firmware yang tersedia

Proyek ini memiliki tabel offset untuk firmware berikut:

| Firmware | Chain | Status pada tabel offset |
| --- | --- | --- |
| 11.00 | Lapse | Terbukti (`proven`) |
| 11.50 | Lapse | Terbukti (`proven`) |
| 12.00 | Lapse | Terbukti (`proven`) |
| 12.02 | Lapse | Terbukti (`proven`) |
| 12.50 | Poops | Terbukti (`proven`) |
| 12.52 | Poops | Terbukti (`proven`) |
| 13.00 | Poops | Terbukti (`proven`) |

Versi lain—termasuk 11.01 atau 12.01—tidak boleh dianggap didukung hanya karena berada dalam rentang nomor yang sama. Chain membutuhkan offset yang tepat untuk setiap firmware.

## Cara menjalankan host

1. Letakkan seluruh isi folder ini pada web server lokal atau hosting HTTP/HTTPS.
2. Pastikan PS4 dan server berada pada jaringan yang sama, lalu buka alamat host dari browser PS4.
3. Saat pertama kali dibuka dalam keadaan online, browser akan mengunduh resource pada `cache.appcache`.
4. Setelah cache selesai, halaman utama otomatis melanjutkan ke chain yang dipilih untuk firmware tersebut.

Jangan membuka `index.html` langsung dari penyimpanan lokal. Fitur cache offline membutuhkan halaman disajikan melalui HTTP/HTTPS.

## Penggunaan offline

`cache.appcache` mendaftarkan halaman, JavaScript, worker, payload, patch firmware, dan logo agar tersedia setelah cache awal selesai. Server harus menyajikan `cache.appcache` dengan MIME type `text/cache-manifest`.

Setiap perubahan pada resource yang ingin didistribusikan ke cache perlu disertai perubahan nomor `# build` dalam `cache.appcache`; hal tersebut memicu browser memeriksa dan mengunduh cache versi baru saat online.

## Struktur berkas

| Berkas | Kegunaan |
| --- | --- |
| `index.html` | Antarmuka B41M, deteksi firmware, pemilihan chain, dan kontrol cache. |
| `run_lapse.html` | Halaman eksekusi chain Lapse. |
| `run_poops.html` | Halaman eksekusi chain Poops. |
| `chain_lapse.js` / `chain_poops.js` | Implementasi chain untuk firmware yang sesuai. |
| `ps4_offsets.js` | Tabel offset dan status validasi tiap firmware. |
| `core.js`, `mem.js`, `int64.js`, `rpc_worker.js` | Komponen pendukung primitive memori dan worker. |
| `payload.bin` | Payload yang dimuat setelah chain berhasil. |
| `patches/*.bin` | Data patch kernel untuk firmware tertentu. |
| `cache.appcache` | Daftar resource yang disimpan agar host dapat dipakai offline. |

## Catatan penting

- Keberhasilan tidak dijamin dan waktu eksekusi dapat berbeda menurut firmware serta kondisi browser.
- Jika proses meminta reboot atau menampilkan kegagalan, ikuti status yang tampil sebelum mencoba lagi.
- Halaman utama hanya memulai chain secara otomatis setelah alur cache selesai; koneksi server tetap diperlukan saat cache pertama kali dibuat atau diperbarui.

## Informasi

- Alamat: Jl. Tahir, Muara Jawa, Kukar, Kalimantan Timur, Indonesia
- Kontak: 085555551497
- Hak cipta: © 2026 B41M 17PlayBox
- Pemilik: Ibrahim Yusuf
