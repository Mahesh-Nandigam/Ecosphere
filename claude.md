# Project Constitution: EcoSphere B.L.A.S.T. System

## System Core Identity
**EcoSphere** is a premium, behavior-shifting carbon awareness web platform designed to help users move through the habit formation loop: *Unaware → Aware → Action → Habit Formation*. It replaces typical, boring utility carbon calculators with a gorgeous, living digital ecosystem and an empathetic coaching companion.

## Visual Design Invariants (Brand Guidelines)
1. **Core Color Palette (Light Theme):**
   - **Primary Accent:** `#5DCDF1` (Sky blue / Cyan)
   - **Secondary Accent:** `#FD976D` (Salmon orange)
   - **Dashboard Background:** `#FFFFFF` (Premium white workspace)
   - **Text Base:** `#1B1624` (Deep violet-black for high readability)
   - **Highlight/Link Accent:** `#FDD46B` (Warm gold)
2. **Typography System:**
   - **Heading Font:** `Recoleta` (for h1, h2 headers to give a premium, editorial editorial aesthetic)
   - **Body Font:** `Elza` (or clean geometric sans-serif fallbacks like `Inter`, `system-ui`)
3. **Layout & Spacing Invariants:**
   - **Base Spacing Unit:** 4px grid (margins, paddings must align to multiples of 4px)
   - **Border Radius:** 18px (all cards, buttons, dashboard grids must use `18px` rounding)
   - **Vibe:** Clean, modern, light theme with premium card layouts, soft drop shadows, and minimalist borders.

## Behavioral & Motivational Design Rules
1. **Empathy & Motivating Tone:**
   - **No Shaming:** The interface and AI Coach must never use critical, warning, or shaming vocabulary for high emissions.
   - **Relatable Equivalencies:** Abstract carbon values (e.g. 1.8 kg CO2e) must be paired with real-world analogies (e.g. smartphone charges, LED light bulb hours, tree absorption days) to be instantly understandable.
   - **Gradual Action Nudges:** Instead of suggesting drastic changes, recommend micro-habits (e.g., turning off standby, setting thermostat to 24°C).
2. **Dynamic Feedback Loop:**
   - **Instant Visual Reward:** Avoided carbon is immediately translated into growth indicators on a central visual SVG island (lush leaves, clean blue sky, active wind turbines).
   - **Constructive Alternative Options:** If carbon footprint increases, explain why in a friendly tone and offer 2 practical alternatives.

## Architectural Invariants
1. **Separation of Concerns (A.N.T. Three-Layer):**
   - **Layer 1 (Architecture):** SOP guidelines in `architecture/` governing emission logic.
   - **Layer 2 (Navigation/Reasoning):** Client-side state loops routing user logs to the dashboard.
   - **Layer 3 (Tools):** Custom React custom components and helper utilities.
2. **Data-First Execution:**
   - The JSON data schema defined in `gemini.md` is the immutable source of truth. No components or states are coded without matching schema mappings.
3. **Local Sovereignty (MVP):**
   - The primary database lives in client-side memory backed up by browser `LocalStorage`. External databases (Firebase) are treated as late-phase integrations.
