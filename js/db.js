import { state } from './state.js';
import {
  DEFAULT_USER_PROFILE,
  DEFAULT_ACTIVITY_LOGS,
  DEFAULT_CHALLENGES,
  DEFAULT_LEADERBOARD,
} from './constants.js';

export let supabaseClient = null;
export let currentSession = null;
export let isSignUpMode = false;

export function setSignUpMode(mode) {
  isSignUpMode = mode;
}

export function setCurrentSession(session) {
  currentSession = session;
}

export function initSupabaseClient() {
  const sbUrl = localStorage.getItem('ecosphere_sb_url');
  const sbKey = localStorage.getItem('ecosphere_sb_key');

  if (sbUrl && sbKey) {
    try {
      if (window.supabase) {
        supabaseClient = window.supabase.createClient(sbUrl, sbKey);
        console.log('supabaseClient Client initialized successfully.');
      }
    } catch (err) {
      console.error('Failed to initialize supabaseClient client:', err);
      supabaseClient = null;
    }
  } else {
    supabaseClient = null;
  }
}

export class PersistenceManager {
  static isCloudMode() {
    return supabaseClient !== null && currentSession !== null;
  }

  static async loadUserProfile() {
    if (this.isCloudMode()) {
      try {
        const uid = currentSession.user.id;
        const { data, error } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', uid)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            const metaName =
              currentSession.user.user_metadata?.name || currentSession.user.email.split('@')[0];
            const newProfile = {
              id: uid,
              name: metaName,
              avatar_emoji: '🌎',
              points: DEFAULT_USER_PROFILE.points,
              level: DEFAULT_USER_PROFILE.level,
              co2_target: DEFAULT_USER_PROFILE.co2Target,
              current_co2: DEFAULT_USER_PROFILE.currentCo2,
              eco_score: DEFAULT_USER_PROFILE.ecoScore,
              stats_transport: DEFAULT_USER_PROFILE.stats.transport,
              stats_food: DEFAULT_USER_PROFILE.stats.food,
              stats_energy: DEFAULT_USER_PROFILE.stats.energy,
              stats_lifestyle: DEFAULT_USER_PROFILE.stats.lifestyle,
            };

            const { error: insError } = await supabaseClient.from('users').insert([newProfile]);
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
                lifestyle: newProfile.stats_lifestyle,
              },
            };
          }
          throw error;
        }

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
            lifestyle: parseFloat(data.stats_lifestyle),
          },
        };
      } catch (err) {
        console.error('supabaseClient load profile failed, using LocalStorage fallback:', err);
      }
    }

    const cachedProfile = localStorage.getItem('ecosphere_userProfile');
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
          stats_lifestyle: profile.stats.lifestyle,
        };

        const { error } = await supabaseClient.from('users').update(mapped).eq('id', uid);
        if (error) throw error;
        return;
      } catch (err) {
        console.error('Cloud profile save failed:', err);
      }
    }

    localStorage.setItem('ecosphere_userProfile', JSON.stringify(profile));
  }

  static async loadActivityLogs() {
    if (this.isCloudMode()) {
      try {
        const uid = currentSession.user.id;
        const { data, error } = await supabaseClient
          .from('carbon_logs')
          .select('*')
          .eq('user_id', uid)
          .order('timestamp', { ascending: false });

        if (error) throw error;

        return data.map((log) => ({
          id: log.id,
          timestamp: log.timestamp,
          category: log.category,
          activity: log.activity,
          value: parseFloat(log.value),
          unit: log.unit,
          co2Avoided: parseFloat(log.co2_avoided),
          co2Produced: parseFloat(log.co2_produced),
          pointsEarned: log.points_earned,
        }));
      } catch (err) {
        console.error('Cloud activity logs load failed:', err);
      }
    }

    const cachedLogs = localStorage.getItem('ecosphere_activityLogs');
    return cachedLogs ? JSON.parse(cachedLogs) : [...DEFAULT_ACTIVITY_LOGS];
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
          points_earned: log.pointsEarned,
        };
        const { data, error } = await supabaseClient.from('carbon_logs').insert([mapped]).select();

        if (error) throw error;
        return data[0].id;
      } catch (err) {
        console.error('Cloud activity log failed:', err);
      }
    }

    state.activityLogs.unshift(log);
    localStorage.setItem('ecosphere_activityLogs', JSON.stringify(state.activityLogs));
    return log.id;
  }

  static async loadChallenges() {
    const baseChallenges = [...DEFAULT_CHALLENGES];
    if (this.isCloudMode()) {
      try {
        const uid = currentSession.user.id;
        const { data, error } = await supabaseClient
          .from('user_challenges')
          .select('*')
          .eq('user_id', uid);

        if (!error && data) {
          return baseChallenges.map((ch) => {
            const userProgress = data.find((uc) => uc.challenge_id === ch.id);
            if (userProgress) {
              return {
                ...ch,
                progress: userProgress.progress,
                status: userProgress.status,
              };
            }
            return ch;
          });
        }
      } catch (err) {
        console.error('Cloud challenges fetch failed:', err);
      }
    }

    const cachedChallenges = localStorage.getItem('ecosphere_challenges');
    return cachedChallenges ? JSON.parse(cachedChallenges) : [...DEFAULT_CHALLENGES];
  }

  static async saveChallengeProgress(challengeId, progress, status) {
    if (this.isCloudMode()) {
      try {
        const uid = currentSession.user.id;
        const { error } = await supabaseClient.from('user_challenges').upsert({
          user_id: uid,
          challenge_id: challengeId,
          progress: progress,
          status: status,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
        return;
      } catch (err) {
        console.error('Cloud challenge save failed:', err);
      }
    }

    const ch = state.challenges.find((c) => c.id === challengeId);
    if (ch) {
      ch.progress = progress;
      ch.status = status;
      localStorage.setItem('ecosphere_challenges', JSON.stringify(state.challenges));
    }
  }

  static async loadLeaderboard() {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('users')
          .select('name, avatar_emoji, eco_score, points')
          .order('eco_score', { ascending: false })
          .limit(10);

        if (!error && data && data.length > 0) {
          return data.map((row, index) => ({
            rank: index + 1,
            name: row.name,
            avatar: row.avatar_emoji || '🌱',
            ecoScore: row.eco_score,
            co2AvoidedTotal: row.points * 0.15,
          }));
        }
      } catch (err) {
        console.error('Cloud leaderboard load failed, using local mockup:', err);
      }
    }

    const cachedLeaderboard = localStorage.getItem('ecosphere_leaderboard');
    return cachedLeaderboard ? JSON.parse(cachedLeaderboard) : [...DEFAULT_LEADERBOARD];
  }

  static async migrateLocalDataTosupabaseClient(uid) {
    console.log('Beginning local storage migration to supabaseClient for user:', uid);
    try {
      const cachedLogs = localStorage.getItem('ecosphere_activityLogs');
      if (cachedLogs) {
        const logs = JSON.parse(cachedLogs);
        if (logs.length > 0) {
          const mappedLogs = logs.map((l) => ({
            user_id: uid,
            category: l.category,
            activity: l.activity,
            value: l.value,
            unit: l.unit || 'unit',
            co2_avoided: l.co2Avoided,
            co2_produced: l.co2Produced,
            points_earned: l.pointsEarned,
            timestamp: l.timestamp,
          }));

          const { error: logErr } = await supabaseClient.from('carbon_logs').insert(mappedLogs);
          if (logErr) console.warn('Some logs could not migrate (likely duplicate IDs):', logErr);
        }
      }

      const cachedChallenges = localStorage.getItem('ecosphere_challenges');
      if (cachedChallenges) {
        const challenges = JSON.parse(cachedChallenges);
        for (const ch of challenges) {
          if (ch.status !== 'available') {
            await supabaseClient.from('user_challenges').upsert({
              user_id: uid,
              challenge_id: ch.id,
              progress: ch.progress,
              status: ch.status,
              updated_at: new Date().toISOString(),
            });
          }
        }
      }

      const cachedProfile = localStorage.getItem('ecosphere_userProfile');
      if (cachedProfile) {
        const p = JSON.parse(cachedProfile);
        const mapped = {
          name:
            p.name !== 'Jane Doe (You)'
              ? p.name
              : currentSession.user.user_metadata?.name || currentSession.user.email.split('@')[0],
          points: p.points,
          level: p.level,
          co2_target: p.co2Target,
          current_co2: p.currentCo2,
          eco_score: p.ecoScore,
          stats_transport: p.stats.transport,
          stats_food: p.stats.food,
          stats_energy: p.stats.energy,
          stats_lifestyle: p.stats.lifestyle,
        };

        await supabaseClient.from('users').update(mapped).eq('id', uid);
      }

      localStorage.removeItem('ecosphere_activityLogs');
      localStorage.removeItem('ecosphere_challenges');
      localStorage.removeItem('ecosphere_userProfile');
      console.log('Migration completed successfully!');
    } catch (err) {
      console.error('Migration failed:', err);
    }
  }
}
