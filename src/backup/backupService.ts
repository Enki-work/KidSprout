/**
 * 备份导出 / 导入解析（纯函数，不操作 DB）
 * 使用 expo-file-system v19 新 API（File + Paths）
 */

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { BackupFile, BackupFileSchema } from './backupSchema';
import { getAllChildren } from '@/db/child.repo';
import { getMeasurementsByChild } from '@/db/measurement.repo';
import { getSetting } from '@/db/settings.repo';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '@/i18n';

// ── 导出 ──────────────────────────────────────────────────────────────────────

export async function exportBackup(): Promise<void> {
  const children = getAllChildren();
  const measurements = children.flatMap((c) => getMeasurementsByChild(c.id));
  const language = getSetting('language');

  const backup: BackupFile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appBundleId: 'com.qiyan.KidSprout',
    settings: {
      language:
        language && SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)
          ? (language as SupportedLanguage)
          : undefined,
    },
    children,
    measurements: measurements.map((m) => ({
      ...m,
      weightKg: m.weightKg ?? null,
      note: m.note ?? null,
    })),
  };

  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `KidSprout_backup_${dateStr}.kidsprout`;

  // 写入缓存目录
  const file = new File(Paths.cache, fileName);
  file.write(JSON.stringify(backup, null, 2));

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('SHARING_NOT_AVAILABLE');

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'KidSprout Backup',
    UTI: 'com.qiyan.kidsprout.backup',
  });
}

// ── 导入解析 ──────────────────────────────────────────────────────────────────

/**
 * 从 URI 读取并验证备份文件。只解析，不写 DB。
 */
export async function parseBackupFromUri(uri: string): Promise<BackupFile> {
  let raw: string;
  try {
    const file = new File(uri);
    raw = await file.text();
  } catch {
    throw new Error('READ_FAILED');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('INVALID_JSON');
  }

  const result = BackupFileSchema.safeParse(parsed);
  if (!result.success) throw new Error('INVALID_FORMAT');

  return result.data;
}
