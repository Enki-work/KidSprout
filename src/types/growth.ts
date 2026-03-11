import { Sex } from './child';

export type GrowthMeta = {
  id: string;
  source: 'WHO' | 'JAPAN' | 'CHINA';
  version: string;
  indicator: 'height-for-age';
  sex: Sex;
  ageMinMonths: number;
  ageMaxMonths: number;
  unit: 'cm';
  method: 'percentile' | 'lms' | 'hybrid';
};

export type GrowthRow = {
  ageMonths: number;
  p3?: number;
  p15?: number;
  p50: number;
  p85?: number;
  p97?: number;
  l?: number;
  m?: number;
  s?: number;
};

export type GrowthStandardFile = {
  meta: GrowthMeta;
  rows: GrowthRow[];
};
