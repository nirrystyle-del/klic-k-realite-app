// Klíč k realitě - database layer v7
// Zatím běží v lokálním testovacím režimu.
// Později se sem napojí skutečná databáze.

// Budoucí tabulka users:
// telegram_id
// telegram_username
// first_name
// display_name
// birth_day
// birth_month
// birth_year
// birthdate_changed_at
// created_at
// updated_at

// Budoucí tabulka subscriptions:
// telegram_id
// status
// provider
// started_at
// expires_at
// last_payment_id

window.KLIC_DATABASE = {
  mode: "local_test",

  profileKey(userKey) {
    return `klic_k_realite_profile_v7_${userKey}`;
  },

  accessKey(userKey) {
    return `klic_k_realite_test_access_v7_${userKey}`;
  },

  async getProfile(userKey) {
    try {
      return JSON.parse(localStorage.getItem(this.profileKey(userKey))) || null;
    } catch {
      return null;
    }
  },

  async saveProfile(userKey, profile) {
    localStorage.setItem(this.profileKey(userKey), JSON.stringify(profile));
    return profile;
  },

  async hasActiveAccess(userKey) {
    return localStorage.getItem(this.accessKey(userKey)) === "active";
  },

  async setTestAccess(userKey, value) {
    if (value) {
      localStorage.setItem(this.accessKey(userKey), "active");
    } else {
      localStorage.removeItem(this.accessKey(userKey));
    }
    return value;
  }
};
