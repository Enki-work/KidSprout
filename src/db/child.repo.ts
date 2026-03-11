/**
 * 孩子档案 CRUD
 */

import { getDb } from './sqlite';
import { Child } from '@/types/child';

// DB 行 → Child 对象
function rowToChild(row: Record<string, unknown>): Child {
  return {
    id:           row.id as string,
    name:         row.name as string,
    sex:          row.sex as Child['sex'],
    birthDate:    row.birth_date as string,
    standardId:   row.standard_id as string,
    createdAt:    row.created_at as string,
    updatedAt:    row.updated_at as string,
  };
}

export function getAllChildren(): Child[] {
  const db = getDb();
  const rows = db.getAllSync(
    'SELECT * FROM children ORDER BY created_at ASC'
  ) as Record<string, unknown>[];
  return rows.map(rowToChild);
}

export function getChildById(id: string): Child | null {
  const db = getDb();
  const row = db.getFirstSync(
    'SELECT * FROM children WHERE id = ?', [id]
  ) as Record<string, unknown> | null;
  return row ? rowToChild(row) : null;
}

export function insertChild(child: Child): void {
  const db = getDb();
  db.runSync(
    `INSERT INTO children (id, name, sex, birth_date, standard_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [child.id, child.name, child.sex, child.birthDate,
     child.standardId, child.createdAt, child.updatedAt]
  );
}

export function updateChild(child: Child): void {
  const db = getDb();
  db.runSync(
    `UPDATE children
     SET name=?, sex=?, birth_date=?, standard_id=?, updated_at=?
     WHERE id=?`,
    [child.name, child.sex, child.birthDate,
     child.standardId, child.updatedAt, child.id]
  );
}

export function deleteChild(id: string): void {
  const db = getDb();
  // ON DELETE CASCADE 会级联删除测量记录
  db.runSync('DELETE FROM children WHERE id = ?', [id]);
}
