/**
 * SQLite 数据库初始化
 * expo-sqlite v16 使用同步 API
 */

import * as SQLite from 'expo-sqlite';

// 全局单例
let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('kidsprout.db');
  }
  return _db;
}

/**
 * 建表（幂等，应用启动时调用一次）
 */
export function initDb(): void {
  const db = getDb();
  db.execSync(`
    CREATE TABLE IF NOT EXISTS children (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      sex           TEXT NOT NULL CHECK(sex IN ('male', 'female')),
      birth_date    TEXT NOT NULL,
      standard_id   TEXT NOT NULL DEFAULT 'japan',
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS measurements (
      id            TEXT PRIMARY KEY,
      child_id      TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      measured_at   TEXT NOT NULL,
      height_cm     REAL NOT NULL,
      note          TEXT,
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_measurements_child
      ON measurements(child_id, measured_at);
  `);
}
