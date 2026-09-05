// In-memory user settings storage
const userSettingsMap = new Map();

/**
 * Get or initialize user settings
 * @param {string|number} userId
 */
export function getUserSettings(userId) {
  const id = String(userId);
  if (!userSettingsMap.has(id)) {
    userSettingsMap.set(id, {
      watermarkEnabled: true,
      customWatermark: null, // Buffer or null
      customEndingPdf: null,  // Buffer or null
      awaitingAction: null    // 'upload_watermark' | 'upload_ending' | null
    });
  }
  return userSettingsMap.get(id);
}

/**
 * Toggle watermark on/off
 * @param {string|number} userId
 */
export function toggleWatermark(userId) {
  const settings = getUserSettings(userId);
  settings.watermarkEnabled = !settings.watermarkEnabled;
  return settings.watermarkEnabled;
}

/**
 * Set awaiting action for user
 * @param {string|number} userId
 * @param {'upload_watermark'|'upload_ending'|null} action
 */
export function setAwaitingAction(userId, action) {
  const settings = getUserSettings(userId);
  settings.awaitingAction = action;
}

/**
 * Set custom watermark image buffer
 * @param {string|number} userId
 * @param {Buffer} buffer
 */
export function setCustomWatermark(userId, buffer) {
  const settings = getUserSettings(userId);
  settings.customWatermark = buffer;
  settings.watermarkEnabled = true;
  settings.awaitingAction = null;
}

/**
 * Set custom ending PDF buffer
 * @param {string|number} userId
 * @param {Buffer} buffer
 */
export function setCustomEndingPdf(userId, buffer) {
  const settings = getUserSettings(userId);
  settings.customEndingPdf = buffer;
  settings.awaitingAction = null;
}

/**
 * Reset user settings to default
 * @param {string|number} userId
 */
export function resetUserSettings(userId) {
  const settings = getUserSettings(userId);
  settings.watermarkEnabled = true;
  settings.customWatermark = null;
  settings.customEndingPdf = null;
  settings.awaitingAction = null;
  return settings;
}
