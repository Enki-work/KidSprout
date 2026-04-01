/**
 * 数据备份 / 恢复 Hook
 * 封装导出触发、导入确认对话框、Store 刷新逻辑
 */

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { exportBackup, parseBackupFromUri } from '@/backup/backupService';
import { restoreFromBackup } from '@/db/backup.repo';
import { useChildStore } from '@/store/childStore';
import { useMeasurementStore } from '@/store/measurementStore';
import { initLanguage } from '@/store/settingsStore';

export function useBackup() {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const loadChildren = useChildStore((s) => s.load);

  // ── 导出 ────────────────────────────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportBackup();
    } catch (e: unknown) {
      const code = e instanceof Error ? e.message : '';
      // 用户主动取消 share sheet 不弹错误
      if (code !== 'USER_CANCELED' && code !== 'SHARING_NOT_AVAILABLE') {
        Alert.alert(
          t('backup.exportError.title'),
          t('backup.exportError.message'),
        );
      }
    } finally {
      setIsExporting(false);
    }
  }, [t]);

  // ── 导入 ────────────────────────────────────────────────────────────────────

  const handleImportFromUri = useCallback(
    async (uri: string) => {
      // Step 1: 解析 & 验证文件
      let backup;
      try {
        backup = await parseBackupFromUri(uri);
      } catch (e: unknown) {
        const code = e instanceof Error ? e.message : '';
        const msgKey =
          code === 'INVALID_FORMAT' ? 'backup.importError.invalidFormat'
          : code === 'INVALID_JSON'  ? 'backup.importError.invalidJson'
          :                            'backup.importError.readFailed';
        Alert.alert(t('backup.importError.title'), t(msgKey));
        return;
      }

      // Step 2: 确认对话框
      Alert.alert(
        t('backup.confirmRestore.title'),
        t('backup.confirmRestore.message', {
          date:         backup.exportedAt.slice(0, 10),
          childCount:   backup.children.length,
          measureCount: backup.measurements.length,
        }),
        [
          { text: t('backup.confirmRestore.cancel'), style: 'cancel' },
          {
            text:  t('backup.confirmRestore.confirm'),
            style: 'destructive',
            onPress: async () => {
              setIsRestoring(true);
              try {
                // Step 3: 事务写入 DB
                restoreFromBackup(backup);

                // Step 4: 刷新 Store
                loadChildren();
                useMeasurementStore.setState({ byChild: {}, loadingByChild: {} });
                initLanguage();

                Alert.alert(
                  t('backup.restoreSuccess.title'),
                  t('backup.restoreSuccess.message'),
                );
              } catch {
                Alert.alert(
                  t('backup.restoreError.title'),
                  t('backup.restoreError.message'),
                );
              } finally {
                setIsRestoring(false);
              }
            },
          },
        ],
      );
    },
    [t, loadChildren],
  );

  return { handleExport, handleImportFromUri, isExporting, isRestoring };
}
