const session = require("express-session");
const db = require("../db/database");

class SQLiteSessionStore extends session.Store {
  constructor() {
    super();
    this.read = db.prepare("SELECT sess, expires_at FROM sessions WHERE sid = ?");
    this.write = db.prepare("INSERT INTO sessions (sid, sess, expires_at) VALUES (?, ?, ?) ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expires_at = excluded.expires_at");
    this.remove = db.prepare("DELETE FROM sessions WHERE sid = ?");
    this.touchExpiry = db.prepare("UPDATE sessions SET expires_at = ? WHERE sid = ?");
    this.prune = db.prepare("DELETE FROM sessions WHERE expires_at <= ?");
  }

  get(sid, callback) {
    try {
      const row = this.read.get(sid);
      if (!row || row.expires_at <= Date.now()) {
        this.remove.run(sid);
        return callback(null, null);
      }
      return callback(null, JSON.parse(row.sess));
    } catch (error) {
      return callback(error);
    }
  }

  set(sid, value, callback = () => {}) {
    try {
      const expiry = value.cookie?.expires
        ? new Date(value.cookie.expires).getTime()
        : Date.now() + (value.cookie?.originalMaxAge ?? 8 * 60 * 60 * 1000);
      this.write.run(sid, JSON.stringify(value), expiry);
      if (Math.random() < 0.01) this.prune.run(Date.now());
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  touch(sid, value, callback = () => {}) {
    try {
      const expiry = value.cookie?.expires
        ? new Date(value.cookie.expires).getTime()
        : Date.now() + (value.cookie?.originalMaxAge ?? 8 * 60 * 60 * 1000);
      this.touchExpiry.run(expiry, sid);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  destroy(sid, callback = () => {}) {
    try {
      this.remove.run(sid);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }
}

module.exports = SQLiteSessionStore;
