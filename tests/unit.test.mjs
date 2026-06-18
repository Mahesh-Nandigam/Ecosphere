import test from 'node:test';
import assert from 'node:assert/strict';
import { generateId, calculateLevelThreshold, calculateEcoScore } from '../js/utils.js';



test('generateId returns a properly prefixed string', (t) => {
  const id = generateId();
  assert.ok(id.startsWith('log_'));
  assert.ok(id.length > 8);
});

test('calculateLevelThreshold returns correct points for levels', (t) => {
  assert.strictEqual(calculateLevelThreshold(1), 100);
  assert.strictEqual(calculateLevelThreshold(2), 150); // 100 * 1.5^1
  assert.strictEqual(calculateLevelThreshold(3), 225); // 100 * 1.5^2
});

test('calculateEcoScore computes valid 1-100 scores', (t) => {
  const profile = { level: 2, points: 50 };
  const score = calculateEcoScore(profile);
  // Base = min(80, 20) = 20. Bonus = (50/150)*20 = floor(6.66) = 6. 20 + 6 = 26
  assert.strictEqual(score, 26);
  
  const highProfile = { level: 10, points: 50000 };
  assert.strictEqual(calculateEcoScore(highProfile), 100); // capped at 100

  const missingProfile = null;
  assert.strictEqual(calculateEcoScore(missingProfile), 50); // default
});
