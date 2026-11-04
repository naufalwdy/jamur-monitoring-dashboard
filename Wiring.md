# Skema Pengkabelan (Wiring) Sistem Monitoring Jamur

Dokumen ini berisi daftar *pinout* pengkabelan untuk **Arduino Mega 2560** dan **ESP32** berdasarkan revisi terbaru. Ikuti panduan ini dengan seksama untuk menghindari kerusakan komponen.

---

## ⚡ Distribusi Tegangan (VCC & GND)

> [!WARNING]
> Pemberian tegangan yang salah dapat merusak sensor secara permanen atau membuat mikrokontroler kehilangan daya secara tiba-tiba (*brownout*).

- **GND (Ground) Bersama:** 
  Seluruh komponen (Arduino, ESP32, Sensor, dan Modul Relay) **WAJIB** memiliki jalur GND yang saling terhubung satu sama lain (*Common Ground*).
- **VCC 5V:** 
  Digunakan untuk LCD 16x2, Sensor CO2 (MH-Z19), Modul Relay, dan `VIN/5V` pada ESP32. Sangat disarankan menggunakan *Power Supply* (Adaptor) 5V eksternal yang cukup kuat (misal: `5V 3A`) karena ESP32 saat memancarkan WiFi membutuhkan arus yang besar.
- **VCC 3.3V atau 5V:** 
  Sensor SHT31 dan DS18B20 umumnya dapat mentoleransi 3.3V maupun 5V (tergantung spesifikasi modul breakout).

---

## 1. Arduino Mega 2560 (Kontroler Utama)

### 🌡️ Sensor & Display (Layar)

**1. Sensor SHT31 (Suhu & Kelembaban)**
- **Pin VCC** -> **3.3V / 5V** Arduino
- **Pin GND** -> **GND** Arduino
- **Pin SDA** -> **Pin 20 (SDA)** Arduino Mega
- **Pin SCL** -> **Pin 21 (SCL)** Arduino Mega

**2. Layar LCD 16x2 I2C**
- **Pin VCC** -> **5V** Arduino *(Wajib 5V)*
- **Pin GND** -> **GND** Arduino
- **Pin SDA** -> **Pin 20 (SDA)** Arduino Mega
- **Pin SCL** -> **Pin 21 (SCL)** Arduino Mega
*(Berbagi pin I2C yang sama dengan SHT31)*

**3. Sensor MH-Z19 (Kadar CO2)**
- **Pin VCC** -> **5V** Arduino *(Wajib 5V)*
- **Pin GND** -> **GND** Arduino
- **Pin TX**  -> **Pin 17 (RX2)** Arduino Mega *(Sistem Silang)*
- **Pin RX**  -> **Pin 16 (TX2)** Arduino Mega *(Sistem Silang)*

**4. Sensor DS18B20 (Suhu Evaporator / Probe Air)**
- **Pin VCC (Kabel Merah)**  -> **3.3V / 5V** Arduino
- **Pin GND (Kabel Hitam)**  -> **GND** Arduino
- **Pin Data (Kabel Kuning)** -> **Pin 10 (D10)** Arduino Mega
*(Wajib tambahkan Resistor 4.7kΩ yang menghubungkan kabel VCC dan Data)*

---

### 🎛️ Input Keypad 4x4

Sambungkan pin keypad berurutan dari kiri ke kanan.

- **Pin Baris 1 (R1)** -> **Pin 9 (D9)** Arduino
- **Pin Baris 2 (R2)** -> **Pin 8 (D8)** Arduino
- **Pin Baris 3 (R3)** -> **Pin 7 (D7)** Arduino
- **Pin Baris 4 (R4)** -> **Pin 6 (D6)** Arduino
- **Pin Kolom 1 (C1)** -> **Pin 5 (D5)** Arduino
- **Pin Kolom 2 (C2)** -> **Pin 4 (D4)** Arduino
- **Pin Kolom 3 (C3)** -> **Pin 3 (D3)** Arduino
- **Pin Kolom 4 (C4)** -> **Pin 2 (D2)** Arduino

---

### ⚙️ Output Aktuator

> [!CAUTION]
> Jangan mengambil tegangan 5V langsung dari pin board Arduino Mega untuk mensuplai daya Modul Relay. Tarikan arus dapat menyebabkan Arduino me-restart (*brownout*). Gunakan adaptor 5V eksternal khusus untuk relay!

**1. Blower AC (Evaporator / Indoor)**
- **Terminal Positif (+) SSR** -> **Pin 22 (D22)** Arduino Mega
- **Terminal Negatif (-) SSR** -> **GND** Arduino

**2. Exhaust Fan (Kipas Udara Keluar)**
- **Pin IN Relay**  -> **Pin 24 (D24)** Arduino Mega
- **Pin VCC Relay** -> **5V** Adaptor Eksternal
- **Pin GND Relay** -> **GND** Arduino / Adaptor Eksternal

**3. Mist Maker (Pembuat Kabut)**
- **Terminal Positif (+) SSR** -> **Pin 25 (D25)** Arduino Mega
- **Terminal Negatif (-) SSR** -> **GND** Arduino

**4. Kompressor AC (Outdoor)**
- **Terminal Positif (+) SSR** -> **Pin 26 (D26)** Arduino Mega
- **Terminal Negatif (-) SSR** -> **GND** Arduino

---

## 2. Penghubung ke ESP32 (Gateway WiFi)

> [!TIP]
> Arduino Mega menggunakan logika **5V** sedangkan ESP32 **3.3V**. Sangat disarankan memasang **Logic Level Converter** pada jalur transmisi data untuk menghindari kerusakan pada pin ESP32 dalam jangka panjang.

- **Pin TX1 (Pin 18)** di Arduino Mega -> **Pin RX2 (Pin 16)** di ESP32
- **Pin RX1 (Pin 19)** di Arduino Mega -> **Pin TX2 (Pin 17)** di ESP32
- **Pin GND** Arduino Mega -> **Pin GND** ESP32 *(WAJIB DISAMBUNGKAN)*
