import test from 'node:test';
import assert from 'node:assert/strict';
import { state, addLog, processActivity, setActivityLogs } from '../js/state.js';

test('Initial state is correctly structured', (t) => {
  assert.ok(state);
  assert.ok(Array.isArray(state.activityLogs));
  assert.strictEqual(state.currentCategory, 'transport');
});

test('addLog pushes to activityLogs', (t) => {
  const log = { id: 'log_123', activity: 'Test' };
  addLog(log);
  assert.strictEqual(state.activityLogs.length, 1);
  assert.strictEqual(state.activityLogs[0].id, 'log_123');
  
  // Cleanup
  setActivityLogs([]);
});

test('processActivity calculates metrics correctly', (t) => {
  const profile = { points: 100, level: 1, co2Target: 15, currentCo2: 10, stats: { transport: 0, food: 0, energy: 0, lifestyle: 0 } };
  const log = { category: 'transport', pointsEarned: 25, co2Avoided: 5, co2Produced: 1 };
  
  processActivity(profile, log);
  
  assert.strictEqual(profile.points, 125);
  assert.strictEqual(profile.stats.transport, 5);
  // currentCo2 += produced - avoided. (10 + 1 - 5 = 6)
  assert.strictEqual(profile.currentCo2, 6);
});
