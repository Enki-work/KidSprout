/**
 * 身高记录全局状态
 * 按 childId 分组缓存，避免重复查询
 */

import { create } from 'zustand';
import { Measurement } from '@/types/measurement';
import * as repo from '@/db/measurement.repo';

type MeasurementStore = {
  // key: childId, value: 该孩子所有记录（按时间升序）
  byChild: Record<string, Measurement[]>;
  loadForChild:  (childId: string) => void;
  add:    (m: Measurement) => void;
  update: (m: Measurement) => void;
  remove: (id: string, childId: string) => void;
};

export const useMeasurementStore = create<MeasurementStore>((set) => ({
  byChild: {},

  loadForChild: (childId) => {
    const list = repo.getMeasurementsByChild(childId);
    set(s => ({ byChild: { ...s.byChild, [childId]: list } }));
  },

  add: (m) => {
    repo.insertMeasurement(m);
    set(s => {
      const prev = s.byChild[m.childId] ?? [];
      const next = [...prev, m].sort(
        (a, b) => a.measuredAt.localeCompare(b.measuredAt)
      );
      return { byChild: { ...s.byChild, [m.childId]: next } };
    });
  },

  update: (m) => {
    repo.updateMeasurement(m);
    set(s => {
      const prev = s.byChild[m.childId] ?? [];
      const next = prev.map(x => x.id === m.id ? m : x).sort(
        (a, b) => a.measuredAt.localeCompare(b.measuredAt)
      );
      return { byChild: { ...s.byChild, [m.childId]: next } };
    });
  },

  remove: (id, childId) => {
    repo.deleteMeasurement(id);
    set(s => ({
      byChild: {
        ...s.byChild,
        [childId]: (s.byChild[childId] ?? []).filter(m => m.id !== id),
      },
    }));
  },
}));
