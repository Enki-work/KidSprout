/**
 * SQLite 数据库初始化
 * expo-sqlite v16 使用同步 API
 *
 * getDb() 在首次调用时自动建表，无需提前调用 initDb()
 */

import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

/**
 * 获取 DB 单例，首次调用时自动执行建表（幂等）
 */
export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('kidsprout.db');
    _db.execSync(`
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

      CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }
  return _db;
}

/** 兼容旧调用，保留导出（无需手动调用，getDb 自动初始化） */
export function initDb(): void {
  getDb();
}
