import { state } from './state.js';

/**
 * Updates the SVG visualization (Eco-Island) based on the user's current EcoScore.
 * Alters colors, visibility of elements, and gradient definitions.
 */

// Dynamic Rain System
function updateRain(stage) {
  let rainGroup = document.getElementById('rain-group');
  if (!rainGroup) {
    rainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    rainGroup.id = 'rain-group';
    document.getElementById('features-group').appendChild(rainGroup);
  }

  if (stage <= 2) {
    rainGroup.style.opacity = stage === 1 ? '1' : '0.5';
    if (rainGroup.children.length === 0) {
      for (let i = 0; i < 40; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const x = Math.random() * 800;
        const y = Math.random() * -500;
        const length = 15 + Math.random() * 15;
        line.setAttribute('x1', x);
        line.setAttribute('y1', y);
        line.setAttribute('x2', x - 10);
        line.setAttribute('y2', y + length);
        line.setAttribute('stroke', stage === 1 ? '#78909C' : '#90A4AE');
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('opacity', 0.4 + Math.random() * 0.4);
        line.style.animation = `rainFall ${0.5 + Math.random() * 0.5}s linear infinite ${Math.random()}s`;
        rainGroup.appendChild(line);
      }
    }
  } else {
    rainGroup.style.opacity = '0';
    rainGroup.innerHTML = '';
  }
}

export function updateSVGIsland() {
  const score = state.userProfile.ecoScore || 50;

  // ── Stage System (1=Wasteland … 5=Paradise) ──────────────
  const stage = score >= 85 ? 5 : score >= 68 ? 4 : score >= 48 ? 3 : score >= 28 ? 2 : 1;

  // helpers
  const show = (id, on, opacity = 1) => {
    const el = document.getElementById(id);
    if (el) el.style.opacity = on ? String(opacity) : '0';
  };
  const setFill = (id, url) => {
    const el = document.getElementById(id);
    if (el) el.setAttribute('fill', url);
  };

  // ── SKY ──────────────────────────────────────────────────
  const skyGrads = [
    'sky-gradient-polluted',
    'sky-gradient-recovering',
    'sky-gradient-growing',
    'sky-gradient-healthy',
    'sky-gradient-paradise',
  ];
  setFill('sky-bg', `url(#${skyGrads[stage - 1]})`);

  // ── GROUND ────────────────────────────────────────────────
  const grndGrads = [
    'ground-gradient-dry',
    'ground-gradient-recovering',
    'ground-gradient-growing',
    'ground-gradient-healthy',
    'ground-gradient-paradise',
  ];
  setFill('island-top', `url(#${grndGrads[stage - 1]})`);

  // ── STARS (stages 1–2) ───────────────────────────────────
  show('stars-group', stage <= 2, stage === 1 ? 1 : 0.5);

  // ── POLLUTION SMOG ────────────────────────────────────────
  show('smog-group', stage === 1, 1);
  const smog = document.getElementById('smog-group');
  if (smog) smog.style.opacity = stage === 1 ? '1' : stage === 2 ? '0.4' : '0';

  // ── SUN ───────────────────────────────────────────────────
  const sun = document.getElementById('sun');
  const sunGlow = document.getElementById('sun-glow');
  const sunRays = document.getElementById('sun-rays');
  if (sun) sun.setAttribute('fill', stage <= 1 ? '#CFD8DC' : stage === 2 ? '#FFCC80' : '#FDD46B');
  if (sunGlow) sunGlow.style.opacity = stage <= 1 ? '0.2' : stage === 2 ? '0.5' : '1';
  if (sunRays) sunRays.style.opacity = stage >= 3 ? '0.6' : '0';

  // ── RAINBOW (paradise only) ───────────────────────────────
  show('rainbow-group', stage === 5, 1);

  // ── CLOUDS color ─────────────────────────────────────────
  const cloudGroup = document.getElementById('cloud-group');
  if (cloudGroup) {
    cloudGroup.querySelectorAll('path').forEach((p) => {
      p.setAttribute('fill', stage <= 2 ? '#B0BEC5' : '#FFFFFF');
    });
  }

  // ── BIRDS ────────────────────────────────────────────────
  const birds = document.getElementById('birds-group');
  if (birds) birds.style.opacity = stage >= 3 ? (stage >= 4 ? '1' : '0.65') : '0';

  // ── BUTTERFLIES (stage 4+) ───────────────────────────────
  show('butterflies-group', stage >= 4, 1);

  // ── TURBINE speed ─────────────────────────────────────────
  const blade = document.getElementById('turbine-blades');
  if (blade) blade.style.animationDuration = ['28s', '16s', '9s', '4s', '2s'][stage - 1];

  // ── TREES ─────────────────────────────────────────────────
  const treeThresholds = [0, 0, 28, 48, 65, 85]; // tree1..6 min score
  [1, 2, 3, 4, 5, 6].forEach((n, i) => {
    const el = document.getElementById(`tree-${n}`);
    if (!el) return;
    const visible = score >= treeThresholds[i + 1];
    el.style.opacity = visible ? '1' : '0';
    el.style.transform = visible ? 'scale(1)' : 'scale(0.3)';
  });

  // ── FLOWERS ───────────────────────────────────────────────
  const flowers = document.getElementById('flowers');
  if (flowers) flowers.style.opacity = stage >= 3 ? '1' : stage === 2 ? '0.4' : '0.1';
  show('flowers-extra', stage >= 4, 1);

  // ── SOLAR PANEL 2 ─────────────────────────────────────────
  show('solar-panel-2', score >= 75, 1);

  // ── RABBIT ────────────────────────────────────────────────
  show('rabbit-group', score >= 80, 1);

  // ── CHIMNEY SMOKE (bad eco) ───────────────────────────────
  const cSmoke = document.getElementById('chimney-smoke');
  if (cSmoke) cSmoke.style.opacity = stage <= 2 ? '1' : '0';

  // ── SAGE CHARACTER ────────────────────────────────────────
  updateSageCharacter(stage);
  updateRain(stage);

  // ── SAGE COACH AVATAR in chat UI ──────────────────────────
  const avatar = document.querySelector('.coach-avatar');
  if (avatar) {
    const avatars = ['😰', '🌱', '😊', '🌟', '🎉'];
    avatar.textContent = avatars[stage - 1];
  }

  updateCarbonAnalogy();
}

export function updateSageCharacter(stage) {
  const mouth = document.getElementById('sage-mouth');
  const sparkles = document.getElementById('sage-sparkles');
  const sageEl = document.getElementById('sage-character');
  if (!mouth || !sageEl) return;

  // Mouth shape per stage (SVG quadratic bezier)
  const mouths = [
    'M-5,-4 Q0,-8 5,-4', // 1: sad frown
    'M-4,-6 Q0,-5 4,-6', // 2: neutral
    'M-5,-6 Q0,-3 5,-6', // 3: slight smile
    'M-6,-7 Q0,-2 6,-7', // 4: big smile
    'M-6,-8 Q0,0 6,-8', // 5: huge grin
  ];
  mouth.setAttribute('d', mouths[stage - 1]);

  // Bob speed per stage
  const durations = ['5s', '4s', '3s', '2.5s', '2s'];
  sageEl.style.animationDuration = durations[stage - 1];

  // Sparkles only in paradise
  if (sparkles) sparkles.style.opacity = stage === 5 ? '1' : '0';
}

export function triggerActivityParticles() {
  const ids = ['ap1', 'ap2', 'ap3', 'ap4', 'ap5', 'ap6'];
  const anims = [
    'particleBurstUp',
    'particleBurstRight',
    'particleBurstLeft',
    'particleBurstUpR',
    'particleBurstUpL',
    'particleBurstDiag',
  ];
  ids.forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.animation = 'none';
    el.style.opacity = '1';
    el.offsetHeight; // reflow
    el.style.animation = `${anims[i]} 1.4s ease-out ${i * 0.05}s forwards`;
  });
  // reset after animation completes
  setTimeout(() => {
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.style.animation = 'none';
        el.style.opacity = '0';
      }
    });
  }, 2200);
}

export function updateCarbonAnalogy() {
  const totalAvoided = state.activityLogs.reduce((sum, log) => sum + log.co2Avoided, 0);
  const textEl = document.getElementById('analogy-text');

  if (totalAvoided === 0) {
    textEl.innerHTML = 'Log an activity below to calculate your daily CO₂ savings analogies!';
    return;
  }

  const charges = Math.round(totalAvoided * 121);
  const treeDays = Math.round(totalAvoided * 15);

  if (totalAvoided < 5) {
    textEl.innerHTML = `Cumulative savings: <strong>${totalAvoided.toFixed(1)} kg CO₂</strong>. That equals fully charging <strong>${charges}</strong> smartphones! 📱`;
  } else {
    textEl.innerHTML = `Cumulative savings: <strong>${totalAvoided.toFixed(1)} kg CO₂</strong>. That's equivalent to <strong>${treeDays} days</strong> of CO₂ absorption by a mature tree! 🌳`;
  }
}

// Add interactive click events to the terrarium
export function setupSVGInteractions() {
  const birds = document.getElementById('birds-group');
  if (birds) {
    birds.style.cursor = 'pointer';
    birds.setAttribute('tabindex', '0');
    birds.setAttribute('role', 'button');
    birds.setAttribute('aria-label', 'Pet the birds');
    const triggerBirds = () => {
      birds.style.transform = 'translateY(-20px) scale(1.1)';
      setTimeout(() => {
        birds.style.transform = '';
      }, 300);
      import('./ui.js').then((module) =>
        module.showToast('Birds are chirping happily!', 'success')
      );
    };
    birds.addEventListener('click', triggerBirds);
    birds.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerBirds();
      }
    });
  }

  const rabbit = document.getElementById('rabbit-group');
  if (rabbit) {
    rabbit.style.cursor = 'pointer';
    rabbit.setAttribute('tabindex', '0');
    rabbit.setAttribute('role', 'button');
    rabbit.setAttribute('aria-label', 'Pet the rabbit');
    rabbit.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    const triggerRabbit = () => {
      rabbit.style.transform = 'translate(338px, 344px) scale(1.2)'; // Hop up
      setTimeout(() => {
        rabbit.style.transform = 'translate(338px, 364px)';
      }, 200);
      import('./ui.js').then((module) => module.showToast('You pet the rabbit!', 'success'));
    };
    rabbit.addEventListener('click', triggerRabbit);
    rabbit.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerRabbit();
      }
    });
  }

  const turbine = document.getElementById('turbine-group');
  if (turbine) {
    turbine.style.cursor = 'pointer';
    turbine.setAttribute('tabindex', '0');
    turbine.setAttribute('role', 'button');
    turbine.setAttribute('aria-label', 'Boost wind turbine');
    const triggerTurbine = () => {
      const blades = document.getElementById('turbine-blades');
      if (blades) {
        const oldDur = blades.style.animationDuration;
        blades.style.animationDuration = '1s';
        import('./ui.js').then((module) => module.showToast('Wind turbine boosted!', 'success'));
        setTimeout(() => {
          blades.style.animationDuration = oldDur;
        }, 4000);
      }
    };
    turbine.addEventListener('click', triggerTurbine);
    turbine.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerTurbine();
      }
    });
  }
}
