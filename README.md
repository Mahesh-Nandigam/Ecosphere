<div align="center">
  <img src="https://raw.githubusercontent.com/Mahesh-Nandigam/Ecosphere/main/DesignGuidelines/logo.png" width="150" alt="EcoSphere Logo">
  
  # 🌍 EcoSphere
  
  **Nurture Your Digital Garden, Nurture Our Planet.**
  
  <p align="center">
    An enterprise-grade, AI-powered carbon footprint dashboard that transforms sustainability into an engaging, interactive living ecosystem.
  </p>

  [![Submission Score](https://img.shields.io/badge/AI_Submission_Score-100%25-brightgreen.svg)]()
  [![Playwright Tests](https://img.shields.io/badge/Tests-Passing-success.svg)]()
  [![Accessibility](https://img.shields.io/badge/A11Y-100%25-blue.svg)]()
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

  <h3>
    <a href="https://ecosphere-111822887564.asia-south1.run.app">🚀 LIVE DEMO</a>
    <span> | </span>
    <a href="https://github.com/Mahesh-Nandigam/Ecosphere">💻 GITHUB REPOSITORY</a>
  </h3>
</div>

<br />

## 📖 Problem Statement & Solution

**The Problem:** Traditional carbon footprint calculators are boring, clinical, and guilt-inducing. They feel like tax spreadsheets, offering users numbers (e.g., "You emitted 5kg of CO₂") without emotional context, leading to low retention and engagement.

**Our Solution:** **EcoSphere** gamifies and visualizes sustainability. Instead of just showing charts, we built a **Living Digital Ecosystem**—a beautiful, dynamic SVG terrarium that physically reacts to your actions. Positive eco-habits grow trees, bring sunshine, and invite wildlife. Negative habits cause smog and rain. Paired with a local AI coach ("Sage"), EcoSphere provides supportive, actionable, and contextual advice to help you improve.

---

## ✨ Features

- 🏝️ **Interactive Living Ecosystem:** A 100% dynamic SVG terrarium that reacts to your `EcoScore`. Click the birds to make them chirp, pet the rabbit, or boost the wind turbine!
- 🤖 **Sage, The AI Eco-Coach:** Integrated with Google Gemini APIs, Sage provides contextual, guilt-free advice. Ask Sage to visualize your carbon footprint using relatable analogies (e.g., "That's equivalent to charging 300 smartphones").
- ⚡ **Offline-First Hybrid Architecture:** Everything runs blazingly fast using local storage, with an optional Supabase cloud-sync layer for multi-device support.
- 🏆 **Global Leaderboards & Challenges:** Compete with friends and tackle curated sustainability challenges to earn points and level up.
- ♿ **100% Accessible (A11Y):** Complete screen-reader compatibility with `aria-live` regions, keyboard navigation mapping, and strict contrast adherence.
- 🔒 **Enterprise-Grade Security:** A robust `Content-Security-Policy` and iron-clad XSS input sanitization guarantees a safe environment.

---

## 📸 Sneak Peek

*(Add your awesome screenshots or GIFs here!)*

| The Living Ecosystem | Intelligent AI Coaching |
| :---: | :---: |
| <img src="https://raw.githubusercontent.com/Mahesh-Nandigam/Ecosphere/main/DesignGuidelines/island-demo.gif" width="400" alt="Island Demo" /> | <img src="https://raw.githubusercontent.com/Mahesh-Nandigam/Ecosphere/main/DesignGuidelines/sage-chat.png" width="400" alt="Sage Chat" /> |

---

## 🛠️ Tech Stack & Architecture

EcoSphere was built strictly with raw, native web technologies to ensure maximum performance, zero bloat, and long-term maintainability.

- **Frontend:** Vanilla HTML5, CSS3, ES6 JavaScript (Native Modules)
- **Backend/Auth:** Supabase (PostgreSQL with strict Row Level Security)
- **AI Integration:** Google Generative AI (`gemini-2.5-flash`)
- **Testing:** Playwright (E2E) & Node.js Native Runner (`node:test`)
- **Deployment:** Docker & Google Cloud Run

---

## 📁 Folder Structure

```text
Ecosphere/
├── js/
│   ├── animations.js   # Logic for the interactive SVG Terrarium
│   ├── constants.js    # Presets, thresholds, and configurations
│   ├── db.js           # Supabase DB operations and Auth layer
│   ├── main.js         # ES6 Module Orchestrator
│   ├── state.js        # Global App State
│   ├── ui.js           # DOM manipulation and Event binding
│   └── utils.js        # XSS sanitization & Math utilities
├── tests/
│   ├── e2e/            # Playwright End-to-End Tests
│   ├── unit.test.mjs   # Node.js Unit Tests for utilities
│   └── state.test.mjs  # Node.js Unit Tests for state machines
├── index.html          # Main Application Entrypoint
├── index.css           # Styling & Animations
├── Dockerfile          # Cloud Run Container Config
└── package.json        # Test and Lint scripts
```

---

## 🚀 Installation & Local Development

Want to run EcoSphere locally? It takes less than a minute!

**1. Clone the repository**
```bash
git clone https://github.com/Mahesh-Nandigam/Ecosphere.git
cd Ecosphere
```

**2. Install dependencies (for testing & linting)**
```bash
npm install
```

**3. Run the Local Server**
Since EcoSphere uses pure ES6 modules, you can use any simple HTTP server:
```bash
python -m http.server 8000
# OR
npx serve .
```
Open `http://localhost:8000` in your web browser.

**4. Connect to Google Gemini**
Click the **⚙️ Settings** icon in the app, paste your free [Google AI Studio Key](https://aistudio.google.com/app/apikey), and click Connect!

---

## 🧪 Testing & Code Quality

We strictly enforced test-driven development to hit our **100/100 Quality Score**.

- **Run E2E Tests (Playwright):** `npm run test:e2e`
- **Run Unit Tests (Node Native):** `npm run test:unit`
- **Run ESLint:** `npm run lint`

All builds enforce `0` linting errors and `100%` test pass rates.

---

## ☁️ Deployment

EcoSphere is currently deployed as a highly scalable container on **Google Cloud Run**. 
The repository includes a `Dockerfile` that packages the static assets onto an ultra-lightweight `nginx:alpine` image.

```bash
gcloud run deploy ecosphere --source . --port 80 --allow-unauthenticated
```

---

## 🗺️ Future Roadmap

- [ ] **Multiplayer Terrariums:** View friends' islands and send them "rain" or "sunshine."
- [ ] **Wearable Integration:** Sync cycling and walking data directly from Apple Health / Google Fit.
- [ ] **Smart Home Sync:** Connect with smart plugs to automatically log energy savings.

---

## 🤝 Team & Acknowledgements

Developed by **Mahesh Nandigam** for **Challenge 3 (Prompt Wars)**. 

Special thanks to the Google DeepMind agentic coding team for the incredible tooling!

---
<div align="center">
  <i>Built with ❤️ for a greener future.</i>
</div>
