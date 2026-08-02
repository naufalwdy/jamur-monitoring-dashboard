# Skema Pengkabelan (Wiring) Sistem Monitoring Jamur

Dokumen ini berisi daftar pinout pengkabelan untuk Arduino Mega 2560 dan ESP32 berdasarkan kode program yang telah dibuat.

## ⚡ Distribusi Tegangan (VCC & GND)
Pemberian tegangan yang benar sangat penting agar sensor bekerja akurat dan mikrokontroler tidak rusak.
- **GND (Ground) Bersama:** Seluruh komponen (Arduino, ESP32, Sensor, dan Modul Relay) **WAJIB** memiliki jalur GND yang saling terhubung satu sama lain (Common Ground).
- **VCC 5V:** Digunakan untuk LCD 16x2, Sensor CO2 (MH-Z19), Modul Relay, dan VIN/5V pada ESP32. Sangat disarankan menggunakan Power Supply (Adaptor) 5V eksternal yang cukup kuat (misal: 5V 3A atau lebih) karena modul relay dan ESP32 saat memancarkan WiFi membutuhkan arus yang cukup besar.
- **VCC 3.3V atau 5V:** Sensor SHT31 dan DS18B20 umumnya dapat mentoleransi 3.3V maupun 5V (tergantung spesifikasi modul breakout yang Anda beli). 

## 1. Arduino Mega 2560 (Kontroler Utama)

### Sensor & Komunikasi
| Komponen | Pin Arduino Mega | Keterangan |
|---|---|---|
| **SHT31** (Suhu & Kelembaban) | SDA (20) & SCL (21) | VCC ke 3.3V/5V, GND ke GND. Jalur komunikasi: I2C |
| **LCD 16x2 I2C** | SDA (20) & SCL (21) | VCC **WAJIB 5V**, GND ke GND. Berbagi jalur I2C (Alamat `0x27`) |
| **MH-Z19** (Sensor CO2) | TX2 (16) & RX2 (17) | VCC **WAJIB 5V**, GND ke GND. *TX Sensor ke RX2(17), RX Sensor ke TX2(16)* |
| **DS18B20** (Suhu Evaporator) | D10 | VCC ke 3.3V/5V, GND ke GND. Pasang resistor *pull-up* 4.7kΩ antara D10 dan VCC |
| **ESP32** (Gateway Web) | TX1 (18) & RX1 (19) | VCC (VIN) ke 5V, GND ke GND. Komunikasi via Serial1 (115200 baud) |

### Input Keypad 4x4
| Pin Keypad | Pin Arduino Mega |
|---|---|
| Baris 1 (R1) | D9 |
| Baris 2 (R2) | D8 |
| Baris 3 (R3) | D7 |
| Baris 4 (R4) | D6 |
| Kolom 1 (C1) | D5 |
| Kolom 2 (C2) | D4 |
| Kolom 3 (C3) | D3 |
| Kolom 4 (C4) | D2 |

### Output Aktuator (Relay)
| Aktuator | Pin Arduino Mega | Keterangan |
|---|---|---|
| Blower AC (Evaporator / Indoor) | D22 | Ke terminal (+) Input SSR (Solid State Relay). Terminal (-) SSR ke GND Arduino. |
| Exhaust Fan | D24 | Ke pin IN Relay mekanik biasa. VCC Relay ke 5V, GND ke GND |
| Mist Maker | D25 | Ke terminal (+) Input SSR (Solid State Relay). Terminal (-) SSR ke GND Arduino. |
| Kompressor AC (Start) | D26 | Ke pin IN Relay. Mengirimkan sinyal trigger (pulse) |
| Kompressor AC (Stop) | D27 | Ke pin IN Relay. Mengirimkan sinyal trigger (pulse) |

*(Catatan Relay: Sangat disarankan mengambil suplai tegangan 5V dari adaptor eksternal khusus untuk board relay. Jangan mengambil tegangan 5V langsung dari pin board Arduino Mega karena tarikan arus dari banyak relay dapat menyebabkan Arduino me-restart / kehilangan tenaga secara tiba-tiba).*

**Catatan Khusus Kompressor AC (Rangkaian Latching):**
> Kompressor AC membutuhkan daya yang sangat besar, sehingga dikendalikan menggunakan **Kontaktor Magnetik** yang dikombinasikan dengan dua buah modul relay untuk membentuk rangkaian pengunci (*latching circuit*). Hal ini dilakukan agar mikrokontroler tidak perlu terus-menerus menahan relay dalam kondisi aktif (yang dapat merusak relay jika dilakukan dalam jangka panjang).
> 
> **Prinsip Kerja & Skema Pengkabelan Latching:**
> 1. **Relay Start (D26):** Terminal *Normally Open (NO)* pada relay ini dihubungkan secara seri dengan koil kontaktor (A1/A2). Ketika mikrokontroler mengirimkan pulsa `HIGH` sesaat ke D26, relay menutup dan menyetrum koil kontaktor sehingga kompressor menyala.
> 2. **Pengunci (Auxiliary Contact):** Kontak bantu *Normally Open (NO)* yang ada pada bodi kontaktor dihubungkan secara paralel (berseberangan) dengan terminal NO dari **Relay Start**. Begitu kontaktor menyala, kontak bantu ini akan tertutup dan mengambil alih aliran listrik ke koil kontaktor, sehingga koil tetap menyala meskipun Relay Start sudah kembali mati (pulsa selesai).
> 3. **Relay Stop (D27):** Terminal *Normally Closed (NC)* pada relay ini dipasang secara seri di jalur utama yang mensuplai listrik ke koil kontaktor (sebelum masuk ke Relay Start dan kontak bantu). 
> 4. Ketika mikrokontroler ingin mematikan AC, ia mengirimkan pulsa sesaat ke D27. Relay Stop akan aktif sesaat (memutus kontak NC-nya menjadi terbuka), sehingga aliran listrik ke koil kontaktor terputus total. Kontaktor akan mati, kontak bantunya kembali terbuka, dan rangkaian *latching* terlepas.

---

## 2. ESP32 (Gateway WiFi & Web Server)

| Komponen | Pin ESP32 | Keterangan |
|---|---|---|
| **Arduino Mega 2560** (TX) | RX2 (16) | Hubungkan ke **TX1 (18)** Arduino Mega |
| **Arduino Mega 2560** (RX) | TX2 (17) | Hubungkan ke **RX1 (19)** Arduino Mega |
| **Ground (GND)** | GND | **WAJIB** dihubungkan ke GND Arduino Mega agar Serial stabil |

## Catatan Penting
- **Komunikasi Serial:** Harus disilang (RX ketemu TX, TX ketemu RX).
- **Ground Bersama:** Jangan lupa menghubungkan GND antara Arduino Mega, ESP32, dan suplai daya eksternal untuk relay agar sinyal tidak *error* atau ber-noise.
- **Tegangan Sinyal:** Arduino Mega menggunakan logika 5V sedangkan ESP32 3.3V. Komunikasi RX/TX biasanya cukup aman dihubungkan langsung, namun untuk umur panjang dan keamanan sangat disarankan menggunakan *Logic Level Converter* pada jalur TX Mega (18) ke RX ESP32 (16).
