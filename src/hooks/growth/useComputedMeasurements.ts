import { useMemo } from 'react';
import { Measurement, ComputedMeasurement } from '@/types/measurement';
import { GrowthRow } from '@/types/growth';
import { getAgeInMonths } from '@/services/growth/age';
import { getPercentile, getMedianHeight } from '@/services/growth/percentile';

/**
 * 将原始测量记录转换为带百分位、月龄、与中位数差距的计算视图
 */
export function useComputedMeasurements(
  measurements: Measurement[],
  birthDate: string,
  rows: GrowthRow[],
): ComputedMeasurement[] {
  return useMemo(() => {
    return measurements.map(m => {
      const ageMonths = getAgeInMonths(new Date(birthDate), new Date(m.measuredAt));
      const percentile = getPercentile(ageMonths, m.heightCm, rows);
      const median = getMedianHeight(ageMonths, rows);
      const medianDeltaCm = median !== undefined
        ? Math.round((m.heightCm - median) * 10) / 10
        : undefined;
      return { ...m, ageMonths, percentile, medianDeltaCm };
    });
  }, [measurements, birthDate, rows]);
}
