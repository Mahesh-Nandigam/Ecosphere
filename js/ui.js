import { state } from './state.js';
import { PRESETS, COACH_RECS } from './constants.js';
import { supabaseClient, isSignUpMode, setSignUpMode, currentSession } from './db.js';
import { updateSVGIsland } from './animations.js';
import {
  dynamicRecommendation,
  logActivity,
  submitCustomLog,
  handleChatInput,
  resetToDefaults,
} from './main.js';

export function setupConnectionStatusUI() {
  const settingsBtn = document.getElementById('btn-open-config');
  if (supabaseClient) {
    settingsBtn.innerHTML = '🔌';
    settingsBtn.style.color = 'var(--color-primary)';
    settingsBtn.title = 'Connected to supabaseClient';
  } else {
    settingsBtn.innerHTML = '⚙️';
    settingsBtn.style.color = 'var(--color-text-secondary)';
    settingsBtn.title = 'Local-Only Sandbox Mode';
  }
}

// ==========================================================
// MODALS & AUTH POPUP HANDLERS
// ==========================================================
export function setupModalEventListeners() {
  const configModal = document.getElementById('config-modal');
  const authModal = document.getElementById('auth-modal');

  // Settings buttons
  document.getElementById('btn-open-config').addEventListener('click', () => {
    document.getElementById('input-sb-url').value = localStorage.getItem('ecosphere_sb_url') || '';
    document.getElementById('input-sb-key').value = localStorage.getItem('ecosphere_sb_key') || '';
    document.getElementById('input-gemini-key').value =
      localStorage.getItem('ecosphere_gemini_key') || '';
    configModal.style.display = 'flex';
  });

  document.getElementById('btn-close-config').addEventListener('click', () => {
    configModal.style.display = 'none';
  });

  // Save config setting
  document.getElementById('btn-save-config').addEventListener('click', async () => {
    const url = document.getElementById('input-sb-url').value.trim();
    const key = document.getElementById('input-sb-key').value.trim();
    const geminiKey = document.getElementById('input-gemini-key').value.trim();

    if (!url && !key && !geminiKey) {
      alert('Please enter settings to save.');
      return;
    }

    let warningMsg = '';
    let reloadNeeded = false;

    // Handle supabaseClient credentials
    if (url || key) {
      if (!url || !key) {
        alert('Please enter both supabaseClient URL and Anon Key to connect database.');
        return;
      }

      try {
        const testClient = window.supabase.createClient(url, key);
        const { error } = await testClient.from('carbon_activities').select('id').limit(1);

        if (error) {
          const isTableMissing =
            error.code === '42P01' || (error.message && error.message.includes('does not exist'));
          const isAuthError =
            error.status === 401 ||
            error.status === 403 ||
            (error.message && (error.message.includes('JWT') || error.message.includes('API key')));

          if (isAuthError) {
            throw new Error('Invalid supabaseClient URL or Anon Key (Unauthorized).');
          } else if (isTableMissing) {
            warningMsg =
              "\n\n⚠️ NOTE: The database tables do not exist yet. Please run 'supabaseClient_schema.sql' in your supabaseClient SQL Editor.";
          } else {
            throw error;
          }
        }

        localStorage.setItem('ecosphere_sb_url', url);
        localStorage.setItem('ecosphere_sb_key', key);
        reloadNeeded = true;
      } catch (err) {
        alert(
          'Failed to connect to supabaseClient: ' + (err.message || 'Please check credentials.')
        );
        return;
      }
    } else {
      // Disconnect DB if they cleared the fields
      if (localStorage.getItem('ecosphere_sb_url')) {
        localStorage.removeItem('ecosphere_sb_url');
        localStorage.removeItem('ecosphere_sb_key');
        reloadNeeded = true;
      }
    }

    // Handle Gemini Key
    if (geminiKey) {
      localStorage.setItem('ecosphere_gemini_key', geminiKey);
    } else {
      localStorage.removeItem('ecosphere_gemini_key');
    }

    configModal.style.display = 'none';
    alert('Settings saved successfully!' + warningMsg);
    if (reloadNeeded) {
      window.location.reload();
    }
  });

  document.getElementById('btn-disconnect-db').addEventListener('click', () => {
    if (confirm('Disconnect database client and AI keys, returning to local Sandbox mode?')) {
      localStorage.removeItem('ecosphere_sb_url');
      localStorage.removeItem('ecosphere_sb_key');
      localStorage.removeItem('ecosphere_gemini_key');
      configModal.style.display = 'none';
      window.location.reload();
    }
  });

  // Auth widget actions
  document.getElementById('btn-show-auth').addEventListener('click', () => {
    if (!supabaseClient) {
      alert('Please configure your supabaseClient Settings (⚙️ icon) first before signing in.');
      document.getElementById('btn-open-config').click();
      return;
    }
    setSignUpMode(false);
    renderAuthForm();
    authModal.style.display = 'flex';
  });

  document.getElementById('btn-close-auth').addEventListener('click', () => {
    authModal.style.display = 'none';
  });

  document.getElementById('tab-login').addEventListener('click', () => {
    setSignUpMode(false);
    renderAuthForm();
  });

  document.getElementById('tab-signup').addEventListener('click', () => {
    setSignUpMode(true);
    renderAuthForm();
  });

  // Submit sign in/up
  document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();
    const name = document.getElementById('auth-name').value.trim();
    const submitBtn = document.getElementById('btn-submit-auth');

    submitBtn.innerText = 'Processing...';
    submitBtn.disabled = true;

    try {
      if (isSignUpMode) {
        // Sign Up
        const { error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });
        if (error) throw error;
        alert(
          'Registration successful! If required, please confirm your email address or check your inbox.'
        );
      } else {
        // Sign In
        const { error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      authModal.style.display = 'none';
    } catch (err) {
      alert('Authentication Error: ' + err.message);
    } finally {
      submitBtn.innerText = isSignUpMode ? 'Create Account' : 'Sign In';
      submitBtn.disabled = false;
    }
  });

  document.getElementById('btn-sign-out').addEventListener('click', async () => {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
      window.location.reload();
    }
  });
}

export function renderAuthForm() {
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const nameGroup = document.getElementById('name-field-group');
  const submitBtn = document.getElementById('btn-submit-auth');

  if (isSignUpMode) {
    tabLogin.classList.remove('active');
    tabSignup.classList.add('active');
    nameGroup.style.display = 'block';
    submitBtn.innerText = 'Create Account';
  } else {
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    nameGroup.style.display = 'none';
    submitBtn.innerText = 'Sign In';
  }
}

// ==========================================================
// DOM SETUP & EVENT LISTENERS
// ==========================================================
export function setupEventListeners() {
  // Tab Switching for Presets
  const tabs = document.querySelectorAll('.category-tabs .tab-btn');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      state.currentCategory = tab.dataset.category;
      renderPresets();

      // Update form unit helper
      const unitLabel = document.getElementById('unit-label');
      if (state.currentCategory === 'transport') unitLabel.innerText = 'km';
      else if (state.currentCategory === 'food') unitLabel.innerText = 'meal';
      else if (state.currentCategory === 'energy') unitLabel.innerText = 'kWh';
      else unitLabel.innerText = 'count';
    });
  });

  // Submit custom log form
  document.getElementById('btn-submit-log').addEventListener('click', () => {
    submitCustomLog();
  });

  // Chat message sending
  document.getElementById('btn-send-chat').addEventListener('click', () => {
    handleChatInput();
  });
  document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleChatInput();
    }
  });

  // Clear timeline data
  document.getElementById('btn-clear-logs').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all EcoSphere local/offline data?')) {
      resetToDefaults();
    }
  });
}

// Render Engine
export function renderAll() {
  renderHeader();
  renderStatusBar();
  renderPresets();
  renderTimeline();
  renderLeaderboard();
  renderChallenges();
  renderCoachRecommendation();
  updateSVGIsland();
}

export function renderHeader() {
  document.getElementById('header-level').innerText = state.userProfile.level;
  document.getElementById('header-ecoscore').innerText = state.userProfile.ecoScore;
  document.getElementById('header-points').innerText = state.userProfile.points;
}

export function renderStatusBar() {
  document.getElementById('stats-target').innerText =
    `${state.userProfile.co2Target.toFixed(1)} kg`;
  document.getElementById('stats-current').innerText =
    `${state.userProfile.currentCo2.toFixed(1)} kg`;

  // Progress ratio
  const percentage = Math.min(
    100,
    Math.max(5, (state.userProfile.currentCo2 / state.userProfile.co2Target) * 100)
  );
  const fill = document.getElementById('stats-progress-fill');
  fill.style.width = `${percentage}%`;

  if (state.userProfile.currentCo2 > state.userProfile.co2Target) {
    fill.style.background = 'linear-gradient(90deg, #FD976D, #EF5350)'; // Reddish alert
  } else {
    fill.style.background = 'linear-gradient(90deg, #5DCDF1, #8CD68A)'; // Cyan to soft green
  }
}

export function renderPresets() {
  const container = document.getElementById('presets-container');
  container.innerHTML = '';

  const activePresets = PRESETS[state.currentCategory] || [];
  activePresets.forEach((preset) => {
    const card = document.createElement('div');
    card.className = 'preset-card';

    // Quick log function on click
    card.addEventListener('click', () => {
      logActivity(
        preset.title,
        preset.val,
        preset.unit,
        preset.co2Avoided,
        preset.co2Produced,
        preset.points
      );
    });

    card.innerHTML = `
      <div class="preset-title">${preset.title}</div>
      <div class="preset-val">${preset.val} ${preset.unit}</div>
      <div class="preset-savings">🌿 -${preset.co2Avoided}kg CO₂</div>
    `;
    container.appendChild(card);
  });
}

export function renderTimeline() {
  const tbody = document.getElementById('timeline-body');
  const emptyMsg = document.getElementById('empty-logs-msg');
  tbody.innerHTML = '';

  if (state.activityLogs.length === 0) {
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';

  const fragment = document.createDocumentFragment();

  state.activityLogs.forEach((log) => {
    const date = new Date(log.timestamp);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${timeStr}</td>
      <td><span class="timeline-category-tag tag-${window.DOMPurify.sanitize(log.category)}">${window.DOMPurify.sanitize(log.category)}</span></td>
      <td><strong>${window.DOMPurify.sanitize(log.activity)}</strong></td>
      <td>${window.DOMPurify.sanitize(String(log.value))} ${window.DOMPurify.sanitize(log.unit || 'units')}</td>
      <td class="val-avoided">-${log.co2Avoided.toFixed(2)} kg</td>
      <td class="val-produced">${log.co2Produced > 0 ? '+' + log.co2Produced.toFixed(2) + ' kg' : '0.0 kg'}</td>
      <td class="reward-points">+${log.pointsEarned} pts</td>
      <td><button class="btn-danger-link" onclick="window.deleteLog('${window.DOMPurify.sanitize(log.id)}')">Delete</button></td>
    `;
    fragment.appendChild(tr);
  });

  tbody.appendChild(fragment);
}

export function renderLeaderboard() {
  const container = document.getElementById('leaderboard-container');
  container.innerHTML = '';

  // Inject user profile dynamically into leaderboard lists
  const currentLeaderboard = [...state.leaderboard];
  const userIdx = currentLeaderboard.findIndex(
    (m) =>
      m.name.includes('(You)') ||
      (currentSession &&
        m.name === (currentSession.user.user_metadata?.name || currentSession.user.email))
  );

  const totalAvoided = state.activityLogs.reduce((sum, log) => sum + log.co2Avoided, 0);

  if (userIdx > -1) {
    currentLeaderboard[userIdx].ecoScore = state.userProfile.ecoScore;
    currentLeaderboard[userIdx].co2AvoidedTotal = totalAvoided + 12.8;
  } else {
    // Append user profile to leaderboard if not found
    currentLeaderboard.push({
      rank: currentLeaderboard.length + 1,
      name: currentSession
        ? currentSession.user.user_metadata?.name || currentSession.user.email.split('@')[0]
        : 'Jane Doe (You)',
      avatar: '🌎',
      ecoScore: state.userProfile.ecoScore,
      co2AvoidedTotal: totalAvoided + 12.8,
    });
  }

  // Sort and re-rank
  currentLeaderboard.sort((a, b) => b.ecoScore - a.ecoScore);

  const fragment = document.createDocumentFragment();

  currentLeaderboard.forEach((member, index) => {
    member.rank = index + 1;
    const item = document.createElement('div');
    item.className = 'leaderboard-item';

    item.innerHTML = `
      <span class="leaderboard-rank">#${member.rank}</span>
      <span class="leaderboard-avatar">${window.DOMPurify.sanitize(member.avatar)}</span>
      <div class="leaderboard-info">
        <span class="leaderboard-name">${window.DOMPurify.sanitize(member.name)}</span>
        <span class="leaderboard-stats">Avoided: ${member.co2AvoidedTotal.toFixed(1)} kg CO₂</span>
      </div>
      <span class="leaderboard-score-badge">${member.ecoScore}</span>
    `;
    fragment.appendChild(item);
  });

  container.appendChild(fragment);
}

export function renderChallenges() {
  const container = document.getElementById('challenges-container');
  container.innerHTML = '';
  const fragment = document.createDocumentFragment();

  state.challenges.forEach((ch) => {
    const item = document.createElement('div');
    item.className = 'challenge-item';

    let actionBtnText = 'Start Challenge';
    let actionBtnClass = 'status-badge available';
    if (ch.status === 'active') {
      actionBtnText = 'Complete Action (+20%)';
      actionBtnClass = 'status-badge active';
    } else if (ch.status === 'completed') {
      actionBtnText = 'Completed! 🏆';
      actionBtnClass = 'status-badge completed';
    }

    item.innerHTML = `
      <div class="challenge-top">
        <div>
          <span class="badge difficulty-${window.DOMPurify.sanitize(ch.difficulty)}">${window.DOMPurify.sanitize(ch.difficulty)}</span>
          <span class="badge reward-points">+${window.DOMPurify.sanitize(String(ch.pointsReward))} pts</span>
        </div>
        <span class="${actionBtnClass}" onclick="window.triggerChallengeAction('${window.DOMPurify.sanitize(ch.id)}')">${actionBtnText}</span>
      </div>
      <div class="challenge-title">${window.DOMPurify.sanitize(ch.title)}</div>
      <div class="challenge-desc">${window.DOMPurify.sanitize(ch.description)}</div>
      <div class="challenge-progress-bar">
        <div class="challenge-progress-fill" style="width: ${window.DOMPurify.sanitize(String(ch.progress))}%;"></div>
      </div>
      <div class="challenge-bottom">
        <span class="card-subtitle">Savings Est: ${window.DOMPurify.sanitize(String(ch.co2SavingsEst))}kg CO₂</span>
        <span class="card-subtitle">${window.DOMPurify.sanitize(String(ch.progress))}% completed</span>
      </div>
    `;
    fragment.appendChild(item);
  });

  container.appendChild(fragment);
}

export function renderCoachRecommendation() {
  const rec = dynamicRecommendation || COACH_RECS[state.activeRecIndex];
  if (!rec) return;

  document.getElementById('rec-title').innerText = rec.title;
  document.getElementById('rec-desc').innerText = rec.description;

  const points = rec.points_reward || rec.pointsReward || 40;
  const diff = rec.difficulty || 'easy';

  const labelsContainer = document.querySelector('.coach-recommendation-box .rec-meta');
  labelsContainer.innerHTML = `
    <span class="badge difficulty-${window.DOMPurify.sanitize(diff)}">${window.DOMPurify.sanitize(diff)}</span>
    <span class="badge reward-points">+${window.DOMPurify.sanitize(String(points))} pts</span>
    <button class="btn btn-small btn-primary" id="btn-apply-rec" onclick="window.applyActiveRecommendation()">Do This</button>
  `;
}

// ==========================================================
// SVG ISLAND CONTROL GRAPHICS
// ==========================================================

// ==========================================================
// DATA MUTATION CONTROLLERS
// ==========================================================

export function showToast(message, type = 'success') {
  const existing = document.getElementById('ecosphere-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'ecosphere-toast';
  toast.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: ${type === 'success' ? 'linear-gradient(135deg, #2E7D32, #4CAF50)' : 'linear-gradient(135deg, #c62828, #EF5350)'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 500;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    z-index: 9999;
    opacity: 0;
    transform: translateY(-20px);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    max-width: 300px;
  `;
  toast.innerText = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}
