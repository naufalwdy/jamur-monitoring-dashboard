# 🍄 Mushroom Cultivation Dashboard

A professional, real-time IoT dashboard built for automated mushroom cultivation. Designed with a **Vanguard Ethereal Glass** aesthetic, this dashboard allows users to monitor environmental conditions and securely control hardware actuators remotely.

## ✨ Key Features

- **Real-Time Telemetry**: Live monitoring of CO₂, Temperature, Humidity, and Evaporator Temperature.
- **Asymmetrical Bento Grid**: A sleek and modern layout for displaying Key Performance Indicators (KPIs).
- **Admin Security Mode**: Protected route (`Petani` / `jamurku`) for manual actuator overrides and setpoint configuration.
- **Offline Resilience**: Capable of reading historical data (`10m` and `1h` averages) pushed by the ESP32 even after hardware reconnects.
- **CSV Data Export**: Download cultivation logs directly for analysis.
- **Dark/Light Mode**: Full theming support with smooth transitions.

## 🛠️ Tech Stack

- **Framework**: [Astro](https://astro.build/)
- **UI Library**: React & Framer Motion
- **Styling**: TailwindCSS & Vanilla CSS (Vanguard Ethereal Glass UI)
- **Database**: Firebase Realtime Database
- **Charting**: Recharts

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase Project configured for Realtime Database

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## 🔒 Security

Actuator controls and setpoint settings are secured behind a frontend gate. 

*Note: For production, ensure your Firebase Database Rules are properly configured to restrict write access from unauthorized clients.*
