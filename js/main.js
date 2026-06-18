export let dynamicRecommendation = null;
('use strict');

// EcoSphere Core Engine with supabaseClient Cloud & Local Storage Hybrid Persistence

import { escapeHTML } from './utils.js';
import { COACH_RECS } from './constants.js';

import { state } from './state.js';

// supabaseClient Global Client Reference
import { supabaseClient, PersistenceManager, setCurrentSession, initSupabaseClient } from './db.js';

// ==========================================================
// APPLICATION INITIALIZATION
// ==========================================================
async function initApp() {
  initSupabaseClient();
  setupConnectionStatusUI();
  setupModalEventListeners();

  // Set up active Auth state changes
  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      setCurrentSession(session);
      console.log('supabaseClient Auth State Change:', event, session);

      if (session) {
        // Logged in
        document.getElementById('btn-show-auth').style.display = 'none';
        const loggedBadge = document.getElementById('user-logged-badge');
        loggedBadge.style.display = 'flex';

        const nameText = session.user.user_metadata?.name || session.user.email;
        document.getElementById('auth-user-name').innerText = nameText;

        // Trigger auto-migration if logs exist in local storage
        if (localStorage.getItem('ecosphere_activityLogs')) {
          await PersistenceManager.migrateLocalDataTosupabaseClient(session.user.id);
        }
      } else {
        // Logged out
        document.getElementById('btn-show-auth').style.display = 'block';
        document.getElementById('user-logged-badge').style.display = 'none';
      }

      // Reload states & refresh GUI
      await reloadAppState();
    });
  } else {
    // Local only mode
    await reloadAppState();
  }

  setupEventListeners();

  // Add coach greeting if first time or empty chat
  const chatMessages = document.getElementById('coach-messages');
  if (chatMessages.children.length === 0) {
    addCoachMessage(
      "Hi, I'm Sage, your AI Eco-Coach! 🌿 Let's nurture your island together. Log actions, complete challenges, or ask me for eco tips!"
    );
  }
}

// Reload state vectors
async function reloadAppState() {
  state.userProfile = await PersistenceManager.loadUserProfile();
  state.activityLogs = await PersistenceManager.loadActivityLogs();
  state.challenges = await PersistenceManager.loadChallenges();
  state.leaderboard = await PersistenceManager.loadLeaderboard();

  renderAll();
}

import {
  setupConnectionStatusUI,
  setupModalEventListeners,
  setupEventListeners,
  renderAll,
  showToast,
  renderCoachRecommendation,
} from './ui.js';

import { triggerActivityParticles } from './animations.js';

export function resetToDefaults() {
  localStorage.removeItem('ecosphere_userProfile');
  localStorage.removeItem('ecosphere_activityLogs');
  localStorage.removeItem('ecosphere_challenges');
  localStorage.removeItem('ecosphere_leaderboard');

  state.currentCategory = 'transport';
  state.activeRecIndex = 0;

  document.getElementById('coach-messages').innerHTML = '';

  reloadAppState().then(() => {
    addCoachMessage(
      "I've reset your local workspace environment. Let's start fresh with a clean island! 🏝️"
    );
  });
}

// ==========================================================
// SAGE COACH DIALOGUE ENGINE
// ==========================================================
function addCoachMessage(text) {
  const chatMessages = document.getElementById('coach-messages');
  const msgEl = document.createElement('div');
  msgEl.className = 'chat-msg coach';

  let sanitizedText = escapeHTML(text);
  let formattedText = sanitizedText
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');

  msgEl.innerHTML = formattedText;
  chatMessages.appendChild(msgEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addUserMessage(text) {
  const chatMessages = document.getElementById('coach-messages');
  const msgEl = document.createElement('div');
  msgEl.className = 'chat-msg user';
  msgEl.innerText = text;
  chatMessages.appendChild(msgEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

export function handleChatInput() {
  const inputEl = document.getElementById('chat-input');
  const query = inputEl.value.trim();
  if (!query) return;

  addUserMessage(query);
  inputEl.value = '';

  setTimeout(() => {
    generateCoachResponse(query);
  }, 600);
}

/**
 * Generates an AI coach response using the Gemini API based on the user's query and current eco-state.
 * Includes fallback to a local mock response if the API call fails or is not configured.
 * @param {string} query - The user's input message to the AI coach.
 * @returns {Promise<void>} Resolves when the AI response has been rendered in the UI.
 */
async function generateCoachResponse(query) {
  const q = query.toLowerCase();
  const geminiApiKey = localStorage.getItem('ecosphere_gemini_key');

  if (geminiApiKey) {
    // Show a typing indicator message
    const chatMessages = document.getElementById('coach-messages');
    const typingMsg = document.createElement('div');
    typingMsg.className = 'chat-msg coach typing-indicator-msg';
    typingMsg.innerHTML = '<em>Sage is thinking... 🌿</em>';
    chatMessages.appendChild(typingMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      // Calculate carbon breakdown percentages
      const stats = state.userProfile.stats || { transport: 0, food: 0, energy: 0, lifestyle: 0 };
      const total = stats.transport + stats.food + stats.energy + stats.lifestyle || 1;
      const breakdown = {
        transport: Math.round((stats.transport / total) * 100),
        food: Math.round((stats.food / total) * 100),
        energy: Math.round((stats.energy / total) * 100),
        lifestyle: Math.round((stats.lifestyle / total) * 100),
      };

      // Identify top category
      let topCategory = 'transport';
      let maxVal = -1;
      for (const [cat, val] of Object.entries(breakdown)) {
        if (val > maxVal) {
          maxVal = val;
          topCategory = cat;
        }
      }

      // Filter active challenges
      const activeChallenges =
        state.challenges
          .filter((c) => c.status === 'active')
          .map((c) => `${c.title} (${c.progress}% completed)`)
          .join(', ') || 'None';

      const prompt = `You are Sage, a supportive, empathetic, non-shaming AI Eco-Coach for the EcoSphere carbon awareness app.
User Profile context:
- Level: ${state.userProfile.level || 2}
- Leaf Points: ${state.userProfile.points || 320}
- EcoScore: ${state.userProfile.ecoScore || 82}/100
- Daily CO2: ${state.userProfile.currentCo2 || 12.8} kg (Target: ${state.userProfile.co2Target || 14.5} kg)
- Carbon Breakdown: Transport ${breakdown.transport}%, Food ${breakdown.food}%, Energy ${breakdown.energy}%, Lifestyle ${breakdown.lifestyle}%
- Top Emission Source: ${topCategory}
- Active Challenges: ${activeChallenges}
- User Archetype: Young Professional / Commuter

The user says: "${query}"

Instructions:
1. Write a friendly, encouraging reply in 2-3 sentences.
2. Incorporate real-world analogies (e.g. 1 kg CO2 = 121 smartphone charges or 15 days of tree absorption) if they ask about quantities.
3. Suggest small, gradual sustainable habits without shaming them.
4. You MUST return your response as a JSON object matching this schema:
{
  "message": "your conversation response text",
  "recommendation": {
    "category": "transport | food | energy | lifestyle",
    "title": "Short title for next step",
    "description": "Short explanation of the action and its carbon offset impact.",
    "co2_savings": 0.5,
    "difficulty": "easy | medium | hard",
    "points_reward": 40
  }
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      // Remove typing indicator
      typingMsg.remove();

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `status ${response.status}`;
        try {
          const errObj = JSON.parse(errorText);
          if (errObj.error && errObj.error.message) {
            errorMsg += ' - ' + errObj.error.message;
          }
        } catch (e) {
          errorMsg += ' - ' + errorText.substring(0, 50);
        }
        throw new Error(`Gemini API returned ${errorMsg}`);
      }

      const responseData = await response.json();
      let aiText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (aiText) {
        let cleanText = aiText.trim();

        // Attempt to extract JSON if wrapped in markdown
        if (cleanText.includes('```')) {
          const lines = cleanText.split('\n');
          const jsonLines = [];
          let inJson = false;
          for (const line of lines) {
            if (line.trim().startsWith('```')) {
              inJson = !inJson;
              continue;
            }
            if (inJson || lines.length === 1) {
              jsonLines.push(line);
            }
          }
          if (jsonLines.length > 0) {
            cleanText = jsonLines.join('\n').trim();
          }
        }

        cleanText = cleanText
          .replace(/^```json\s*/i, '')
          .replace(/```$/, '')
          .trim();

        try {
          const aiData = JSON.parse(cleanText);
          if (aiData && aiData.message) {
            addCoachMessage(aiData.message);
            if (aiData.recommendation) {
              dynamicRecommendation = aiData.recommendation;
              renderCoachRecommendation();
            }
          } else {
            throw new Error('Missing message attribute in parsed JSON');
          }
        } catch (parseErr) {
          console.warn('Failed to parse Gemini response as JSON, displaying raw text:', parseErr);
          addCoachMessage(aiText);
        }
      } else {
        throw new Error('Empty response from Gemini API');
      }
    } catch (err) {
      console.error('Gemini API error:', err);
      typingMsg.remove();
      addCoachMessage(
        "My AI brain is experiencing high traffic right now! But don't worry, here is a quick tip:\n\n" +
          getLocalCoachResponse(q)
      );
    }
  } else {
    // Normal Local mode fallback with instructions to activate AI
    const fallbackResponse = getLocalCoachResponse(q);
    addCoachMessage(
      fallbackResponse +
        '\n\n💡 *Tip: Go to Settings (⚙️) and save your Gemini API Key to enable dynamic, real-world AI answers!*'
    );
  }
}

function getLocalCoachResponse(q) {
  if (q.includes('hello') || q.includes('hi ') || q.includes('hey')) {
    return 'Hello there! Hope you are having an eco-friendly day. ☀️ How can I help you support your sustainable habit loop today?';
  }
  if (
    q.includes('equivalent') ||
    q.includes('compare') ||
    q.includes('analogy') ||
    q.includes('how much co2')
  ) {
    return "Comparing carbon metrics is my specialty! 💡 Standard equivalents:\n- **1 kg of avoided CO₂** equals **121 smartphone charges**.\n- **1 kg of CO₂** is absorbed by **1 mature tree in about 15 days**.\n- Eating one beef meal instead of vegetarian produces about **1.5kg of excess CO₂**, which is like driving a fuel car for **7 km**! Let's choose local greens when possible.";
  }
  if (q.includes('transport') || q.includes('car') || q.includes('bike') || q.includes('drive')) {
    return "Transportation is a major carbon source! Commuting via walking, bicycling, or electric scooter has near-zero emissions. If you commute 10km by bike instead of driving, you avoid **2.1 kg of CO₂**. That's like tree-absorption for nearly a month!";
  }
  if (q.includes('food') || q.includes('meat') || q.includes('diet') || q.includes('eat')) {
    return 'Food habits have huge impact! Adopting a vegetarian diet for just one day saves approx **4.5kg of CO₂**. Supporting local farmers reduces emissions from freight transportation. Simply avoiding food waste also saves landfill methane emissions. 🥗';
  }
  if (
    q.includes('energy') ||
    q.includes('electricity') ||
    q.includes('bulb') ||
    q.includes('led')
  ) {
    return 'Smart energy saving tips include switching halogens to LEDs, shutting down computer screens when leaving, setting your thermostat to 24°C, and washing clothes in cold water. These micro-habits quickly stack up to big points! ⚡';
  }
  if (q.includes('points') || q.includes('level') || q.includes('ecoscore')) {
    return `You currently have **${state.userProfile.points || 320} Leaf Points** and are at **Level ${state.userProfile.level || 2}**! Your EcoScore is **${state.userProfile.ecoScore || 82}/100**. Level up by logging more positive habits. We reward actions with points to reinforce positive habit cycles.`;
  }
  if (q.includes('challenge')) {
    return 'You can view community challenges in the lower panel! Start one to unlock progress trackers. Completing a challenge gives major carbon savings and a high point reward to help you level up! 🏆';
  }
  return "That's an interesting question! Remember, every small action you take feeds directly into your Eco-Island. If you want to know about specific carbon equivalents (like driving vs. biking, or beef vs. salad) just ask, or log an activity to see your island bloom. 🌿";
}

export async function logActivity(activityText, val, unit, co2Avoided, co2Produced, points) {
  const category = state.currentCategory;
  const newLog = {
    id: 'log_' + Date.now() + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString(),
    category: category,
    activity: activityText,
    value: parseFloat(val),
    unit: unit,
    co2Avoided: parseFloat(co2Avoided),
    co2Produced: parseFloat(co2Produced),
    pointsEarned: parseInt(points),
  };

  // Write to PersistenceManager (saves in cloud or local storage)
  const logId = await PersistenceManager.addActivityLog(newLog);
  newLog.id = logId || newLog.id;

  if (PersistenceManager.isCloudMode()) {
    // In cloud mode, logs are stored in supabaseClient, but we cache locally in state for reactive UI updates
    state.activityLogs.unshift(newLog);
  }
  // In local mode, unshift is already done inside PersistenceManager.addActivityLog

  // Update profile
  state.userProfile.points += newLog.pointsEarned;
  state.userProfile.currentCo2 = Math.max(
    0,
    state.userProfile.currentCo2 - newLog.co2Avoided + newLog.co2Produced
  );
  state.userProfile.level = Math.max(1, Math.floor(state.userProfile.points / 500) + 1);

  // Re-calculate EcoScore
  const netSavings = state.activityLogs.reduce((sum, l) => sum + l.co2Avoided - l.co2Produced, 0);
  state.userProfile.ecoScore = Math.min(100, Math.max(10, Math.round(80 + netSavings * 1.5)));

  await PersistenceManager.saveUserProfile(state.userProfile);
  renderAll();

  if (typeof triggerActivityParticles === 'function') {
    triggerActivityParticles();
  }

  // Coach congratulates
  const charges = Math.round(newLog.co2Avoided * 121);
  let msg = `Wonderful job! You logged **"${activityText}"** and earned **${newLog.pointsEarned} Leaf Points**! `;
  if (newLog.co2Avoided > 0) {
    msg += `By avoiding **${newLog.co2Avoided} kg of CO₂**, you've made an impact equivalent to saving **${charges} smartphone charges**! 🚀 Keep it up!`;
  } else if (newLog.co2Produced > 0) {
    msg += `Got it recorded. While it added ${newLog.co2Produced} kg of CO₂ emissions, logging keeps our stats accurate! Let's check some eco-presets to offset this. 😊`;
  }

  addCoachMessage(msg);
}
export async function submitCustomLog() {
  const desc = document.getElementById('custom-activity').value.trim();
  const val = parseFloat(document.getElementById('custom-value').value);
  const unit = document.getElementById('unit-label').innerText || 'count';
  const avoided = parseFloat(document.getElementById('custom-co2-avoided').value) || 0;
  const produced = parseFloat(document.getElementById('custom-co2-produced').value) || 0;
  const points = parseInt(document.getElementById('custom-points').value) || 0;

  if (!desc) {
    showToast('Please enter an activity description.', 'error');
    return;
  }
  if (isNaN(val) || val <= 0) {
    showToast('Please enter a valid numeric value greater than 0.', 'error');
    return;
  }

  const btn = document.getElementById('btn-submit-log');
  btn.disabled = true;
  btn.innerText = 'Logging...';

  try {
    await logActivity(desc, val, unit, avoided, produced, points);

    // Reset form fields
    document.getElementById('custom-activity').value = '';
    document.getElementById('custom-value').value = '1';
    document.getElementById('custom-co2-avoided').value = '0.5';
    document.getElementById('custom-co2-produced').value = '0.0';
    document.getElementById('custom-points').value = '15';

    showToast('✅ Activity logged successfully! Check the Activity Feed below.', 'success');
  } catch (err) {
    console.error('Failed to log activity:', err);
    showToast('❌ Failed to log activity: ' + (err.message || 'Unknown error'), 'error');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Add Activity Log';
  }
}
export async function deleteLog(id) {
  const logIndex = state.activityLogs.findIndex((l) => l.id === id);
  if (logIndex > -1) {
    const log = state.activityLogs[logIndex];

    // Reverse metrics
    state.userProfile.points = Math.max(0, state.userProfile.points - log.pointsEarned);
    state.userProfile.currentCo2 = Math.max(
      0,
      state.userProfile.currentCo2 + log.co2Avoided - log.co2Produced
    );
    state.userProfile.level = Math.max(1, Math.floor(state.userProfile.points / 500) + 1);

    // Remove in DB or storage
    await PersistenceManager.deleteActivityLog(id);

    if (PersistenceManager.isCloudMode()) {
      state.activityLogs.splice(logIndex, 1);
    }

    // Recompute score
    const netSavings = state.activityLogs.reduce((sum, l) => sum + l.co2Avoided - l.co2Produced, 0);
    state.userProfile.ecoScore = Math.min(100, Math.max(10, Math.round(80 + netSavings * 1.5)));

    await PersistenceManager.saveUserProfile(state.userProfile);
    renderAll();
    addCoachMessage(
      `Removed activity log: "${log.activity}". Your Eco-Island metrics have updated accordingly.`
    );
  }
}
export async function triggerChallengeAction(id) {
  const ch = state.challenges.find((c) => c.id === id);
  if (!ch) return;

  if (ch.status === 'available') {
    ch.status = 'active';
    ch.progress = 20;
    await PersistenceManager.saveChallengeProgress(id, ch.progress, ch.status);
    addCoachMessage(
      `Awesome! You started the challenge: **"${ch.title}"**. Click it as you make progress in real life.`
    );
  } else if (ch.status === 'active') {
    ch.progress += 20;
    if (ch.progress >= 100) {
      ch.progress = 100;
      ch.status = 'completed';

      // Reward
      state.userProfile.points += ch.pointsReward;
      state.userProfile.currentCo2 = Math.max(0, state.userProfile.currentCo2 - ch.co2SavingsEst);

      // Log Milestone
      const milestoneLog = {
        id: 'log_' + Date.now(),
        timestamp: new Date().toISOString(),
        category: ch.category,
        activity: `Completed Challenge: ${ch.title} 🏆`,
        value: 1,
        unit: 'challenge',
        co2Avoided: ch.co2SavingsEst,
        co2Produced: 0,
        pointsEarned: ch.pointsReward,
      };

      await PersistenceManager.addActivityLog(milestoneLog);

      if (PersistenceManager.isCloudMode()) {
        state.activityLogs.unshift(milestoneLog);
      }

      const netSavings = state.activityLogs.reduce(
        (sum, l) => sum + l.co2Avoided - l.co2Produced,
        0
      );
      state.userProfile.ecoScore = Math.min(100, Math.max(10, Math.round(80 + netSavings * 1.5)));

      await PersistenceManager.saveChallengeProgress(id, ch.progress, ch.status);
      await PersistenceManager.saveUserProfile(state.userProfile);

      addCoachMessage(
        `🎉 **CONGRATULATIONS!** You completed the challenge **"${ch.title}"**! You've avoided **${ch.co2SavingsEst}kg of CO₂** and earned **${ch.pointsReward} Leaf Points**!`
      );
    } else {
      await PersistenceManager.saveChallengeProgress(id, ch.progress, ch.status);
      addCoachMessage(`Progress updated for **"${ch.title}"**. You're at **${ch.progress}%** now!`);
    }
  }

  renderAll();
}
export async function applyActiveRecommendation() {
  const btn = document.getElementById('btn-apply-rec');
  if (btn) {
    btn.innerHTML = 'Done! ✅';
    btn.style.backgroundColor = '#28a745'; // Green success color
    btn.disabled = true;
  }

  const rec = dynamicRecommendation || COACH_RECS[state.activeRecIndex];
  if (!rec) return;

  const co2Savings = rec.co2_savings || rec.co2Savings || 0.5;
  const pointsReward = rec.points_reward || rec.pointsReward || 40;

  await logActivity(rec.title, 1, 'count', co2Savings, 0, pointsReward);

  setTimeout(() => {
    if (dynamicRecommendation) {
      dynamicRecommendation = null;
    } else {
      state.activeRecIndex = (state.activeRecIndex + 1) % COACH_RECS.length;
    }
    renderCoachRecommendation();
  }, 800); // Wait 800ms to show the checkmark
}

// Global hook exposures
window.deleteLog = deleteLog;
window.triggerChallengeAction = triggerChallengeAction;
window.applyActiveRecommendation = applyActiveRecommendation;

// Run initial loader
window.onload = initApp;
