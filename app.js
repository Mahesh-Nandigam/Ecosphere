"use strict";

// EcoSphere Core Engine with supabaseClient Cloud & Local Storage Hybrid Persistence

/**
 * Escapes HTML characters to prevent DOM-based XSS attacks.
 * @param {string} str - The raw string to escape.
 * @returns {string} - The sanitized string.
 */
function escapeHTML(str) {
  if (!str) return "";
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag]));
}

// Default Offline Data Sandbox (as defined in gemini.md)
const DEFAULT_USER_PROFILE = {
  userId: "usr_local_8742",
  name: "Jane Doe (You)",
  joinedDate: "2026-06-17T00:00:00Z",
  points: 320,
  level: 2,
  co2Target: 14.5,
  currentCo2: 12.8,
  ecoScore: 82,
  stats: {
    transport: 4.8,
    food: 3.6,
    energy: 3.2,
    lifestyle: 1.2
  }
};

const DEFAULT_ACTIVITY_LOGS = [
  {
    id: "log_987654",
    timestamp: "2026-06-17T19:56:00Z",
    category: "transport",
    activity: "Rode electric bike instead of driving",
    value: 10.0,
    unit: "km",
    co2Avoided: 2.1,
    co2Produced: 0.0,
    pointsEarned: 25
  },
  {
    id: "log_987653",
    timestamp: "2026-06-17T14:30:00Z",
    category: "food",
    activity: "Ate vegetarian lunch instead of beef",
    value: 1.0,
    unit: "meal",
    co2Avoided: 1.5,
    co2Produced: 0.4,
    pointsEarned: 20
  }
];

const DEFAULT_CHALLENGES = [
  {
    id: "ch_554433",
    title: "Meatless Weekdays",
    description: "Eat vegetarian or vegan meals from Monday to Friday.",
    category: "food",
    difficulty: "medium",
    durationDays: 5,
    pointsReward: 150,
    co2SavingsEst: 12.5,
    progress: 60,
    status: "active"
  },
  {
    id: "ch_554434",
    title: "Pedal Power Week",
    description: "Commute via bike or walk for all trips under 5km.",
    category: "transport",
    difficulty: "hard",
    durationDays: 7,
    pointsReward: 250,
    co2SavingsEst: 18.0,
    progress: 20,
    status: "available"
  },
  {
    id: "ch_554435",
    title: "Zero Standby Power",
    description: "Turn off all electronics at the power strip before bed.",
    category: "energy",
    difficulty: "easy",
    durationDays: 3,
    pointsReward: 60,
    co2SavingsEst: 4.5,
    progress: 0,
    status: "available"
  }
];

const DEFAULT_LEADERBOARD = [
  { rank: 1, name: "Alex Green", avatar: "🌿", ecoScore: 96, co2AvoidedTotal: 84.5 },
  { rank: 2, name: "Sarah Solar", avatar: "☀️", ecoScore: 91, co2AvoidedTotal: 65.2 },
  { rank: 3, name: "Jane Doe (You)", avatar: "🌎", ecoScore: 82, co2AvoidedTotal: 12.8 },
  { rank: 4, name: "David Wind", avatar: "💨", ecoScore: 76, co2AvoidedTotal: 34.1 },
  { rank: 5, name: "Emma Earth", avatar: "🌱", ecoScore: 68, co2AvoidedTotal: 18.9 }
];

// Presets by Category (Fallback when offline)
const PRESETS = {
  transport: [
    { title: "Rode electric bike instead of driving", val: 10, unit: "km", co2Avoided: 2.1, co2Produced: 0.0, points: 25 },
    { title: "Took electric train (commute)", val: 25, unit: "km", co2Avoided: 4.2, co2Produced: 0.3, points: 35 },
    { title: "Carpooled with coworkers", val: 15, unit: "km", co2Avoided: 1.8, co2Produced: 1.2, points: 15 }
  ],
  food: [
    { title: "Ate vegetarian or vegan meal", val: 1, unit: "meal", co2Avoided: 1.5, co2Produced: 0.4, points: 20 },
    { title: "Purchased local organic produce", val: 1, unit: "count", co2Avoided: 0.8, co2Produced: 0.1, points: 15 },
    { title: "Composted organic food waste", val: 1, unit: "count", co2Avoided: 0.5, co2Produced: 0.0, points: 10 }
  ],
  energy: [
    { title: "Transition to LED bulbs (Replace 5)", val: 5, unit: "count", co2Avoided: 0.75, co2Produced: 0.0, points: 40 },
    { title: "Set thermostat to 24°C in summer", val: 8, unit: "hours", co2Avoided: 1.2, co2Produced: 0.0, points: 30 },
    { title: "Air-dried clothes instead of dryer", val: 1, unit: "load", co2Avoided: 1.8, co2Produced: 0.0, points: 25 }
  ],
  lifestyle: [
    { title: "Brought reusable bags & bottles", val: 1, unit: "count", co2Avoided: 0.3, co2Produced: 0.0, points: 10 },
    { title: "Recycled plastics, paper & tin", val: 1, unit: "count", co2Avoided: 0.4, co2Produced: 0.0, points: 10 },
    { title: "Purchased second-hand clothing", val: 1, item: "item", co2Avoided: 4.5, co2Produced: 0.0, points: 50 }
  ]
};

// Coach Recommendations List (Fallback when offline)
const COACH_RECS = [
  { category: "energy", title: "Transition to LED bulbs", description: "Replace 5 halogen bulbs in your living room. Saves approx. 0.75kg CO2 per day.", co2Savings: 0.75, difficulty: "easy", pointsReward: 40 },
  { category: "food", title: "Adopt Meatless Monday", description: "Enjoy entirely plant-based meals for one full day. Saves approx. 4.5kg CO2.", co2Savings: 4.5, difficulty: "easy", pointsReward: 50 },
  { category: "transport", title: "Commute via Electric Bike", description: "Cycle a 10km commute instead of driving a petrol car. Saves approx. 2.1kg CO2.", co2Savings: 2.1, difficulty: "medium", pointsReward: 30 },
  { category: "lifestyle", title: "Ditch Single-Use Water Bottles", description: "Use a steel bottle for 2 weeks. Saves approx. 1.2kg CO2 and prevents waste.", co2Savings: 1.2, difficulty: "easy", pointsReward: 25 },
  { category: "energy", title: "Unplug Idle Devices", description: "Unplug your home office setup before bed. Saves approx. 0.3kg CO2 per night.", co2Savings: 0.3, difficulty: "easy", pointsReward: 15 }
];

// App State Variables
let state = {
  userProfile: {},
  activityLogs: [],
  challenges: [],
  leaderboard: [],
  currentCategory: "transport",
  activeRecIndex: 0
};

// supabaseClient Global Client Reference
let supabaseClient = null;
let currentSession = null;
let isSignUpMode = false;

// ==========================================================
// PERSISTENCE MANAGER (HYBRID SYNC LAYER)
// ==========================================================
class PersistenceManager {
  
  static isCloudMode() {
    return supabaseClient !== null && currentSession !== null;
  }

  // Load profile state
  static async loadUserProfile() {
    if (this.isCloudMode()) {
      try {
        const uid = currentSession.user.id;
        const { data, error } = await supabaseClient
          .from("users")
          .select("*")
          .eq("id", uid)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            // Profile doesn't exist yet, insert it (upsert mapping auth values)
            const metaName = currentSession.user.user_metadata?.name || currentSession.user.email.split("@")[0];
            const newProfile = {
              id: uid,
              name: metaName,
              avatar_emoji: "🌎",
              points: DEFAULT_USER_PROFILE.points,
              level: DEFAULT_USER_PROFILE.level,
              co2_target: DEFAULT_USER_PROFILE.co2Target,
              current_co2: DEFAULT_USER_PROFILE.currentCo2,
              eco_score: DEFAULT_USER_PROFILE.ecoScore,
              stats_transport: DEFAULT_USER_PROFILE.stats.transport,
              stats_food: DEFAULT_USER_PROFILE.stats.food,
              stats_energy: DEFAULT_USER_PROFILE.stats.energy,
              stats_lifestyle: DEFAULT_USER_PROFILE.stats.lifestyle
            };

            const { error: insError } = await supabaseClient
              .from("users")
              .insert([newProfile]);
            
            if (insError) throw insError;
            
            return {
              userId: uid,
              name: newProfile.name,
              joinedDate: new Date().toISOString(),
              points: newProfile.points,
              level: newProfile.level,
              co2Target: newProfile.co2_target,
              currentCo2: newProfile.current_co2,
              ecoScore: newProfile.eco_score,
              stats: {
                transport: newProfile.stats_transport,
                food: newProfile.stats_food,
                energy: newProfile.stats_energy,
                lifestyle: newProfile.stats_lifestyle
              }
            };
          }
          throw error;
        }

        // Return mapped to JS naming structure
        return {
          userId: data.id,
          name: data.name,
          joinedDate: data.joined_date,
          points: data.points,
          level: data.level,
          co2Target: parseFloat(data.co2_target),
          currentCo2: parseFloat(data.current_co2),
          ecoScore: data.eco_score,
          stats: {
            transport: parseFloat(data.stats_transport),
            food: parseFloat(data.stats_food),
            energy: parseFloat(data.stats_energy),
            lifestyle: parseFloat(data.stats_lifestyle)
          }
        };
      } catch (err) {
        console.error("supabaseClient load profile failed, using LocalStorage fallback:", err);
      }
    }

    // LocalStorage Fallback
    const cachedProfile = localStorage.getItem("ecosphere_userProfile");
    return cachedProfile ? JSON.parse(cachedProfile) : { ...DEFAULT_USER_PROFILE };
  }

  static async saveUserProfile(profile) {
    if (this.isCloudMode()) {
      try {
        const uid = currentSession.user.id;
        const mapped = {
          name: profile.name,
          points: profile.points,
          level: profile.level,
          co2_target: profile.co2Target,
          current_co2: profile.currentCo2,
          eco_score: profile.ecoScore,
          stats_transport: profile.stats.transport,
          stats_food: profile.stats.food,
          stats_energy: profile.stats.energy,
          stats_lifestyle: profile.stats.lifestyle
        };

        const { error } = await supabaseClient
          .from("users")
          .update(mapped)
          .eq("id", uid);
        
        if (error) throw error;
        return;
      } catch (err) {
        console.error("Cloud profile save failed:", err);
      }
    }

    localStorage.setItem("ecosphere_userProfile", JSON.stringify(profile));
  }

  // Load activity logs
  static async loadActivityLogs() {
    if (this.isCloudMode()) {
      try {
        const uid = currentSession.user.id;
        const { data, error } = await supabaseClient
          .from("carbon_logs")
          .select("*")
          .eq("user_id", uid)
          .order("timestamp", { ascending: false });

        if (error) throw error;

        return data.map(log => ({
          id: log.id,
          timestamp: log.timestamp,
          category: log.category,
          activity: log.activity,
          value: parseFloat(log.value),
          unit: log.unit,
          co2Avoided: parseFloat(log.co2_avoided),
          co2Produced: parseFloat(log.co2_produced),
          pointsEarned: log.points_earned
        }));
      } catch (err) {
        console.error("Cloud activity logs load failed:", err);
      }
    }

    const cachedLogs = localStorage.getItem("ecosphere_activityLogs");
    return cachedLogs ? JSON.parse(cachedLogs) : [ ...DEFAULT_ACTIVITY_LOGS ];
  }

  static async addActivityLog(log) {
    if (this.isCloudMode()) {
      try {
        const uid = currentSession.user.id;
        const mapped = {
          user_id: uid,
          category: log.category,
          activity: log.activity,
          value: log.value,
          unit: log.unit,
          co2_avoided: log.co2Avoided,
          co2_produced: log.co2Produced,
          points_earned: log.pointsEarned
        };
        const { data, error } = await supabaseClient
          .from("carbon_logs")
          .insert([mapped])
          .select();

        if (error) throw error;
        return data[0].id;
      } catch (err) {
        console.error("Cloud log write failed:", err);
      }
    }

    // LocalStorage write — unshift so newest log appears at top of feed
    state.activityLogs.unshift(log);
    localStorage.setItem("ecosphere_activityLogs", JSON.stringify(state.activityLogs));
    return log.id;
  }

  static async deleteActivityLog(id) {
    if (this.isCloudMode()) {
      try {
        const { error } = await supabaseClient
          .from("carbon_logs")
          .delete()
          .eq("id", id);
        if (error) throw error;
        return;
      } catch (err) {
        console.error("Cloud log deletion failed:", err);
      }
    }

    const index = state.activityLogs.findIndex(l => l.id === id);
    if (index > -1) {
      state.activityLogs.splice(index, 1);
      localStorage.setItem("ecosphere_activityLogs", JSON.stringify(state.activityLogs));
    }
  }

  // Load Challenges
  static async loadChallenges() {
    // 1. Fetch predefined list from supabaseClient
    let baseChallenges = [ ...DEFAULT_CHALLENGES ];
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from("sustainability_challenges")
          .select("*");
        if (!error && data && data.length > 0) {
          baseChallenges = data.map(ch => ({
            id: ch.id,
            title: ch.title,
            description: ch.description,
            category: ch.category,
            difficulty: ch.difficulty,
            durationDays: ch.duration_days,
            pointsReward: ch.points_reward,
            co2SavingsEst: parseFloat(ch.co2_savings_est),
            progress: 0,
            status: "available"
          }));
        }
      } catch (err) {
        console.error("Failed to fetch predefined challenges:", err);
      }
    }

    // 2. Fetch user challenge progress mapping
    if (this.isCloudMode()) {
      try {
        const uid = currentSession.user.id;
        const { data, error } = await supabaseClient
          .from("user_challenges")
          .select("*")
          .eq("user_id", uid);

        if (!error && data) {
          return baseChallenges.map(ch => {
            const userProgress = data.find(uc => uc.challenge_id === ch.id);
            if (userProgress) {
              return {
                ...ch,
                progress: userProgress.progress,
                status: userProgress.status
              };
            }
            return ch;
          });
        }
      } catch (err) {
        console.error("Cloud challenges fetch failed:", err);
      }
    }

    // Local fallback
    const cachedChallenges = localStorage.getItem("ecosphere_challenges");
    return cachedChallenges ? JSON.parse(cachedChallenges) : [ ...DEFAULT_CHALLENGES ];
  }

  static async saveChallengeProgress(challengeId, progress, status) {
    if (this.isCloudMode()) {
      try {
        const uid = currentSession.user.id;
        const { error } = await supabaseClient
          .from("user_challenges")
          .upsert({
            user_id: uid,
            challenge_id: challengeId,
            progress: progress,
            status: status,
            updated_at: new Date().toISOString()
          });
        if (error) throw error;
        return;
      } catch (err) {
        console.error("Cloud challenge save failed:", err);
      }
    }

    // Local storage
    const ch = state.challenges.find(c => c.id === challengeId);
    if (ch) {
      ch.progress = progress;
      ch.status = status;
      localStorage.setItem("ecosphere_challenges", JSON.stringify(state.challenges));
    }
  }

  // Load Leaderboards
  static async loadLeaderboard() {
    if (supabaseClient) {
      try {
        // Query users profiles to assemble leaderboard ranking
        const { data, error } = await supabaseClient
          .from("users")
          .select("name, avatar_emoji, eco_score, points")
          .order("eco_score", { ascending: false })
          .limit(10);

        if (!error && data && data.length > 0) {
          return data.map((row, index) => ({
            rank: index + 1,
            name: row.name,
            avatar: row.avatar_emoji || "🌱",
            ecoScore: row.eco_score,
            co2AvoidedTotal: row.points * 0.15 // simulated avoided CO2 approximation
          }));
        }
      } catch (err) {
        console.error("Cloud leaderboard load failed, using local mockup:", err);
      }
    }

    const cachedLeaderboard = localStorage.getItem("ecosphere_leaderboard");
    return cachedLeaderboard ? JSON.parse(cachedLeaderboard) : [ ...DEFAULT_LEADERBOARD ];
  }

  // Automatic Data Migration: LocalStorage -> supabaseClient
  static async migrateLocalDataTosupabaseClient(uid) {
    console.log("Beginning local storage migration to supabaseClient for user:", uid);
    try {
      const cachedLogs = localStorage.getItem("ecosphere_activityLogs");
      if (cachedLogs) {
        const logs = JSON.parse(cachedLogs);
        if (logs.length > 0) {
          // Bulk insert logs into cloud
          const mappedLogs = logs.map(l => ({
            user_id: uid,
            category: l.category,
            activity: l.activity,
            value: l.value,
            unit: l.unit || "unit",
            co2_avoided: l.co2Avoided,
            co2_produced: l.co2Produced,
            points_earned: l.pointsEarned,
            timestamp: l.timestamp
          }));

          const { error: logErr } = await supabaseClient
            .from("carbon_logs")
            .insert(mappedLogs);
          
          if (logErr) console.warn("Some logs could not migrate (likely duplicate IDs):", logErr);
        }
      }

      // Sync active challenge states
      const cachedChallenges = localStorage.getItem("ecosphere_challenges");
      if (cachedChallenges) {
        const challenges = JSON.parse(cachedChallenges);
        for (const ch of challenges) {
          if (ch.status !== "available") {
            await supabaseClient.from("user_challenges").upsert({
              user_id: uid,
              challenge_id: ch.id,
              progress: ch.progress,
              status: ch.status,
              updated_at: new Date().toISOString()
            });
          }
        }
      }

      // Sync Profile stats
      const cachedProfile = localStorage.getItem("ecosphere_userProfile");
      if (cachedProfile) {
        const p = JSON.parse(cachedProfile);
        const mapped = {
          name: p.name !== "Jane Doe (You)" ? p.name : currentSession.user.user_metadata?.name || currentSession.user.email.split("@")[0],
          points: p.points,
          level: p.level,
          co2_target: p.co2Target,
          current_co2: p.currentCo2,
          eco_score: p.ecoScore,
          stats_transport: p.stats.transport,
          stats_food: p.stats.food,
          stats_energy: p.stats.energy,
          stats_lifestyle: p.stats.lifestyle
        };

        await supabaseClient.from("users").update(mapped).eq("id", uid);
      }

      // Clear local records to prevent repeated migrations
      localStorage.removeItem("ecosphere_activityLogs");
      localStorage.removeItem("ecosphere_challenges");
      localStorage.removeItem("ecosphere_userProfile");
      console.log("Migration completed successfully!");
    } catch (err) {
      console.error("Migration failed:", err);
    }
  }
}

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
      currentSession = session;
      console.log("supabaseClient Auth State Change:", event, session);
      
      if (session) {
        // Logged in
        document.getElementById("btn-show-auth").style.display = "none";
        const loggedBadge = document.getElementById("user-logged-badge");
        loggedBadge.style.display = "flex";
        
        const nameText = session.user.user_metadata?.name || session.user.email;
        document.getElementById("auth-user-name").innerText = nameText;
        
        // Trigger auto-migration if logs exist in local storage
        if (localStorage.getItem("ecosphere_activityLogs")) {
          await PersistenceManager.migrateLocalDataTosupabaseClient(session.user.id);
        }
      } else {
        // Logged out
        document.getElementById("btn-show-auth").style.display = "block";
        document.getElementById("user-logged-badge").style.display = "none";
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
  const chatMessages = document.getElementById("coach-messages");
  if (chatMessages.children.length === 0) {
    addCoachMessage("Hello! I'm Sage, your AI Eco-Coach. 🌿 I'm here to support you on your sustainability journey without any shame or guilt! We will nurture this beautiful eco-island together. You can log actions to earn points, complete challenges, and see your island bloom! Try logging a preset below or chat with me.");
  }
}

function initSupabaseClient() {
  const sbUrl = localStorage.getItem("ecosphere_sb_url");
  const sbKey = localStorage.getItem("ecosphere_sb_key");
  
  if (sbUrl && sbKey) {
    try {
      if (window.supabase) {
        supabaseClient = window.supabase.createClient(sbUrl, sbKey);
        console.log("supabaseClient Client initialized successfully.");
      }
    } catch (err) {
      console.error("Failed to initialize supabaseClient client:", err);
      supabaseClient = null;
    }
  } else {
    supabaseClient = null;
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

function setupConnectionStatusUI() {
  const settingsBtn = document.getElementById("btn-open-config");
  if (supabaseClient) {
    settingsBtn.innerHTML = "🔌";
    settingsBtn.style.color = "var(--color-primary)";
    settingsBtn.title = "Connected to supabaseClient";
  } else {
    settingsBtn.innerHTML = "⚙️";
    settingsBtn.style.color = "var(--color-text-secondary)";
    settingsBtn.title = "Local-Only Sandbox Mode";
  }
}

// ==========================================================
// MODALS & AUTH POPUP HANDLERS
// ==========================================================
function setupModalEventListeners() {
  const configModal = document.getElementById("config-modal");
  const authModal = document.getElementById("auth-modal");
  
  // Settings buttons
  document.getElementById("btn-open-config").addEventListener("click", () => {
    document.getElementById("input-sb-url").value = localStorage.getItem("ecosphere_sb_url") || "";
    document.getElementById("input-sb-key").value = localStorage.getItem("ecosphere_sb_key") || "";
    document.getElementById("input-gemini-key").value = localStorage.getItem("ecosphere_gemini_key") || "";
    configModal.style.display = "flex";
  });
  
  document.getElementById("btn-close-config").addEventListener("click", () => {
    configModal.style.display = "none";
  });

  // Save config setting
  document.getElementById("btn-save-config").addEventListener("click", async () => {
    const url = document.getElementById("input-sb-url").value.trim();
    const key = document.getElementById("input-sb-key").value.trim();
    const geminiKey = document.getElementById("input-gemini-key").value.trim();
    
    if (!url && !key && !geminiKey) {
      alert("Please enter settings to save.");
      return;
    }

    let warningMsg = "";
    let reloadNeeded = false;

    // Handle supabaseClient credentials
    if (url || key) {
      if (!url || !key) {
        alert("Please enter both supabaseClient URL and Anon Key to connect database.");
        return;
      }
      
      try {
        const testClient = window.supabase.createClient(url, key);
        const { data, error } = await testClient.from("carbon_activities").select("id").limit(1);
        
        if (error) {
          const isTableMissing = error.code === "42P01" || (error.message && error.message.includes("does not exist"));
          const isAuthError = error.status === 401 || error.status === 403 || (error.message && (error.message.includes("JWT") || error.message.includes("API key")));
          
          if (isAuthError) {
            throw new Error("Invalid supabaseClient URL or Anon Key (Unauthorized).");
          } else if (isTableMissing) {
            warningMsg = "\n\n⚠️ NOTE: The database tables do not exist yet. Please run 'supabaseClient_schema.sql' in your supabaseClient SQL Editor.";
          } else {
            throw error;
          }
        }
        
        localStorage.setItem("ecosphere_sb_url", url);
        localStorage.setItem("ecosphere_sb_key", key);
        reloadNeeded = true;
      } catch (err) {
        alert("Failed to connect to supabaseClient: " + (err.message || "Please check credentials."));
        return;
      }
    } else {
      // Disconnect DB if they cleared the fields
      if (localStorage.getItem("ecosphere_sb_url")) {
        localStorage.removeItem("ecosphere_sb_url");
        localStorage.removeItem("ecosphere_sb_key");
        reloadNeeded = true;
      }
    }

    // Handle Gemini Key
    if (geminiKey) {
      localStorage.setItem("ecosphere_gemini_key", geminiKey);
    } else {
      localStorage.removeItem("ecosphere_gemini_key");
    }

    configModal.style.display = "none";
    alert("Settings saved successfully!" + warningMsg);
    if (reloadNeeded) {
      window.location.reload();
    }
  });

  document.getElementById("btn-disconnect-db").addEventListener("click", () => {
    if (confirm("Disconnect database client and AI keys, returning to local Sandbox mode?")) {
      localStorage.removeItem("ecosphere_sb_url");
      localStorage.removeItem("ecosphere_sb_key");
      localStorage.removeItem("ecosphere_gemini_key");
      configModal.style.display = "none";
      window.location.reload();
    }
  });

  // Auth widget actions
  document.getElementById("btn-show-auth").addEventListener("click", () => {
    if (!supabaseClient) {
      alert("Please configure your supabaseClient Settings (⚙️ icon) first before signing in.");
      document.getElementById("btn-open-config").click();
      return;
    }
    isSignUpMode = false;
    renderAuthForm();
    authModal.style.display = "flex";
  });

  document.getElementById("btn-close-auth").addEventListener("click", () => {
    authModal.style.display = "none";
  });

  document.getElementById("tab-login").addEventListener("click", () => {
    isSignUpMode = false;
    renderAuthForm();
  });

  document.getElementById("tab-signup").addEventListener("click", () => {
    isSignUpMode = true;
    renderAuthForm();
  });

  // Submit sign in/up
  document.getElementById("auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value.trim();
    const name = document.getElementById("auth-name").value.trim();
    const submitBtn = document.getElementById("btn-submit-auth");
    
    submitBtn.innerText = "Processing...";
    submitBtn.disabled = true;
    
    try {
      if (isSignUpMode) {
        // Sign Up
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        });
        if (error) throw error;
        alert("Registration successful! If required, please confirm your email address or check your inbox.");
      } else {
        // Sign In
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
      authModal.style.display = "none";
    } catch (err) {
      alert("Authentication Error: " + err.message);
    } finally {
      submitBtn.innerText = isSignUpMode ? "Create Account" : "Sign In";
      submitBtn.disabled = false;
    }
  });

  document.getElementById("btn-sign-out").addEventListener("click", async () => {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
      window.location.reload();
    }
  });
}

function renderAuthForm() {
  const tabLogin = document.getElementById("tab-login");
  const tabSignup = document.getElementById("tab-signup");
  const nameGroup = document.getElementById("name-field-group");
  const submitBtn = document.getElementById("btn-submit-auth");

  if (isSignUpMode) {
    tabLogin.classList.remove("active");
    tabSignup.classList.add("active");
    nameGroup.style.display = "block";
    submitBtn.innerText = "Create Account";
  } else {
    tabLogin.classList.add("active");
    tabSignup.classList.remove("active");
    nameGroup.style.display = "none";
    submitBtn.innerText = "Sign In";
  }
}

// ==========================================================
// DOM SETUP & EVENT LISTENERS
// ==========================================================
function setupEventListeners() {
  // Tab Switching for Presets
  const tabs = document.querySelectorAll(".category-tabs .tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", (e) => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      state.currentCategory = tab.dataset.category;
      renderPresets();
      
      // Update form unit helper
      const unitLabel = document.getElementById("unit-label");
      if (state.currentCategory === "transport") unitLabel.innerText = "km";
      else if (state.currentCategory === "food") unitLabel.innerText = "meal";
      else if (state.currentCategory === "energy") unitLabel.innerText = "kWh";
      else unitLabel.innerText = "count";
    });
  });

  // Submit custom log form
  document.getElementById("btn-submit-log").addEventListener("click", () => {
    submitCustomLog();
  });

  // Chat message sending
  document.getElementById("btn-send-chat").addEventListener("click", () => {
    handleChatInput();
  });
  document.getElementById("chat-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleChatInput();
    }
  });

  // Clear timeline data
  document.getElementById("btn-clear-logs").addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all EcoSphere local/offline data?")) {
      resetToDefaults();
    }
  });
}

// Render Engine
function renderAll() {
  renderHeader();
  renderStatusBar();
  renderPresets();
  renderTimeline();
  renderLeaderboard();
  renderChallenges();
  renderCoachRecommendation();
  updateSVGIsland();
}

function renderHeader() {
  document.getElementById("header-level").innerText = state.userProfile.level;
  document.getElementById("header-ecoscore").innerText = state.userProfile.ecoScore;
  document.getElementById("header-points").innerText = state.userProfile.points;
}

function renderStatusBar() {
  document.getElementById("stats-target").innerText = `${state.userProfile.co2Target.toFixed(1)} kg`;
  document.getElementById("stats-current").innerText = `${state.userProfile.currentCo2.toFixed(1)} kg`;
  
  // Progress ratio
  const percentage = Math.min(100, Math.max(5, (state.userProfile.currentCo2 / state.userProfile.co2Target) * 100));
  const fill = document.getElementById("stats-progress-fill");
  fill.style.width = `${percentage}%`;

  if (state.userProfile.currentCo2 > state.userProfile.co2Target) {
    fill.style.background = "linear-gradient(90deg, #FD976D, #EF5350)"; // Reddish alert
  } else {
    fill.style.background = "linear-gradient(90deg, #5DCDF1, #8CD68A)"; // Cyan to soft green
  }
}

function renderPresets() {
  const container = document.getElementById("presets-container");
  container.innerHTML = "";
  
  const activePresets = PRESETS[state.currentCategory] || [];
  activePresets.forEach(preset => {
    const card = document.createElement("div");
    card.className = "preset-card";
    
    // Quick log function on click
    card.addEventListener("click", () => {
      logActivity(preset.title, preset.val, preset.unit, preset.co2Avoided, preset.co2Produced, preset.points);
    });

    card.innerHTML = `
      <div class="preset-title">${preset.title}</div>
      <div class="preset-val">${preset.val} ${preset.unit}</div>
      <div class="preset-savings">🌿 -${preset.co2Avoided}kg CO₂</div>
    `;
    container.appendChild(card);
  });
}

function renderTimeline() {
  const tbody = document.getElementById("timeline-body");
  const emptyMsg = document.getElementById("empty-logs-msg");
  tbody.innerHTML = "";
  
  if (state.activityLogs.length === 0) {
    emptyMsg.style.display = "block";
    return;
  }
  
  emptyMsg.style.display = "none";
  
  const fragment = document.createDocumentFragment();
  
  state.activityLogs.forEach(log => {
    const date = new Date(log.timestamp);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${timeStr}</td>
      <td><span class="timeline-category-tag tag-${escapeHTML(log.category)}">${escapeHTML(log.category)}</span></td>
      <td><strong>${escapeHTML(log.activity)}</strong></td>
      <td>${escapeHTML(String(log.value))} ${escapeHTML(log.unit || 'units')}</td>
      <td class="val-avoided">-${log.co2Avoided.toFixed(2)} kg</td>
      <td class="val-produced">${log.co2Produced > 0 ? '+' + log.co2Produced.toFixed(2) + ' kg' : '0.0 kg'}</td>
      <td class="reward-points">+${log.pointsEarned} pts</td>
      <td><button class="btn-danger-link" onclick="deleteLog('${escapeHTML(log.id)}')">Delete</button></td>
    `;
    fragment.appendChild(tr);
  });
  
  tbody.appendChild(fragment);
}

function renderLeaderboard() {
  const container = document.getElementById("leaderboard-container");
  container.innerHTML = "";
  
  // Inject user profile dynamically into leaderboard lists
  const currentLeaderboard = [...state.leaderboard];
  const userIdx = currentLeaderboard.findIndex(m => m.name.includes("(You)") || (currentSession && m.name === (currentSession.user.user_metadata?.name || currentSession.user.email)));
  
  const totalAvoided = state.activityLogs.reduce((sum, log) => sum + log.co2Avoided, 0);

  if (userIdx > -1) {
    currentLeaderboard[userIdx].ecoScore = state.userProfile.ecoScore;
    currentLeaderboard[userIdx].co2AvoidedTotal = totalAvoided + 12.8;
  } else {
    // Append user profile to leaderboard if not found
    currentLeaderboard.push({
      rank: currentLeaderboard.length + 1,
      name: currentSession ? (currentSession.user.user_metadata?.name || currentSession.user.email.split("@")[0]) : "Jane Doe (You)",
      avatar: "🌎",
      ecoScore: state.userProfile.ecoScore,
      co2AvoidedTotal: totalAvoided + 12.8
    });
  }

  // Sort and re-rank
  currentLeaderboard.sort((a, b) => b.ecoScore - a.ecoScore);
  
  const fragment = document.createDocumentFragment();
  
  currentLeaderboard.forEach((member, index) => {
    member.rank = index + 1;
    const item = document.createElement("div");
    item.className = "leaderboard-item";
    
    item.innerHTML = `
      <span class="leaderboard-rank">#${member.rank}</span>
      <span class="leaderboard-avatar">${escapeHTML(member.avatar)}</span>
      <div class="leaderboard-info">
        <span class="leaderboard-name">${escapeHTML(member.name)}</span>
        <span class="leaderboard-stats">Avoided: ${member.co2AvoidedTotal.toFixed(1)} kg CO₂</span>
      </div>
      <span class="leaderboard-score-badge">${member.ecoScore}</span>
    `;
    fragment.appendChild(item);
  });
  
  container.appendChild(fragment);
}

function renderChallenges() {
  const container = document.getElementById("challenges-container");
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();
  
  state.challenges.forEach(ch => {
    const item = document.createElement("div");
    item.className = "challenge-item";
    
    let actionBtnText = "Start Challenge";
    let actionBtnClass = "status-badge available";
    if (ch.status === "active") {
      actionBtnText = "Complete Action (+20%)";
      actionBtnClass = "status-badge active";
    } else if (ch.status === "completed") {
      actionBtnText = "Completed! 🏆";
      actionBtnClass = "status-badge completed";
    }
    
    item.innerHTML = `
      <div class="challenge-top">
        <div>
          <span class="badge difficulty-${escapeHTML(ch.difficulty)}">${escapeHTML(ch.difficulty)}</span>
          <span class="badge reward-points">+${escapeHTML(String(ch.pointsReward))} pts</span>
        </div>
        <span class="${actionBtnClass}" onclick="triggerChallengeAction('${escapeHTML(ch.id)}')">${actionBtnText}</span>
      </div>
      <div class="challenge-title">${escapeHTML(ch.title)}</div>
      <div class="challenge-desc">${escapeHTML(ch.description)}</div>
      <div class="challenge-progress-bar">
        <div class="challenge-progress-fill" style="width: ${escapeHTML(String(ch.progress))}%;"></div>
      </div>
      <div class="challenge-bottom">
        <span class="card-subtitle">Savings Est: ${escapeHTML(String(ch.co2SavingsEst))}kg CO₂</span>
        <span class="card-subtitle">${escapeHTML(String(ch.progress))}% completed</span>
      </div>
    `;
    fragment.appendChild(item);
  });
  
  container.appendChild(fragment);
}

let dynamicRecommendation = null;

function renderCoachRecommendation() {
  const rec = dynamicRecommendation || COACH_RECS[state.activeRecIndex];
  if (!rec) return;

  document.getElementById("rec-title").innerText = rec.title;
  document.getElementById("rec-desc").innerText = rec.description;
  
  const points = rec.points_reward || rec.pointsReward || 40;
  const diff = rec.difficulty || "easy";

  const labelsContainer = document.querySelector(".coach-recommendation-box .rec-meta");
  labelsContainer.innerHTML = `
    <span class="badge difficulty-${escapeHTML(diff)}">${escapeHTML(diff)}</span>
    <span class="badge reward-points">+${escapeHTML(String(points))} pts</span>
    <button class="btn btn-small btn-primary" id="btn-apply-rec" onclick="applyActiveRecommendation()">Do This</button>
  `;
}

// ==========================================================
// SVG ISLAND CONTROL GRAPHICS
// ==========================================================
/**
 * Updates the SVG visualization (Eco-Island) based on the user's current EcoScore.
 * Alters colors, visibility of elements, and gradient definitions.
 */
function updateSVGIsland() {
  const score  = state.userProfile.ecoScore  || 50;
  const level  = state.userProfile.level     || 1;

  // ── Stage System (1=Wasteland … 5=Paradise) ──────────────
  const stage = score >= 85 ? 5 : score >= 68 ? 4 : score >= 48 ? 3 : score >= 28 ? 2 : 1;

  // helpers
  const show = (id, on, opacity = 1) => {
    const el = document.getElementById(id);
    if (el) el.style.opacity = on ? String(opacity) : "0";
  };
  const setFill = (id, url) => {
    const el = document.getElementById(id);
    if (el) el.setAttribute("fill", url);
  };

  // ── SKY ──────────────────────────────────────────────────
  const skyGrads = ["sky-gradient-polluted","sky-gradient-recovering","sky-gradient-growing","sky-gradient-healthy","sky-gradient-paradise"];
  setFill("sky-bg", `url(#${skyGrads[stage-1]})`);

  // ── GROUND ────────────────────────────────────────────────
  const grndGrads = ["ground-gradient-dry","ground-gradient-recovering","ground-gradient-growing","ground-gradient-healthy","ground-gradient-paradise"];
  setFill("island-top", `url(#${grndGrads[stage-1]})`);

  // ── STARS (stages 1–2) ───────────────────────────────────
  show("stars-group",   stage <= 2, stage === 1 ? 1 : 0.5);

  // ── POLLUTION SMOG ────────────────────────────────────────
  show("smog-group", stage === 1, 1);
  const smog = document.getElementById("smog-group");
  if (smog) smog.style.opacity = stage === 1 ? "1" : stage === 2 ? "0.4" : "0";

  // ── SUN ───────────────────────────────────────────────────
  const sun     = document.getElementById("sun");
  const sunGlow = document.getElementById("sun-glow");
  const sunRays = document.getElementById("sun-rays");
  if (sun) sun.setAttribute("fill", stage <= 1 ? "#CFD8DC" : stage === 2 ? "#FFCC80" : "#FDD46B");
  if (sunGlow) sunGlow.style.opacity = stage <= 1 ? "0.2" : stage === 2 ? "0.5" : "1";
  if (sunRays) sunRays.style.opacity = stage >= 3 ? "0.6" : "0";

  // ── RAINBOW (paradise only) ───────────────────────────────
  show("rainbow-group", stage === 5, 1);

  // ── CLOUDS color ─────────────────────────────────────────
  const cloudGroup = document.getElementById("cloud-group");
  if (cloudGroup) {
    cloudGroup.querySelectorAll("path").forEach(p => {
      p.setAttribute("fill", stage <= 2 ? "#B0BEC5" : "#FFFFFF");
    });
  }

  // ── BIRDS ────────────────────────────────────────────────
  const birds = document.getElementById("birds-group");
  if (birds) birds.style.opacity = stage >= 3 ? (stage >= 4 ? "1" : "0.65") : "0";

  // ── BUTTERFLIES (stage 4+) ───────────────────────────────
  show("butterflies-group", stage >= 4, 1);

  // ── TURBINE speed ─────────────────────────────────────────
  const blade = document.getElementById("turbine-blades");
  if (blade) blade.style.animationDuration = ["28s","16s","9s","4s","2s"][stage-1];

  // ── TREES ─────────────────────────────────────────────────
  const treeThresholds = [0, 0, 28, 48, 65, 85]; // tree1..6 min score
  [1,2,3,4,5,6].forEach((n, i) => {
    const el = document.getElementById(`tree-${n}`);
    if (!el) return;
    const visible = score >= treeThresholds[i+1];
    el.style.opacity   = visible ? "1" : "0";
    el.style.transform = visible ? "scale(1)" : "scale(0.3)";
  });

  // ── FLOWERS ───────────────────────────────────────────────
  const flowers = document.getElementById("flowers");
  if (flowers) flowers.style.opacity = stage >= 3 ? "1" : stage === 2 ? "0.4" : "0.1";
  show("flowers-extra", stage >= 4, 1);

  // ── SOLAR PANEL 2 ─────────────────────────────────────────
  show("solar-panel-2", score >= 75, 1);

  // ── RABBIT ────────────────────────────────────────────────
  show("rabbit-group", score >= 80, 1);

  // ── CHIMNEY SMOKE (bad eco) ───────────────────────────────
  const cSmoke = document.getElementById("chimney-smoke");
  if (cSmoke) cSmoke.style.opacity = stage <= 2 ? "1" : "0";

  // ── SAGE CHARACTER ────────────────────────────────────────
  updateSageCharacter(stage);

  // ── SAGE COACH AVATAR in chat UI ──────────────────────────
  const avatar = document.querySelector(".coach-avatar");
  if (avatar) {
    const avatars = ["😰","🌱","😊","🌟","🎉"];
    avatar.textContent = avatars[stage-1];
  }

  updateCarbonAnalogy();
}

function updateSageCharacter(stage) {
  const mouth    = document.getElementById("sage-mouth");
  const sparkles = document.getElementById("sage-sparkles");
  const sageEl   = document.getElementById("sage-character");
  if (!mouth || !sageEl) return;

  // Mouth shape per stage (SVG quadratic bezier)
  const mouths = [
    "M-5,-4 Q0,-8 5,-4",   // 1: sad frown
    "M-4,-6 Q0,-5 4,-6",   // 2: neutral
    "M-5,-6 Q0,-3 5,-6",   // 3: slight smile
    "M-6,-7 Q0,-2 6,-7",   // 4: big smile
    "M-6,-8 Q0,0 6,-8",    // 5: huge grin
  ];
  mouth.setAttribute("d", mouths[stage-1]);

  // Bob speed per stage
  const durations = ["5s","4s","3s","2.5s","2s"];
  sageEl.style.animationDuration = durations[stage-1];

  // Sparkles only in paradise
  if (sparkles) sparkles.style.opacity = stage === 5 ? "1" : "0";
}

function triggerActivityParticles() {
  const ids = ["ap1","ap2","ap3","ap4","ap5","ap6"];
  const anims = [
    "particleBurstUp","particleBurstRight","particleBurstLeft",
    "particleBurstUpR","particleBurstUpL","particleBurstDiag"
  ];
  ids.forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.animation = "none";
    el.style.opacity   = "1";
    el.offsetHeight;   // reflow
    el.style.animation = `${anims[i]} 1.4s ease-out ${i * 0.05}s forwards`;
  });
  // reset after animation completes
  setTimeout(() => {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.style.animation = "none"; el.style.opacity = "0"; }
    });
  }, 2200);
}

function updateCarbonAnalogy() {
  const totalAvoided = state.activityLogs.reduce((sum, log) => sum + log.co2Avoided, 0);
  const textEl = document.getElementById("analogy-text");
  
  if (totalAvoided === 0) {
    textEl.innerHTML = "Log an activity below to calculate your daily CO₂ savings analogies!";
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

// ==========================================================
// DATA MUTATION CONTROLLERS
// ==========================================================
async function logActivity(activityText, val, unit, co2Avoided, co2Produced, points) {
  const category = state.currentCategory;
  const newLog = {
    id: "log_" + Date.now() + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString(),
    category: category,
    activity: activityText,
    value: parseFloat(val),
    unit: unit,
    co2Avoided: parseFloat(co2Avoided),
    co2Produced: parseFloat(co2Produced),
    pointsEarned: parseInt(points)
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
  state.userProfile.currentCo2 = Math.max(0, state.userProfile.currentCo2 - newLog.co2Avoided + newLog.co2Produced);
  state.userProfile.level = Math.max(1, Math.floor(state.userProfile.points / 500) + 1);
  
  // Re-calculate EcoScore
  const netSavings = state.activityLogs.reduce((sum, l) => sum + l.co2Avoided - l.co2Produced, 0);
  state.userProfile.ecoScore = Math.min(100, Math.max(10, Math.round(80 + (netSavings * 1.5))));
  
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

async function submitCustomLog() {
  const desc = document.getElementById("custom-activity").value.trim();
  const val = parseFloat(document.getElementById("custom-value").value);
  const unit = document.getElementById("unit-label").innerText || "count";
  const avoided = parseFloat(document.getElementById("custom-co2-avoided").value) || 0;
  const produced = parseFloat(document.getElementById("custom-co2-produced").value) || 0;
  const points = parseInt(document.getElementById("custom-points").value) || 0;
  
  if (!desc) {
    showToast("Please enter an activity description.", "error");
    return;
  }
  if (isNaN(val) || val <= 0) {
    showToast("Please enter a valid numeric value greater than 0.", "error");
    return;
  }
  
  const btn = document.getElementById("btn-submit-log");
  btn.disabled = true;
  btn.innerText = "Logging...";
  
  try {
    await logActivity(desc, val, unit, avoided, produced, points);
    
    // Reset form fields
    document.getElementById("custom-activity").value = "";
    document.getElementById("custom-value").value = "1";
    document.getElementById("custom-co2-avoided").value = "0.5";
    document.getElementById("custom-co2-produced").value = "0.0";
    document.getElementById("custom-points").value = "15";
    
    showToast("✅ Activity logged successfully! Check the Activity Feed below.", "success");
  } catch (err) {
    console.error("Failed to log activity:", err);
    showToast("❌ Failed to log activity: " + (err.message || "Unknown error"), "error");
  } finally {
    btn.disabled = false;
    btn.innerText = "Add Activity Log";
  }
}

function showToast(message, type = "success") {
  // Remove any existing toast
  const existing = document.getElementById("ecosphere-toast");
  if (existing) existing.remove();
  
  const toast = document.createElement("div");
  toast.id = "ecosphere-toast";
  toast.style.cssText = `
    position: fixed;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === "success" ? "linear-gradient(135deg, #2E7D32, #4CAF50)" : "linear-gradient(135deg, #c62828, #EF5350)"};
    color: #fff;
    padding: 14px 28px;
    border-radius: 50px;
    font-family: var(--font-body, 'Outfit', sans-serif);
    font-size: 15px;
    font-weight: 600;
    box-shadow: 0 8px 32px rgba(0,0,0,0.28);
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s ease;
    max-width: 90vw;
    text-align: center;
  `;
  toast.innerText = message;
  document.body.appendChild(toast);
  
  // Fade in
  requestAnimationFrame(() => { toast.style.opacity = "1"; });
  
  // Auto-dismiss after 3.5 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

async function deleteLog(id) {
  const logIndex = state.activityLogs.findIndex(l => l.id === id);
  if (logIndex > -1) {
    const log = state.activityLogs[logIndex];
    
    // Reverse metrics
    state.userProfile.points = Math.max(0, state.userProfile.points - log.pointsEarned);
    state.userProfile.currentCo2 = Math.max(0, state.userProfile.currentCo2 + log.co2Avoided - log.co2Produced);
    state.userProfile.level = Math.max(1, Math.floor(state.userProfile.points / 500) + 1);
    
    // Remove in DB or storage
    await PersistenceManager.deleteActivityLog(id);
    
    if (PersistenceManager.isCloudMode()) {
      state.activityLogs.splice(logIndex, 1);
    }
    
    // Recompute score
    const netSavings = state.activityLogs.reduce((sum, l) => sum + l.co2Avoided - l.co2Produced, 0);
    state.userProfile.ecoScore = Math.min(100, Math.max(10, Math.round(80 + (netSavings * 1.5))));
    
    await PersistenceManager.saveUserProfile(state.userProfile);
    renderAll();
    addCoachMessage(`Removed activity log: "${log.activity}". Your Eco-Island metrics have updated accordingly.`);
  }
}

async function triggerChallengeAction(id) {
  const ch = state.challenges.find(c => c.id === id);
  if (!ch) return;
  
  if (ch.status === "available") {
    ch.status = "active";
    ch.progress = 20;
    await PersistenceManager.saveChallengeProgress(id, ch.progress, ch.status);
    addCoachMessage(`Awesome! You started the challenge: **"${ch.title}"**. Click it as you make progress in real life.`);
  } else if (ch.status === "active") {
    ch.progress += 20;
    if (ch.progress >= 100) {
      ch.progress = 100;
      ch.status = "completed";
      
      // Reward
      state.userProfile.points += ch.pointsReward;
      state.userProfile.currentCo2 = Math.max(0, state.userProfile.currentCo2 - ch.co2SavingsEst);
      
      // Log Milestone
      const milestoneLog = {
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        category: ch.category,
        activity: `Completed Challenge: ${ch.title} 🏆`,
        value: 1,
        unit: "challenge",
        co2Avoided: ch.co2SavingsEst,
        co2Produced: 0,
        pointsEarned: ch.pointsReward
      };
      
      await PersistenceManager.addActivityLog(milestoneLog);
      
      if (PersistenceManager.isCloudMode()) {
        state.activityLogs.unshift(milestoneLog);
      }
      
      const netSavings = state.activityLogs.reduce((sum, l) => sum + l.co2Avoided - l.co2Produced, 0);
      state.userProfile.ecoScore = Math.min(100, Math.max(10, Math.round(80 + (netSavings * 1.5))));
      
      await PersistenceManager.saveChallengeProgress(id, ch.progress, ch.status);
      await PersistenceManager.saveUserProfile(state.userProfile);
      
      addCoachMessage(`🎉 **CONGRATULATIONS!** You completed the challenge **"${ch.title}"**! You've avoided **${ch.co2SavingsEst}kg of CO₂** and earned **${ch.pointsReward} Leaf Points**!`);
    } else {
      await PersistenceManager.saveChallengeProgress(id, ch.progress, ch.status);
      addCoachMessage(`Progress updated for **"${ch.title}"**. You're at **${ch.progress}%** now!`);
    }
  }
  
  renderAll();
}

async function applyActiveRecommendation() {
  const rec = dynamicRecommendation || COACH_RECS[state.activeRecIndex];
  if (!rec) return;
  
  const co2Savings = rec.co2_savings || rec.co2Savings || 0.5;
  const pointsReward = rec.points_reward || rec.pointsReward || 40;
  
  await logActivity(rec.title, 1, "count", co2Savings, 0, pointsReward);
  
  if (dynamicRecommendation) {
    dynamicRecommendation = null; // Clear dynamic recommendation after it is applied
  } else {
    state.activeRecIndex = (state.activeRecIndex + 1) % COACH_RECS.length;
  }
  
  renderCoachRecommendation();
}

function resetToDefaults() {
  localStorage.removeItem("ecosphere_userProfile");
  localStorage.removeItem("ecosphere_activityLogs");
  localStorage.removeItem("ecosphere_challenges");
  localStorage.removeItem("ecosphere_leaderboard");
  
  state.currentCategory = "transport";
  state.activeRecIndex = 0;
  
  document.getElementById("coach-messages").innerHTML = "";
  
  reloadAppState().then(() => {
    addCoachMessage("I've reset your local workspace environment. Let's start fresh with a clean island! 🏝️");
  });
}

// ==========================================================
// SAGE COACH DIALOGUE ENGINE
// ==========================================================
function addCoachMessage(text) {
  const chatMessages = document.getElementById("coach-messages");
  const msgEl = document.createElement("div");
  msgEl.className = "chat-msg coach";
  
  let sanitizedText = escapeHTML(text);
  let formattedText = sanitizedText
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
    
  msgEl.innerHTML = formattedText;
  chatMessages.appendChild(msgEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addUserMessage(text) {
  const chatMessages = document.getElementById("coach-messages");
  const msgEl = document.createElement("div");
  msgEl.className = "chat-msg user";
  msgEl.innerText = text;
  chatMessages.appendChild(msgEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleChatInput() {
  const inputEl = document.getElementById("chat-input");
  const query = inputEl.value.trim();
  if (!query) return;
  
  addUserMessage(query);
  inputEl.value = "";
  
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
  const geminiApiKey = localStorage.getItem("ecosphere_gemini_key");

  if (geminiApiKey) {
    // Show a typing indicator message
    const chatMessages = document.getElementById("coach-messages");
    const typingMsg = document.createElement("div");
    typingMsg.className = "chat-msg coach typing-indicator-msg";
    typingMsg.innerHTML = "<em>Sage is thinking... 🌿</em>";
    chatMessages.appendChild(typingMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      // Calculate carbon breakdown percentages
      const stats = state.userProfile.stats || { transport: 0, food: 0, energy: 0, lifestyle: 0 };
      const total = (stats.transport + stats.food + stats.energy + stats.lifestyle) || 1;
      const breakdown = {
        transport: Math.round((stats.transport / total) * 100),
        food: Math.round((stats.food / total) * 100),
        energy: Math.round((stats.energy / total) * 100),
        lifestyle: Math.round((stats.lifestyle / total) * 100)
      };

      // Identify top category
      let topCategory = "transport";
      let maxVal = -1;
      for (const [cat, val] of Object.entries(breakdown)) {
        if (val > maxVal) {
          maxVal = val;
          topCategory = cat;
        }
      }

      // Filter active challenges
      const activeChallenges = state.challenges
        .filter(c => c.status === "active")
        .map(c => `${c.title} (${c.progress}% completed)`)
        .join(", ") || "None";

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

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      // Remove typing indicator
      typingMsg.remove();

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `status ${response.status}`;
        try {
          const errObj = JSON.parse(errorText);
          if (errObj.error && errObj.error.message) {
            errorMsg += " - " + errObj.error.message;
          }
        } catch(e) {
          errorMsg += " - " + errorText.substring(0, 50);
        }
        throw new Error(`Gemini API returned ${errorMsg}`);
      }

      const responseData = await response.json();
      let aiText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (aiText) {
        let cleanText = aiText.trim();
        
        // Attempt to extract JSON if wrapped in markdown
        if (cleanText.includes("```")) {
          const lines = cleanText.split("\n");
          const jsonLines = [];
          let inJson = false;
          for (const line of lines) {
            if (line.trim().startsWith("```")) {
              inJson = !inJson;
              continue;
            }
            if (inJson || lines.length === 1) {
              jsonLines.push(line);
            }
          }
          if (jsonLines.length > 0) {
            cleanText = jsonLines.join("\n").trim();
          }
        }
        
        cleanText = cleanText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();

        try {
          const aiData = JSON.parse(cleanText);
          if (aiData && aiData.message) {
            addCoachMessage(aiData.message);
            if (aiData.recommendation) {
              dynamicRecommendation = aiData.recommendation;
              renderCoachRecommendation();
            }
          } else {
            throw new Error("Missing message attribute in parsed JSON");
          }
        } catch (parseErr) {
          console.warn("Failed to parse Gemini response as JSON, displaying raw text:", parseErr);
          addCoachMessage(aiText);
        }
      } else {
        throw new Error("Empty response from Gemini API");
      }
    } catch (err) {
      console.error("Gemini API error:", err);
      typingMsg.remove();
      addCoachMessage("Oops! I had trouble connecting to my AI brain (" + err.message + "). Here is a quick tip in local mode:\n\n" + getLocalCoachResponse(q));
    }
  } else {
    // Normal Local mode fallback with instructions to activate AI
    const fallbackResponse = getLocalCoachResponse(q);
    addCoachMessage(fallbackResponse + "\n\n💡 *Tip: Go to Settings (⚙️) and save your Gemini API Key to enable dynamic, real-world AI answers!*");
  }
}

function getLocalCoachResponse(q) {
  if (q.includes("hello") || q.includes("hi ") || q.includes("hey")) {
    return "Hello there! Hope you are having an eco-friendly day. ☀️ How can I help you support your sustainable habit loop today?";
  } 
  if (q.includes("equivalent") || q.includes("compare") || q.includes("analogy") || q.includes("how much co2")) {
    return "Comparing carbon metrics is my specialty! 💡 Standard equivalents:\n- **1 kg of avoided CO₂** equals **121 smartphone charges**.\n- **1 kg of CO₂** is absorbed by **1 mature tree in about 15 days**.\n- Eating one beef meal instead of vegetarian produces about **1.5kg of excess CO₂**, which is like driving a fuel car for **7 km**! Let's choose local greens when possible.";
  }
  if (q.includes("transport") || q.includes("car") || q.includes("bike") || q.includes("drive")) {
    return "Transportation is a major carbon source! Commuting via walking, bicycling, or electric scooter has near-zero emissions. If you commute 10km by bike instead of driving, you avoid **2.1 kg of CO₂**. That's like tree-absorption for nearly a month!";
  }
  if (q.includes("food") || q.includes("meat") || q.includes("diet") || q.includes("eat")) {
    return "Food habits have huge impact! Adopting a vegetarian diet for just one day saves approx **4.5kg of CO₂**. Supporting local farmers reduces emissions from freight transportation. Simply avoiding food waste also saves landfill methane emissions. 🥗";
  }
  if (q.includes("energy") || q.includes("electricity") || q.includes("bulb") || q.includes("led")) {
    return "Smart energy saving tips include switching halogens to LEDs, shutting down computer screens when leaving, setting your thermostat to 24°C, and washing clothes in cold water. These micro-habits quickly stack up to big points! ⚡";
  }
  if (q.includes("points") || q.includes("level") || q.includes("ecoscore")) {
    return `You currently have **${state.userProfile.points || 320} Leaf Points** and are at **Level ${state.userProfile.level || 2}**! Your EcoScore is **${state.userProfile.ecoScore || 82}/100**. Level up by logging more positive habits. We reward actions with points to reinforce positive habit cycles.`;
  }
  if (q.includes("challenge")) {
    return "You can view community challenges in the lower panel! Start one to unlock progress trackers. Completing a challenge gives major carbon savings and a high point reward to help you level up! 🏆";
  }
  return "That's an interesting question! Remember, every small action you take feeds directly into your Eco-Island. If you want to know about specific carbon equivalents (like driving vs. biking, or beef vs. salad) just ask, or log an activity to see your island bloom. 🌿";
}

// Global hook exposures
window.deleteLog = deleteLog;
window.triggerChallengeAction = triggerChallengeAction;
window.applyActiveRecommendation = applyActiveRecommendation;

// Run initial loader
window.onload = initApp;
