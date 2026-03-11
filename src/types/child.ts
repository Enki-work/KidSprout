export type Sex = 'female' | 'male';

export type Child = {
  id: string;
  name: string;
  sex: Sex;
  birthDate: string;       // ISO date: "2021-08-15"
  standardId: string;      // 数据源 ID，如 "who"
  fatherHeightCm?: number;
  motherHeightCm?: number;
  createdAt: string;
  updatedAt: string;
};
