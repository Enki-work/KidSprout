export type Measurement = {
  id: string;
  childId: string;
  measuredAt: string;  // ISO date: "2025-11-05"
  heightCm: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

// 运行时计算视图（不入库，动态生成）
export type ComputedMeasurement = Measurement & {
  ageMonths: number;
  percentile?: number;
  zScore?: number;
  medianDeltaCm?: number;
};
