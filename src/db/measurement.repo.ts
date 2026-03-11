/**
 * 身高记录 CRUD
 */

import { getDb } from './sqlite';
import { Measurement } from '@/types/measurement';

function rowToMeasurement(row: Record<string, unknown>): Measurement {
  return {
    id:          row.id as string,
    childId:     row.child_id as string,
    measuredAt:  row.measured_at as string,
    heightCm:    row.height_cm as number,
    note:        row.note as string | undefined,
    createdAt:   row.created_at as string,
    updatedAt:   row.updated_at as string,
  };
}

export function getMeasurementsByChild(childId: string): Measurement[] {
  const db = getDb();
  const rows = db.getAllSync(
    'SELECT * FROM measurements WHERE child_id = ? ORDER BY measured_at ASC',
    [childId]
  ) as Record<string, unknown>[];
  return rows.map(rowToMeasurement);
}

export function insertMeasurement(m: Measurement): void {
  const db = getDb();
  db.runSync(
    `INSERT INTO measurements (id, child_id, measured_at, height_cm, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [m.id, m.childId, m.measuredAt, m.heightCm,
     m.note ?? null, m.createdAt, m.updatedAt]
  );
}

export function updateMeasurement(m: Measurement): void {
  const db = getDb();
  db.runSync(
    `UPDATE measurements
     SET measured_at=?, height_cm=?, note=?, updated_at=?
     WHERE id=?`,
    [m.measuredAt, m.heightCm, m.note ?? null, m.updatedAt, m.id]
  );
}

export function deleteMeasurement(id: string): void {
  const db = getDb();
  db.runSync('DELETE FROM measurements WHERE id = ?', [id]);
}
