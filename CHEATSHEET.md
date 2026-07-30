# 🍄 Command Cheat Sheet (Monitoring Jamur)

Dokumen ini berisi kumpulan perintah (command) terminal yang esensial untuk memanajemen proyek, dari *upload* kode ke mikrokontroler hingga sinkronisasi repositori di Github. 

> **Catatan**: File `CHEATSHEET.md` ini telah ditambahkan ke dalam `.gitignore`, sehingga tidak akan pernah ter-upload ke Github. File ini hanya untuk penggunaan lokal Anda!

---

## ☁️ 1. Perintah Git (Mengupload ke Github)

Gunakan perintah ini di dalam terminal (Pastikan Anda sudah berada di dalam folder proyek, baik `jamur-lp` maupun `Jamur ESP32`).

- **Melihat status file yang berubah:**
  ```powershell
  git status
  ```
- **Menambahkan semua perubahan file agar siap disimpan:**
  ```powershell
  git add .
  ```
- **Menyimpan perubahan (Commit):**
  ```powershell
  git commit -m "Deskripsi perubahan Anda, misal: Perbaiki tampilan"
  ```
- **Mengupload kode ke Github (Push):**
  ```powershell
  git push
  ```
- **Perintah Cepat Satu Baris (Add, Commit, Push):**
  *(Berfungsi baik di PowerShell)*
  ```powershell
  git add . ; git commit -m "Update otomatis" ; git push
  ```

---

## 💻 2. Perintah Web Dashboard (React/Astro)

Pastikan terminal Anda berada di dalam folder `d:\Kuliah Teknik Elektro\Tugas Akhir\Coding\Monitoring Jamur\jamur-lp`

- **Menjalankan website secara lokal (Mode Pengembangan):**
  ```powershell
  npm run dev
  ```
  *(Akses website di browser pada `http://localhost:4321`)*

- **Menginstall modul/library baru:**
  ```powershell
  npm install
  ```
  *(Wajib dijalankan jika Anda baru memindahkan/clone proyek ke laptop baru)*

- **Membangun website siap publikasi (Production Build):**
  ```powershell
  npm run build
  ```

---

## 📡 3. Perintah Hardware & Mikrokontroler (PlatformIO)

Pastikan terminal Anda berada di dalam folder `d:\Kuliah Teknik Elektro\Tugas Akhir\Coding\Jamur ESP32\Jamur ESP32`.

*(Jika Anda menggunakan VS Code, Anda cukup mengeklik ikon **Tanda Centang (Build)** atau **Panah Kanan (Upload)** di panel paling kiri bawah)*

- **Meng-compile kode (Build) untuk memeriksa penulisan kode (syntax) tanpa mengupload:**
  ```powershell
  pio run
  ```
- **Meng-upload (Flash) kode ke ESP32 via kabel USB:**
  ```powershell
  pio run --target upload
  ```
- **Membuka Serial Monitor (Melihat log komunikasi data):**
  ```powershell
  pio device monitor -b 115200
  ```
- **Membersihkan build *cache* (Jika tiba-tiba terjadi eror kompilasi yang aneh):**
  ```powershell
  pio run --target clean
  ```

---

## 🛠️ Tips Tambahan Terminal PowerShell
- Gunakan tombol `Tab` pada *keyboard* Anda untuk **Auto-complete** penulisan nama file atau folder di terminal.
- Gunakan tombol **Panah Atas** di *keyboard* untuk memanggil ulang perintah terminal yang sebelumnya baru saja diketik.
- Di Windows PowerShell, karakter pembatas antar-perintah adalah titik koma (`;`), bukan simbol dan ganda (`&&`).
