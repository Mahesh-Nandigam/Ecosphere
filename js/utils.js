/**
 * Safely escapes HTML characters to prevent XSS.
 * @param {string} str - The string to escape.
 * @returns {string} - The safely escaped string.
 */
export function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[tag]
  );
}

/**
 * Generates a pseudo-random unique identifier.
 * @returns {string} - The generated ID string.
 */
export function generateId() {
  return 'log_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Calculates the points required to reach the next level.
 * @param {number} level - The current user level.
 * @returns {number} - The point threshold.
 */
export function calculateLevelThreshold(level) {
  if (level <= 1) return 100;
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * Computes an overall EcoScore from 1 to 100 based on user stats.
 * @param {Object} profile - The user profile object containing level and points.
 * @returns {number} - The calculated EcoScore.
 */
export function calculateEcoScore(profile) {
  if (!profile) return 50;
  // Weighting recent activities vs historic data would happen here.
  // We'll base it roughly on their level and current points relative to threshold
  const threshold = calculateLevelThreshold(profile.level);
  const base = Math.min(80, profile.level * 10);
  const bonus = Math.floor((profile.points / threshold) * 20);
  let score = base + bonus;
  if (score > 100) score = 100;
  if (score < 1) score = 1;
  return score;
}
