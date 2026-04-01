/**
 * 备份恢复：事务性清空 + 重写数据库
 */

import { getDb } from './sqlite';
import { setSetting } from './settings.repo';
import { BackupFile } from '@/backup/backupSchema';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '@/i18n';

/**
 * 在单个 SQLite 事务中清空所有数据并写入备份内容。
 * 失败时自动 ROLLBACK，原有数据保持不变。
 */
export function restoreFromBackup(backup: BackupFile): void {
  const db = getDb();

  db.execSync('BEGIN');
  try {
    db.execSync('DELETE FROM measurements');
    db.execSync('DELETE FROM children');

    for (const c of backup.children) {
      db.runSync(
        `INSERT INTO children (id, name, sex, birth_date, standard_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.name, c.sex, c.birthDate, c.standardId, c.createdAt, c.updatedAt],
      );
    }

    for (const m of backup.measurements) {
      db.runSync(
        `INSERT INTO measurements
           (id, child_id, measured_at, height_cm, weight_kg, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          m.id, m.childId, m.measuredAt, m.heightCm,
          m.weightKg ?? null, m.note ?? null, m.createdAt, m.updatedAt,
        ],
      );
    }

    // 恢复语言设置（不恢复 purchase_weight）
    const lang = backup.settings?.language;
    if (lang && SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) {
      setSetting('language', lang);
    }

    db.execSync('COMMIT');
  } catch (e) {
    db.execSync('ROLLBACK');
    throw e;
  }
}
