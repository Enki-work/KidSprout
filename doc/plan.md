# 小芽成长 · 开发计划书

> 版本：v0.2 · 日期：2026-03-11
> 原则：**先能跑通，再逐步专业化**

---

## 目录

1. [产品定位](#1-产品定位)
2. [MVP 功能范围](#2-mvp-功能范围)
3. [信息架构与页面结构](#3-信息架构与页面结构)
4. [技术选型](#4-技术选型)
5. [项目目录结构](#5-项目目录结构)
6. [核心数据结构](#6-核心数据结构)
7. [WHO 数据 JSON 格式规范](#7-who-数据-json-格式规范)
8. [核心算法设计](#8-核心算法设计)
9. [成长曲线 UI 设计规范](#9-成长曲线-ui-设计规范)
10. [分阶段开发路线](#10-分阶段开发路线)
11. [后续迭代规划](#11-后续迭代规划)

---

## 1. 产品定位

### 一句话定义

> 把权威儿童身高标准，变成家长看得懂、能持续记录、能直观看趋势的成长工具。

### 核心任务（仅 3 个）

1. **管理孩子档案** — 建立每个孩子的基本信息
2. **记录身高** — 定期录入测量数据
3. **可视化成长曲线** — 在权威标准曲线上显示孩子位置与趋势

### 目标用户

- 0～18 岁儿童的家长
- 关注孩子发育、有定期测量习惯的家庭

---

## 2. MVP 功能范围

### P0（必须上线）

| 功能 | 说明 |
|------|------|
| 新建孩子档案 | 姓名、性别、出生日期 |
| 录入身高记录 | 日期 + 身高 cm |
| 成长曲线展示 | WHO 标准 5 条 percentile 线 + 用户测量点 |
| Percentile 计算 | 基于百分位插值估算 |
| 18 岁身高估算 | 沿当前 percentile 延伸到 18 岁 |

### P1（第二版迭代）

| 功能 | 说明 |
|------|------|
| 编辑 / 删除记录 | 修正录入错误 |
| 多孩子管理 | 支持家庭多个孩子独立档案 |
| 数据源切换 | WHO / 日本 / 中国标准切换 |
| 数据导出 | CSV / PDF 报告 |

### P2（长期规划）

| 功能 | 说明 |
|------|------|
| 云同步 | 多设备同步数据 |
| 家庭共享 | 父母共用同一份数据 |
| 定期提醒 | 到期测量提醒通知 |
| 医生报告 | 专业报告格式导出 |
| 体重曲线 | 扩展 BMI、体重指标 |

---

## 3. 信息架构与页面结构

### 3.1 页面流转

```
首页（孩子列表）
  ├─ 新建孩子档案
  └─ 孩子详情
       ├─ 曲线页（默认）
       ├─ 记录页
       │    ├─ 新增记录
       │    └─ 编辑记录
       └─ 分析页
```

### 3.2 各页面详细说明

#### A. 首页 / 孩子列表

**内容**
- 孩子卡片：姓名 / 当前年龄 / 最近身高 / 当前 percentile / 最近测量日期
- 右下角 FAB 按钮：新建孩子

**交互**
- 点击卡片 → 进入孩子详情页

---

#### B. 新建 / 编辑孩子档案

**MVP 字段**
- 姓名（必填）
- 性别：女孩 / 男孩（必填）
- 出生日期（必填）
- 数据标准（默认 WHO，可选）

**P1 扩展字段**
- 父亲身高（可选）
- 母亲身高（可选）
- 备注（可选）

---

#### C. 孩子详情页（顶部摘要 + Tab）

**顶部摘要区**
- 孩子姓名
- 当前年龄
- 最近身高
- 当前 percentile（如 P68）
- 预测成年身高（如 约 163 cm）

**Tab 页**
- 曲线（默认选中）
- 记录
- 分析

---

#### D. 曲线页（核心页）

**图表内容**
- 背景标准曲线：P3 / P15 / P50 / P85 / P97
- 孩子历史测量点（实心圆点）
- 测量点连线（实线）
- 当前最新点高亮显示
- 预测延伸线（虚线）

**Tooltip（点击任意点弹出）**
```
2025-11-05
4岁3个月
104.6 cm
P62 · 比中位数高 2.1 cm
```

**页面底部摘要卡**
```
当前位于：P72
接近曲线：P85
高于同龄儿童约 72%
```

**空状态**
- 显示标准成长曲线背景
- 中间提示：「还没有身高记录，先添加第一次测量吧」
- 按钮：「添加记录」

---

#### E. 记录页

**列表（时间倒序）**

| 日期 | 年龄 | 身高 | 百分位 | 备注 |
|------|------|------|--------|------|
| 2025-11-05 | 4岁3月 | 104.6 cm | P62 | — |

**交互**
- 顶部按钮「新增记录」
- 长按行 → 编辑 / 删除

---

#### F. 分析页

**展示内容**
- 当前身高 & percentile
- 高于同龄儿童百分比
- 比同龄中位数高/低多少 cm
- 最近 6 个月增长
- 最近 12 个月增长速度
- 18 岁身高估算（保守文案）

**示例**
```
当前身高：128.4 cm  ·  P68
高于同龄儿童约 68%
比中位数高：2.1 cm

最近 6 个月增长：2.8 cm
最近 12 个月增长：5.6 cm

按当前成长轨迹估算，18 岁预期身高约 163.8 cm
（仅供参考，受遗传、营养、睡眠等多种因素影响）
```

---

## 4. 技术选型

| 层级 | 技术 | 理由 |
|------|------|------|
| 框架 | Expo SDK 54 + React Native 0.81.5 + React 19.1.0 | 跨平台，开发效率高 |
| 路由 | Expo Router v6 | 文件路由，结构清晰 |
| 语言 | TypeScript ~5.9.2 | 类型安全，降低 bug |
| 图表 | react-native-svg 15.12.1 | 矢量绘制，完全可控 |
| 手势 | react-native-gesture-handler ~2.28.0 | 手势支持（缩放留待 P1） |
| 状态管理 | Zustand | 轻量，易学，适合本地记录型 app |
| 本地存储 | expo-sqlite ~16.0.10 | 结构化数据，可靠持久化 |
| 日期计算 | date-fns | 轻量，API 友好 |
| 多语言 | react-i18next | 成熟方案，支持五语言 |
| 数据验证 | Zod | 类型与验证统一 |

> **注意：** react-native-reanimated 4.x 与 Expo SDK 54 存在兼容问题，已移除。图表缩放（P1 阶段）优先用 SVG viewBox 重绘方案实现，无需动画库。

---

## 5. 项目目录结构

> ✅ 已创建的文件用 `✅` 标注，待创建用 `○` 标注。

```
KidSprout/
├─ app/                          # Expo Router 路由页面（仅编排，不放重逻辑）
│  ├─ _layout.tsx          ✅
│  ├─ index.tsx            ✅    # 目前：图表 Demo 页；后续改为孩子列表
│  ○ children/
│  │  ○ new.tsx                  # 新建孩子
│  │  └─ [childId]/
│  │     ○ index.tsx             # 孩子详情（Tab 外壳）
│  │     ○ chart.tsx             # 曲线页
│  │     ○ records.tsx           # 记录页
│  │     ○ analysis.tsx          # 分析页
│  │     ○ add-measurement.tsx   # 新增记录
│  │     └─ edit-measurement.tsx # 编辑记录
│  └─ ○ settings/
│     └─ ○ index.tsx             # 设置页
│
├─ src/
│  ├─ components/
│  │  ├─ chart/            ✅    # 图表组件（已完成）
│  │  │  ├─ GrowthChart.tsx      ✅  # 主图表（含 Tooltip）
│  │  │  ├─ ChartAxes.tsx        ✅  # 坐标轴 + 网格线
│  │  │  ├─ PercentileLines.tsx  ✅  # 标准百分位曲线
│  │  │  ├─ MeasurementSeries.tsx✅  # 用户测量点 + 连线
│  │  │  ├─ chartUtils.ts        ✅  # 坐标映射工具函数
│  │  │  ○ PredictionLine.tsx        # 预测虚线（阶段五）
│  │  │  └─ ○ ChartTooltip.tsx       # 独立 Tooltip 组件（阶段四重构）
│  │  ○ child/
│  │  │  ○ ChildCard.tsx             # 首页孩子卡片
│  │  │  ○ ChildSummary.tsx          # 详情页顶部摘要
│  │  │  └─ ○ EmptyMeasurements.tsx  # 无记录空状态
│  │  ○ forms/
│  │  │  ○ ChildForm.tsx             # 新建/编辑孩子表单
│  │  │  └─ ○ MeasurementForm.tsx    # 录入身高表单
│  │  └─ ○ common/
│  │     ○ AppButton.tsx
│  │     ○ AppInput.tsx
│  │     ○ AppCard.tsx
│  │     └─ ○ SectionHeader.tsx
│  │
│  ├─ data/
│  │  └─ standards/
│  │     ├─ japan.ts       ✅    # 日本データ（0-69m 幼児調査 + 72-204m 学校統計）
│  │     ○ who.ts                # WHO データ（阶段二）
│  │     └─ ○ china.ts           # 中国データ（后续迭代）
│  │
│  ○ db/                         # 本地数据库层（阶段三）
│  │  ○ sqlite.ts
│  │  ○ schema.ts
│  │  ○ child.repo.ts
│  │  └─ ○ measurement.repo.ts
│  │
│  ○ hooks/                      # 自定义 Hook（阶段三起）
│  │  ○ useChild.ts
│  │  ○ useMeasurements.ts
│  │  ○ useGrowthStandard.ts
│  │  └─ ○ usePercentile.ts
│  │
│  ├─ services/
│  │  └─ growth/           ✅
│  │     ├─ age.ts               ✅  # 月龄计算
│  │     ├─ interpolation.ts     ✅  # 线性插值
│  │     ├─ percentile.ts        ✅  # 百分位估算（插值法）
│  │     ├─ prediction.ts        ✅  # 18 岁身高估算（骨架）
│  │     └─ ○ zscore.ts              # LMS z-score 计算（阶段二）
│  │
│  ○ store/                      # Zustand 全局状态（阶段三）
│  │  ○ childStore.ts
│  │  ○ measurementStore.ts
│  │  └─ ○ settingsStore.ts
│  │
│  ├─ types/               ✅
│  │  ├─ child.ts          ✅
│  │  ├─ growth.ts         ✅
│  │  └─ measurement.ts    ✅
│  │
│  ├─ constants/           ✅
│  │  ├─ colors.ts         ✅    # 主题色 #4CAF82
│  │  ├─ chart.ts          ✅    # 图表常量（padding 等）
│  │  └─ ○ standards.ts          # 数据源元数据
│  │
│  └─ ○ utils/
│     ○ date.ts
│     ○ number.ts
│     └─ ○ format.ts
│
├─ assets/
├─ doc/                    ✅
├─ CLAUDE.md               ✅
├─ README.md               ✅
├─ package.json            ✅
└─ tsconfig.json           ✅
```

---

## 6. 核心数据结构

### 6.1 业务类型

```ts
// src/types/child.ts
export type Sex = 'female' | 'male';

export type Child = {
  id: string;
  name: string;
  sex: Sex;
  birthDate: string;          // ISO date: "2021-08-15"
  standardId: string;         // 使用的数据源 ID
  fatherHeightCm?: number;
  motherHeightCm?: number;
  createdAt: string;
  updatedAt: string;
};
```

```ts
// src/types/measurement.ts
export type Measurement = {
  id: string;
  childId: string;
  measuredAt: string;         // ISO date: "2025-11-05"
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
```

```ts
// src/types/growth.ts  ✅ 已实现
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
  p10?: number;   // 日本データで使用
  p15?: number;   // WHO データ用（予約）
  p25?: number;   // 日本データで使用
  p50: number;    // 必須
  p75?: number;   // 日本データで使用
  p85?: number;   // WHO データ用（予約）
  p90?: number;   // 日本データで使用
  p97?: number;
  l?: number;
  m?: number;
  s?: number;
};

export type GrowthStandardFile = {
  meta: GrowthMeta;
  rows: GrowthRow[];
};
```

---

## 7. データソース規範

### 7.1 日本データ（✅ 実装済み）

`src/data/standards/japan.ts` に TypeScript 定数として格納。

**データ構成：**
- **0〜69ヶ月**：厚生労働省 令和5年（2023年）乳幼児身体発育調査（表02）
  区間中央値を `ageMonths` として使用（0, 1, 1.5, 2.5 ... 69）
- **72〜204ヶ月**：文部科学省 令和7年（2025年）学校保健統計調査
  各学年 4月時点の月齢（72, 84, 96 ... 204）

**接続方針：**
- 69ヶ月（幼児調査）→ 72ヶ月（学校統計）でデータソースを切替
- 60ヶ月・75ヶ月の重複エントリは削除済み（カーブのジャンプを回避）
- 利用百分位：P3 / P10 / P25 / P50 / P75 / P90 / P97

### 7.2 WHO データ（阶段二で追加予定）

`src/data/standards/who.ts` に同一フォーマットで格納予定。

百分位フィールド：P3 / P15 / P50 / P85 / P97（WHO 公式値）

### 7.3 hybrid フォーマット（阶段二 LMS 実装時）

```ts
// LMS + percentile 両方を持つ行（精密計算用）
{
  ageMonths: 61,
  l: 1.0, m: 109.6, s: 0.0400,  // LMS: z-score 計算用
  p3: 100.6, p15: 104.7, p50: 109.6, p85: 114.6, p97: 118.8  // 描画用
}
```

> 描画には percentile フィールドを使用、精密計算には LMS を使用。両者共存で動的反推不要。

---

## 8. 核心算法设计

### 8.1 月龄计算（`services/growth/age.ts`）

```ts
/**
 * 计算月龄（小数）
 * 内部统一使用月龄作为时间基准
 */
export function getAgeInMonths(birthDate: Date, measuredAt: Date): number {
  const ms = measuredAt.getTime() - birthDate.getTime();
  const days = ms / (1000 * 60 * 60 * 24);
  return days / 30.4375;
}
```

### 8.2 线性插值（`services/growth/interpolation.ts`）

```ts
/** 通用线性插值 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** 按月龄插值出对应行数据 */
export function interpolateGrowthRow(
  ageMonths: number,
  rows: GrowthRow[]
): GrowthRow {
  const sorted = [...rows].sort((a, b) => a.ageMonths - b.ageMonths);
  const lower = [...sorted].reverse().find(r => r.ageMonths <= ageMonths);
  const upper = sorted.find(r => r.ageMonths > ageMonths);

  if (!lower) return upper!;
  if (!upper) return lower;

  const t = (ageMonths - lower.ageMonths) / (upper.ageMonths - lower.ageMonths);

  return {
    ageMonths,
    p3:  lower.p3  !== undefined ? lerp(lower.p3,  upper.p3  ?? lower.p3,  t) : undefined,
    p15: lower.p15 !== undefined ? lerp(lower.p15, upper.p15 ?? lower.p15, t) : undefined,
    p50: lerp(lower.p50, upper.p50, t),
    p85: lower.p85 !== undefined ? lerp(lower.p85, upper.p85 ?? lower.p85, t) : undefined,
    p97: lower.p97 !== undefined ? lerp(lower.p97, upper.p97 ?? lower.p97, t) : undefined,
    l:   lower.l   !== undefined ? lerp(lower.l,   upper.l   ?? lower.l,   t) : undefined,
    m:   lower.m   !== undefined ? lerp(lower.m,   upper.m   ?? lower.m,   t) : undefined,
    s:   lower.s   !== undefined ? lerp(lower.s,   upper.s   ?? lower.s,   t) : undefined,
  };
}
```

### 8.3 百分位估算 — MVP 插值法（`services/growth/percentile.ts`）

**原理：** 找到身高所在的 percentile 区间，线性插值。

```ts
type Band = { percentile: number; value: number };

export function estimatePercentileFromBands(
  heightCm: number,
  bands: Band[]
): number {
  const sorted = [...bands].sort((a, b) => a.percentile - b.percentile);

  if (heightCm <= sorted[0].value) return sorted[0].percentile;
  if (heightCm >= sorted.at(-1)!.value) return sorted.at(-1)!.percentile;

  for (let i = 0; i < sorted.length - 1; i++) {
    const lo = sorted[i];
    const hi = sorted[i + 1];
    if (heightCm >= lo.value && heightCm <= hi.value) {
      const t = (heightCm - lo.value) / (hi.value - lo.value);
      return lo.percentile + t * (hi.percentile - lo.percentile);
    }
  }

  return sorted[0].percentile;
}

/** 从 GrowthRow 构建 Band 数组 */
export function rowToBands(row: GrowthRow): Band[] {
  return [
    { percentile: 3,  value: row.p3!  },
    { percentile: 15, value: row.p15! },
    { percentile: 50, value: row.p50  },
    { percentile: 85, value: row.p85! },
    { percentile: 97, value: row.p97! },
  ].filter(b => b.value !== undefined);
}
```

### 8.4 百分位计算 — 第二阶段 LMS 法（`services/growth/zscore.ts`）

```ts
/** LMS 法计算 z-score */
export function calcZScore(x: number, l: number, m: number, s: number): number {
  if (Math.abs(l) < 1e-6) {
    return Math.log(x / m) / s;
  }
  return (Math.pow(x / m, l) - 1) / (l * s);
}

/** z-score → percentile（0-100） */
export function zScoreToPercentile(z: number): number {
  return normalCDF(z) * 100;
}

function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))));
  return z > 0 ? 1 - p : p;
}
```

### 8.5 18 岁身高估算（`services/growth/prediction.ts`）

**原理：** 假设孩子沿当前 percentile 继续成长，取 18 岁（216 月龄）对应该 percentile 的身高。

```ts
/**
 * 估算 18 岁身高
 * @param currentPercentile 当前百分位（0-100）
 * @param rows              标准数据行（需包含到 216 月龄）
 */
export function predictAdultHeight(
  currentPercentile: number,
  rows: GrowthRow[]
): number {
  const adultRow = interpolateGrowthRow(216, rows);
  const bands = rowToBands(adultRow);
  // percentile → 对应身高（反向插值）
  const sorted = [...bands].sort((a, b) => a.percentile - b.percentile);

  if (currentPercentile <= sorted[0].percentile) return sorted[0].value;
  if (currentPercentile >= sorted.at(-1)!.percentile) return sorted.at(-1)!.value;

  for (let i = 0; i < sorted.length - 1; i++) {
    const lo = sorted[i];
    const hi = sorted[i + 1];
    if (currentPercentile >= lo.percentile && currentPercentile <= hi.percentile) {
      const t = (currentPercentile - lo.percentile) / (hi.percentile - lo.percentile);
      return lo.value + t * (hi.value - lo.value);
    }
  }

  return sorted[0].value;
}
```

> **文案要求（强制）：** 预测结果页面必须包含以下免责说明：
> *「仅供参考，青春期发育、遗传、营养、睡眠与健康状况都会影响最终身高。」*

---

## 9. 成长曲线 UI 设计规范

### 9.1 颜色方案

| 元素 | 颜色 | 说明 |
|------|------|------|
| 主色 | `#4CAF82` | 绿芽色 |
| P3 / P97 | `#C8C8D0` | 浅灰 |
| P15 / P85 | `#A0C4E8` | 浅蓝 |
| P50 | `#3A7EC4` | 深蓝（中位数） |
| 用户点线 | `#4CAF82` | 主色绿 |
| 预测虚线 | `#F5A623` | 橙色虚线 |
| 背景 | `#FFFFFF` | 白色 |
| 次背景 | `#F7F8FA` | 极浅灰 |

### 9.2 曲线页布局

```
┌─────────────────────────────────┐
│  孩子信息卡片                     │
│  姓名 · 年龄 · 最近身高 · P68     │
├─────────────────────────────────┤
│  时间范围：[0-5岁] [5-10岁] [全部] │
├─────────────────────────────────┐
│                                 │
│     成 长 曲 线 图 表              │
│  Y轴: 身高cm                     │
│  X轴: 年龄                       │
│                                 │
│  背景: P3/P15/P50/P85/P97        │
│  前景: 用户测量点 + 连线 + 预测    │
│                                 │
├─────────────────────────────────┤
│  图例: P3 P15 P50 P85 P97 ● 我   │
├─────────────────────────────────┤
│  当前 P72 · 高于同龄约 72%        │
│  比中位数高 2.1cm · 估算成年 165cm │
└─────────────────────────────────┘
```

### 9.3 坐标轴规范

**X 轴（时间）**
- 内部统一使用月龄（整数）
- 显示转换：`61月 → 5岁1个月` / 整年处理显示为 `5岁`
- 间隔：0-24m 按 3 月，24m 以后按 12 月

**Y 轴（身高）**
- 自动计算范围：`min(P3) - 5cm` ～ `max(P97) + 5cm`
- 刻度间隔：10 cm

### 9.4 交互

| 操作 | 响应 |
|------|------|
| 点击测量点 | 显示 Tooltip（日期 / 年龄 / 身高 / percentile） |
| 长按图表空白处 | 显示十字准星，读取当前坐标对应数值 |
| 双指缩放 | P1 阶段实现，MVP 暂不支持 |

### 9.5 实线 vs 虚线区分

```
历史实测：实线 + 实心圆点 ●────●────●
预测未来：虚线 + 空心圆点 ○- - -○- - -○
```

---

## 10. 分阶段开发路线

### 阶段一：图表骨架 ✅ 已完成

- [x] Expo SDK 54 项目初始化，配置 TypeScript + Expo Router
- [x] 建立 `src/` 目录结构
- [x] 整合日本真实数据（令和5年幼児 + 令和7年学校統計）
- [x] 实现 `GrowthChart.tsx`（含 Tooltip）
- [x] 绘制 7 条 percentile 曲线（P3/P10/P25/P50/P75/P90/P97）
- [x] 显示示例用户测量点 + 连线
- [x] 修复两数据源衔接处的曲线跳动问题

**验收：** ✅ 图表在模拟器正常显示，曲线平滑

---

### 阶段二：数据层完善（下一阶段）

- [ ] 实现 `src/data/standards/who.ts`（WHO 标准数据）
- [ ] 实现 `zscore.ts` LMS 精确百分位计算
- [ ] 完善 `interpolateGrowthRow()` 支持数据源切换
- [ ] 图表支持日本 / WHO 数据源切换

**验收：** 切换数据源后曲线正确重绘

---

### 阶段三：孩子档案 + 记录

- [ ] 配置 expo-sqlite，建表（children / measurements）
- [ ] 实现 `child.repo.ts` / `measurement.repo.ts`
- [ ] 实现 `ChildForm.tsx` 新建孩子
- [ ] 实现 `MeasurementForm.tsx` 录入身高
- [ ] 首页孩子列表展示（ChildCard）
- [ ] Zustand store：childStore / measurementStore

**验收：** 可新建孩子，录入身高，列表显示正确

---

### 阶段四：百分位计算 + 图表整合

- [ ] `estimatePercentileFromBands()` 与真实用户数据对接
- [ ] 将用户测量点通过 `getAgeInMonths()` 映射到图表
- [ ] Tooltip 显示：日期 / 月龄 / 身高 / 百分位
- [ ] 底部摘要卡片（当前 percentile / 与中位数差距）

**验收：** 录入身高后，点在曲线图上位置正确，百分位显示合理

---

### 阶段五：分析页 + 预测

- [ ] `predictAdultHeight()` 与真实孩子档案对接
- [ ] 分析页数据统计展示
- [ ] 增长速度计算（最近 6m / 12m）
- [ ] 预测虚线 `PredictionLine.tsx`

**验收：** 分析页所有数据展示完整，预测有免责说明

---

### 阶段六：打磨 & 多语言

- [ ] 配置 react-i18next，支持中 / 日 / 英 / 西 / 韩
- [ ] 空状态设计（EmptyMeasurements）
- [ ] Loading 状态
- [ ] 错误处理
- [ ] iOS / Android 真机测试

**验收：** 语言切换正常，真机体验流畅

---

## 11. 后续迭代规划

### v1.1
- 多孩子管理
- 编辑 / 删除记录
- 数据源切换（日本 / 中国标准）

### v1.2
- 0-60 月龄数据支持
- LMS 精确 percentile 计算
- 双指缩放图表

### v1.3
- 数据导出（CSV）
- 提醒通知

### v2.0
- 云同步
- 家庭共享
- 体重 / BMI 曲线
- 医生报告导出
- macOS（Electron）发布

---

*文档维护：随开发进度更新，重要决策变更需同步至此文档。*
