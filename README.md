# 🎬 Smart Video Player Configuration Panel

A powerful and interactive configuration interface built with **HTML, CSS, and Vanilla JavaScript** to dynamically control and preview a `<smart-video-player>` Web Component in real time.

This project provides a clean two-panel layout where users can adjust player settings and instantly see changes reflected in a live preview.

---

## 🚀 Overview

The Smart Video Player Configuration Panel allows developers and QA teams to:

- Configure player behavior  
- Adjust UI controls and layout  
- Test autoplay logic  
- Customize button positions  
- Enable/disable playback features  
- Monitor tracking events  
- Preview changes instantly  

All without using any frontend frameworks.

---

## 🖥️ Layout Structure

### 🛠 Configuration Panel
A structured form interface to control every aspect of the player.

### 🎥 Live Preview Panel
Renders a dynamically generated `<smart-video-player>` element with updated attributes in real time.

---

## 🎛 Core Features

### 🎥 Video Configuration
- Set video source (`src`)
- Fit modes:
  - `Fit (Contain)`
  - `Crop (Cover)`
- Background color customization
- Controls color customization
- Exit URL configuration

---

### ▶ Autoplay Options
- None  
- On Load  
- On Viewport (Intersection-based autoplay)

---

### 📍 Control & Button Positioning

Preset alignment options:
- Top Left / Center / Right  
- Middle Left / Center / Right  
- Bottom Left / Center / Right  

Custom positioning support:
- X and Y pixel values  
- Injected as JSON-based position attributes  

Applies to:
- Play button  
- Mute button  
- Countdown timer  

---

### 📊 Progress & UI Controls

- Progress bar position (Top / Bottom)
- Control sizes:
  - Small  
  - Medium  
  - Large  
- Toggle visibility for:
  - Controls  
  - Play/Pause button  
  - Mute/Unmute button  
  - Progress bar  
  - Replay button  
  - Countdown timer  

---

### 🔁 Playback Behavior

Enable or disable:
- Auto pause when out of view  
- Muted mode  
- Preload  
- Loop  
- Tracking events  

---

## ⚡ Real-Time Updates

- All inputs trigger live updates  
- Player element is recreated dynamically  
- Boolean attributes handled conditionally  
- Custom position values injected only when needed  
- Tracking events logged via:
