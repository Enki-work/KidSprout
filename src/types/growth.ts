import { Sex } from './child';

export type GrowthMeta = {
  id: string;
  source: 'WHO' | 'JAPAN' | 'CHINA';
  version: string;
  indicator: 'height-for-age' | 'weight-for-age';
  sex: Sex;
  ageMinMonths: number;
  ageMaxMonths: number;
  unit: 'cm' | 'kg';
  method: 'percentile' | 'lms' | 'hybrid';
};

export type GrowthRow = {
  ageMonths: number;
  p3?: number;
  p10?: number;
  p15?: number;
  p25?: number;
  p50: number;
  p75?: number;
  p85?: number;
  p90?: number;
  p97?: number;
  l?: number;
  m?: number;
  s?: number;
};

export type GrowthStandardFile = {
  meta: GrowthMeta;
  rows: GrowthRow[];
};
