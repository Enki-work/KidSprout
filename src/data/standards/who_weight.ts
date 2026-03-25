/**
 * WHO 体重成長曲線データ（Weight-for-Age）
 *
 * データソース：
 * - 0〜60ヶ月：WHO Child Growth Standards 2006, Weight-for-age
 * - 61〜120ヶ月：WHO Reference 2007, Weight-for-age
 *
 * 単位：kg　百分位：P3 / P15 / P50 / P85 / P97
 */

import { GrowthStandardFile } from '@/types/growth';

// ─────────────────────────────────────────
// 男子（Male）0〜120ヶ月
// ─────────────────────────────────────────
export const WHO_WEIGHT_BOYS: GrowthStandardFile = {
  meta: {
    id: 'who_wfa_boys',
    source: 'WHO',
    version: 'WHO2006+WHO2007',
    indicator: 'weight-for-age',
    sex: 'male',
    ageMinMonths: 0,
    ageMaxMonths: 120,
    unit: 'kg',
    method: 'percentile',
  },
  rows: [
    // 0〜60ヶ月：WHO Child Growth Standards 2006
    { ageMonths:  0, p3:  2.5, p15:  2.9, p50:  3.3, p85:  3.9, p97:  4.4 },
    { ageMonths:  1, p3:  3.4, p15:  3.9, p50:  4.5, p85:  5.2, p97:  5.8 },
    { ageMonths:  2, p3:  4.3, p15:  4.9, p50:  5.6, p85:  6.3, p97:  7.1 },
    { ageMonths:  3, p3:  5.0, p15:  5.7, p50:  6.4, p85:  7.2, p97:  8.0 },
    { ageMonths:  4, p3:  5.6, p15:  6.2, p50:  7.0, p85:  7.8, p97:  8.7 },
    { ageMonths:  5, p3:  6.0, p15:  6.7, p50:  7.5, p85:  8.4, p97:  9.3 },
    { ageMonths:  6, p3:  6.4, p15:  7.1, p50:  7.9, p85:  8.8, p97:  9.8 },
    { ageMonths:  7, p3:  6.7, p15:  7.4, p50:  8.3, p85:  9.2, p97: 10.2 },
    { ageMonths:  8, p3:  6.9, p15:  7.7, p50:  8.6, p85:  9.6, p97: 10.5 },
    { ageMonths:  9, p3:  7.1, p15:  7.9, p50:  8.9, p85:  9.9, p97: 10.9 },
    { ageMonths: 10, p3:  7.4, p15:  8.2, p50:  9.2, p85: 10.2, p97: 11.2 },
    { ageMonths: 11, p3:  7.6, p15:  8.4, p50:  9.4, p85: 10.5, p97: 11.5 },
    { ageMonths: 12, p3:  7.8, p15:  8.6, p50:  9.6, p85: 10.7, p97: 11.8 },
    { ageMonths: 15, p3:  8.3, p15:  9.2, p50: 10.3, p85: 11.5, p97: 12.6 },
    { ageMonths: 18, p3:  8.8, p15:  9.8, p50: 11.0, p85: 12.2, p97: 13.4 },
    { ageMonths: 21, p3:  9.2, p15: 10.2, p50: 11.5, p85: 12.8, p97: 14.2 },
    { ageMonths: 24, p3:  9.7, p15: 10.8, p50: 12.2, p85: 13.6, p97: 15.0 },
    { ageMonths: 27, p3: 10.2, p15: 11.3, p50: 12.8, p85: 14.3, p97: 15.8 },
    { ageMonths: 30, p3: 10.5, p15: 11.7, p50: 13.3, p85: 14.8, p97: 16.4 },
    { ageMonths: 33, p3: 10.9, p15: 12.1, p50: 13.8, p85: 15.4, p97: 17.0 },
    { ageMonths: 36, p3: 11.3, p15: 12.5, p50: 14.3, p85: 15.9, p97: 17.6 },
    { ageMonths: 39, p3: 11.6, p15: 12.9, p50: 14.8, p85: 16.5, p97: 18.2 },
    { ageMonths: 42, p3: 12.1, p15: 13.4, p50: 15.3, p85: 17.0, p97: 18.8 },
    { ageMonths: 45, p3: 12.5, p15: 13.8, p50: 15.8, p85: 17.5, p97: 19.4 },
    { ageMonths: 48, p3: 12.7, p15: 14.2, p50: 16.3, p85: 18.1, p97: 20.0 },
    { ageMonths: 51, p3: 13.2, p15: 14.7, p50: 16.9, p85: 18.8, p97: 20.8 },
    { ageMonths: 54, p3: 13.5, p15: 15.0, p50: 17.2, p85: 19.2, p97: 21.2 },
    { ageMonths: 57, p3: 13.9, p15: 15.5, p50: 17.8, p85: 19.9, p97: 22.0 },
    { ageMonths: 60, p3: 14.1, p15: 15.8, p50: 18.3, p85: 20.5, p97: 22.6 },
    // 61〜120ヶ月：WHO Reference 2007
    { ageMonths: 72, p3: 16.0, p15: 18.0, p50: 21.2, p85: 24.5, p97: 27.5 },
    { ageMonths: 84, p3: 17.8, p15: 20.0, p50: 23.8, p85: 28.0, p97: 32.0 },
    { ageMonths: 96, p3: 19.5, p15: 22.2, p50: 26.7, p85: 32.0, p97: 37.5 },
    { ageMonths: 108, p3: 21.3, p15: 24.5, p50: 30.0, p85: 36.5, p97: 43.5 },
    { ageMonths: 120, p3: 23.2, p15: 27.0, p50: 33.7, p85: 41.5, p97: 50.0 },
  ],
};

// ─────────────────────────────────────────
// 女子（Female）0〜120ヶ月
// ─────────────────────────────────────────
export const WHO_WEIGHT_GIRLS: GrowthStandardFile = {
  meta: {
    id: 'who_wfa_girls',
    source: 'WHO',
    version: 'WHO2006+WHO2007',
    indicator: 'weight-for-age',
    sex: 'female',
    ageMinMonths: 0,
    ageMaxMonths: 120,
    unit: 'kg',
    method: 'percentile',
  },
  rows: [
    // 0〜60ヶ月：WHO Child Growth Standards 2006
    { ageMonths:  0, p3:  2.4, p15:  2.8, p50:  3.2, p85:  3.7, p97:  4.2 },
    { ageMonths:  1, p3:  3.2, p15:  3.6, p50:  4.2, p85:  4.8, p97:  5.5 },
    { ageMonths:  2, p3:  3.9, p15:  4.5, p50:  5.1, p85:  5.8, p97:  6.6 },
    { ageMonths:  3, p3:  4.5, p15:  5.2, p50:  5.8, p85:  6.6, p97:  7.5 },
    { ageMonths:  4, p3:  5.0, p15:  5.7, p50:  6.4, p85:  7.3, p97:  8.2 },
    { ageMonths:  5, p3:  5.4, p15:  6.1, p50:  6.9, p85:  7.8, p97:  8.8 },
    { ageMonths:  6, p3:  5.7, p15:  6.5, p50:  7.3, p85:  8.2, p97:  9.3 },
    { ageMonths:  7, p3:  6.0, p15:  6.8, p50:  7.6, p85:  8.6, p97:  9.7 },
    { ageMonths:  8, p3:  6.3, p15:  7.0, p50:  7.9, p85:  8.9, p97: 10.1 },
    { ageMonths:  9, p3:  6.5, p15:  7.3, p50:  8.2, p85:  9.2, p97: 10.4 },
    { ageMonths: 10, p3:  6.7, p15:  7.5, p50:  8.5, p85:  9.5, p97: 10.8 },
    { ageMonths: 11, p3:  6.9, p15:  7.7, p50:  8.7, p85:  9.8, p97: 11.1 },
    { ageMonths: 12, p3:  7.0, p15:  7.9, p50:  8.9, p85: 10.1, p97: 11.5 },
    { ageMonths: 15, p3:  7.6, p15:  8.5, p50:  9.6, p85: 10.9, p97: 12.4 },
    { ageMonths: 18, p3:  8.1, p15:  9.1, p50: 10.2, p85: 11.6, p97: 13.2 },
    { ageMonths: 21, p3:  8.6, p15:  9.6, p50: 10.9, p85: 12.4, p97: 14.0 },
    { ageMonths: 24, p3:  9.0, p15: 10.2, p50: 11.5, p85: 13.1, p97: 14.9 },
    { ageMonths: 27, p3:  9.5, p15: 10.7, p50: 12.1, p85: 13.7, p97: 15.6 },
    { ageMonths: 30, p3:  9.8, p15: 11.1, p50: 12.7, p85: 14.5, p97: 16.5 },
    { ageMonths: 33, p3: 10.3, p15: 11.6, p50: 13.3, p85: 15.2, p97: 17.3 },
    { ageMonths: 36, p3: 10.8, p15: 12.0, p50: 13.9, p85: 15.9, p97: 18.1 },
    { ageMonths: 39, p3: 11.1, p15: 12.5, p50: 14.5, p85: 16.6, p97: 18.9 },
    { ageMonths: 42, p3: 11.5, p15: 12.9, p50: 14.9, p85: 17.1, p97: 19.5 },
    { ageMonths: 45, p3: 11.9, p15: 13.4, p50: 15.5, p85: 17.8, p97: 20.3 },
    { ageMonths: 48, p3: 12.3, p15: 13.8, p50: 16.1, p85: 18.5, p97: 21.0 },
    { ageMonths: 51, p3: 12.6, p15: 14.3, p50: 16.6, p85: 19.1, p97: 21.8 },
    { ageMonths: 54, p3: 13.0, p15: 14.7, p50: 17.2, p85: 19.8, p97: 22.5 },
    { ageMonths: 57, p3: 13.3, p15: 15.1, p50: 17.7, p85: 20.5, p97: 23.4 },
    { ageMonths: 60, p3: 13.7, p15: 15.5, p50: 18.2, p85: 21.0, p97: 23.9 },
    // 61〜120ヶ月：WHO Reference 2007
    { ageMonths:  72, p3: 15.5, p15: 17.7, p50: 21.2, p85: 25.0, p97: 29.0 },
    { ageMonths:  84, p3: 17.3, p15: 19.8, p50: 24.0, p85: 29.0, p97: 34.5 },
    { ageMonths:  96, p3: 19.0, p15: 22.2, p50: 27.2, p85: 33.5, p97: 40.5 },
    { ageMonths: 108, p3: 21.0, p15: 24.8, p50: 30.8, p85: 38.5, p97: 47.5 },
    { ageMonths: 120, p3: 23.3, p15: 27.7, p50: 35.0, p85: 44.5, p97: 55.0 },
  ],
};
