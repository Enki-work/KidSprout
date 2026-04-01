/**
 * 备份文件 Zod schema 与类型定义
 */

import { z } from 'zod';

const ChildBackupSchema = z.object({
  id:         z.string().min(1),
  name:       z.string().min(1),
  sex:        z.enum(['male', 'female']),
  birthDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  standardId: z.string().min(1),
  createdAt:  z.string(),
  updatedAt:  z.string(),
});

const MeasurementBackupSchema = z.object({
  id:         z.string().min(1),
  childId:    z.string().min(1),
  measuredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  heightCm:   z.number().min(1).max(300),
  weightKg:   z.number().min(0.1).max(500).nullable().optional(),
  note:       z.string().nullable().optional(),
  createdAt:  z.string(),
  updatedAt:  z.string(),
});

export const BackupFileSchema = z.object({
  version:     z.literal(1),
  exportedAt:  z.string(),
  appBundleId: z.string(),
  settings: z.object({
    language: z.enum(['zh', 'zh-Hant', 'ja', 'en', 'es', 'ko']).optional(),
  }).optional(),
  children:     z.array(ChildBackupSchema),
  measurements: z.array(MeasurementBackupSchema),
});

export type BackupFile = z.infer<typeof BackupFileSchema>;
