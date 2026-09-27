# Smart Notch for Windows (v7.0.0)

<p align="center">
  <img src="./assets/icon.png" width="120" height="120" alt="Smart Notch Logo" />
</p>

<h3 align="center">The Dynamic Island experience, reimagined for Windows.</h3>

<p align="center">
  <a href="https://apps.microsoft.com/detail/9N1D46F5X565?mode=direct">
    <img src="https://get.microsoft.com/images/en-us%20dark.svg" width="190" alt="Get it from Microsoft Store" />
  </a>
  &nbsp;&nbsp;
  <a href="https://dynamic-island-windows.vercel.app/">
    <img src="https://img.shields.io/badge/Official_Website-dynamic--island-38bdf8?style=for-the-badge&logo=vercel" alt="Official Website" />
  </a>
  &nbsp;&nbsp;
  <a href="https://github.com/Avenger11764/Dynamic_island/releases">
    <img src="https://img.shields.io/badge/Release-v7.0.0-10b981?style=for-the-badge&logo=windows" alt="Version 7.0.0" />
  </a>
</p>

---

## 🌟 What's New in Version 7.0.0

- **🎨 Bespoke Hardware Badges**: Handcrafted precision vector icons for CPU (Apple Silicon Die), RAM (Gold-contact DRAM module), Audio (Sculpted Driver Cans), and Network (Radar Wi-Fi 7) with ultra-sharp high-DPI scaling.
- **🎤 Live Synced Karaoke Lyrics**: Real-time word-by-word synchronized lyrics scrolling with active vocal line highlighting and dynamic ambient album cover art halo glow.
- **⚡ System Telemetry & One-Tap Boost**: Real-time CPU, RAM, and network speed dials with an integrated instant memory optimization button.
- **🪟 Adaptive Side & Top Docking**: Intelligently adapts when docked on side screen edges, featuring vertically expanding Bluetooth device cards and hardware dials.
- **✕ Seamless Header Close Button**: Integrated a discreet, smooth close button directly into the island header next to Settings for effortless application exiting.
- **🎛️ macOS-Style Control Center**: Smooth interactive sliders for system display brightness, volume, and quick utility toggles.
- **🚀 Ultra-Low Overhead**: Drastically optimized background PowerShell workers, memoized component tree, and near-zero idle RAM usage.

---

## 📸 Screenshots

| Collapsed Notch (Idle) | Dashboard View |
|:---:|:---:|
| ![Collapsed Mode](./assets/compact_mode_v2.png) | ![Dashboard Mode](./assets/dashboard_mode_v2.png) |

| Live Synced Lyrics & Media | Hardware Telemetry & Boost |
|:---:|:---:|
| ![Media Player Lyrics](./assets/media_player_v2.png) | ![Hardware Stats](./assets/hardware_stats_v2.png) |

| macOS Control Center | Settings & Customization |
|:---:|:---:|
| ![Control Center](./assets/control_center_v2.png) | ![Settings Mode](./assets/settings_mode_v2.png) |

| Network Speed Monitor | Edge Shelf / Docking Bar |
|:---:|:---:|
| ![Network Stats](./assets/network_stats_v2.png) | ![Bar Mode](./assets/bar_mode_v2.png) |

---

## ✨ Features

- **Media Controls & Synced Lyrics**: Native Spotify & Windows SMTC integration with real-time karaoke lyrics, animated audio waveform, and ambient cover glow.
- **Intelligent Status Capsule**: Compact idle state featuring live battery percentage ring, time, date, network activity, and active device indicators.
- **Hardware Telemetry**: Real-time CPU usage, RAM load, and internet upload/download speeds tracked in beautifully frosted glassmorphism dials.
- **One-Tap Memory Boost**: Integrated memory cleaner that clears standby cache with a single tap.
- **Volume & Brightness Gestures**: Adjust global volume and display brightness simply by scrolling with your mouse wheel over the notch.
- **Focus & Productivity**: Built-in Pomodoro timer and stopwatch that take over the collapsed pill seamlessly when active.
- **Customization Engine**: Cosmic Minimalist theme with a full-spectrum RGB/Hex color picker, custom background GIFs, panel materials, and glow intensity controls.
- **Flawless Layering**: Custom window management engine strictly enforcing highest z-index, keeping the island above full-screen apps and games without stealing keyboard focus.
- **Liquid Spring Physics**: Fluid drag-and-drop mechanics with magnetic snapping to top, left, or right screen edges.
- **Privacy First**: Fully offline, zero telemetry, and isolated Electron contexts.

---

## 📥 Installation

### Method 1: Microsoft Store (Recommended)
Install directly from the [Microsoft Store](https://apps.microsoft.com/detail/9N1D46F5X565?mode=direct) for automatic updates and verified security.

### Method 2: Direct Setup Installer
Download the latest Windows installer directly:
- **Direct NSIS Installer**: [Smart Notch Setup 7.0.0.exe](https://github.com/Avenger11764/Dynamic_island/raw/main/website/public/Smart_Notch_Setup_7.0.0.exe)
- **Windows Store Package**: `release/Smart Notch 7.0.0.appx`

---

## 🛠️ Local Development

If you'd like to build or run Smart Notch locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Avenger11764/Dynamic_island.git
   cd Dynamic_island
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start in development mode:**
   ```bash
   npm run dev
   ```

4. **Launch Electron wrapper:**
   ```bash
   npm run electron:start
   ```

5. **Build production packages:**
   ```bash
   # Build NSIS Setup Installer
   npm run dist

   # Build Microsoft Store Package (.appx)
   npm run store
   ```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
