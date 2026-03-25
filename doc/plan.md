# 小芽成长 · 开发计划书

> 版本：v0.7 · 日期：2026-03-25
> 原则：**先能跑通，再逐步专业化**

---

## 目录

1. [产品定位](#1-产品定位)
2. [功能范围](#2-功能范围)
3. [信息架构与页面结构](#3-信息架构与页面结构)
4. [技术选型](#4-技术选型)
5. [项目目录结构](#5-项目目录结构)
6. [核心数据结构](#6-核心数据结构)
7. [数据源规范](#7-数据源规范)
8. [核心算法设计](#8-核心算法设计)
9. [成长曲线 UI 设计规范](#9-成长曲线-ui-设计规范)
10. [内购功能架构](#10-内购功能架构)
11. [商店内购元数据配置](#11-商店内购元数据配置)
12. [国际化规范](#12-国际化规范)
13. [分阶段开发路线](#13-分阶段开发路线)

---

## 1. 产品定位

### 一句话定义

> 把权威儿童成长标准，变成家长看得懂、能持续记录、能直观看趋势的成长工具。

### 核心任务

1. **管理孩子档案** — 建立每个孩子的基本信息
2. **记录身高 / 体重** — 定期录入测量数据
3. **可视化成长曲线** — 在权威标准曲线上显示孩子位置与趋势

### 目标用户

- 0～18 岁儿童的家长
- 关注孩子发育、有定期测量习惯的家庭

---

## 2. 功能范围

### P0（已上线）

| 功能            | 说明                                          | 状态 |
| --------------- | --------------------------------------------- | ---- |
| 新建孩子档案    | 姓名、性别、出生日期                          | ✅   |
| 录入身高记录    | 日期 + 身高 cm                                | ✅   |
| 成长曲线展示    | 5 条 percentile 线 + 用户测量点               | ✅   |
| Percentile 计算 | 基于百分位插值估算                            | ✅   |
| 18 岁身高估算   | 沿当前 percentile 延伸                        | ✅   |
| 多孩子管理      | 支持家庭多个孩子独立档案                      | ✅   |
| 数据源切换      | WHO / 日本 / 中国 标准                        | ✅   |
| 多语言          | 中文 / 繁中 / 日語 / English / Español / 한국어 | ✅ |

### P1（当前迭代 · v0.7）

| 功能             | 说明                                                         | 状态      |
| ---------------- | ------------------------------------------------------------ | --------- |
| 首页 BottomSheet | 点击儿童卡片弹出选择面板（身高 / 体重）                      | 🔨 进行中 |
| 体重曲线功能     | 全套体重记录 + 成长曲线可视化（WHO / 日本 / 中国标准）       | 🔨 进行中 |
| 买断制内购       | 体重功能需购买解锁，未购买时显示 💎 锁定状态                 | 🔨 进行中 |

### P2（长期规划）

| 功能     | 说明                           |
| -------- | ------------------------------ |
| 云同步   | 多设备同步数据                 |
| 家庭共享 | 父母共用同一份数据             |
| 定期提醒 | 到期测量提醒通知               |
| 医生报告 | 专业报告格式导出               |
| BMI 曲线 | 基于身高+体重自动计算 BMI 百分位 |

---

## 3. 信息架构与页面结构

### 3.1 页面流转（v0.7 更新）

```
首页（孩子列表）
  ├─ 点击孩子卡片 → BottomSheet 弹出
  │    ├─ 📏 身高 → 孩子身高详情页（现有）
  │    └─ ⚖️ 体重（💎 锁定 / 已解锁）→ 孩子体重详情页（新建）
  ├─ 新建孩子档案
  └─ 侧边抽屉（设置 / 关于）

孩子身高详情页（已有）
  ├─ 曲线标签
  ├─ 记录标签
  ├─ 分析标签
  └─ FAB → 添加身高记录

孩子体重详情页（新建）
  ├─ 曲线标签
  ├─ 记录标签
  ├─ 分析标签（无 18 岁预测）
  └─ FAB → 添加体重记录
```

### 3.2 BottomSheet 设计

**触发：** 首页点击任意儿童卡片

**UI 结构：**

```
╔══════════════════════════════╗
║  ▬▬▬（拖拽条装饰）           ║
║  小明                        ║  ← 儿童姓名
╠══════════════════════════════╣
║  📏  身高                    ║  ← 绿色 #4CAF82，可点击
║  ⚖️  体重          💎        ║  ← 未购买：文字灰 #CCC，💎 黄 #F5C518
╚══════════════════════════════╝
```

**行为：**

- 点击身高 → 关闭 Sheet → 跳转 `/children/{id}`（现有页面）
- 点击体重（已购买）→ 关闭 Sheet → 跳转 `/children/{id}/weight`
- 点击体重（未购买）→ 显示 Alert 引导购买
- 点击遮罩 → 关闭

**实现方案：** Modal + Animated（与 AppDrawer 同款，无需额外依赖）

### 3.3 体重详情页（新建）

与身高详情页对称，主要区别：

| 项目       | 身高页                 | 体重页                          |
| ---------- | ---------------------- | ------------------------------- |
| 标题       | `小明 身高`            | `小明 体重`                     |
| 数值单位   | cm                     | kg                              |
| 分析·预测卡 | 显示 18 岁预测         | **不显示**（无可靠体重预测）    |
| LMS 数据源 | `getStandardFile()`    | `getWeightStandardFile()`       |
| FAB        | ＋ 添加身高            | ＋ 添加体重                     |

---

## 4. 技术选型

| 层级     | 技术                                              | 理由                           |
| -------- | ------------------------------------------------- | ------------------------------ |
| 框架     | Expo SDK 54 + React Native 0.81.5 + React 19.1.0  | 跨平台，开发效率高             |
| 路由     | Expo Router v6                                    | 文件路由，结构清晰             |
| 语言     | TypeScript ~5.9.2                                 | 类型安全，降低 bug             |
| 图表     | react-native-svg 15.12.1                          | 矢量绘制，完全可控             |
| 手势     | react-native-gesture-handler ~2.28.0              | 手势支持                       |
| 状态管理 | Zustand                                           | 轻量，易学，适合本地记录型 app |
| 本地存储 | expo-sqlite ~16.0.10                              | 结构化数据，可靠持久化         |
| 日期计算 | date-fns                                          | 轻量，API 友好                 |
| 多语言   | react-i18next                                     | 成熟方案，支持六语言           |
| 数据验证 | Zod                                               | 类型与验证统一                 |
| **内购** | **expo-in-app-purchases**（待接入）               | Expo 原生支持，兼容 iOS/Android |

> **注意：** react-native-reanimated 4.x 与 Expo SDK 54 存在兼容问题，已移除。BottomSheet 使用 React Native 内置 `Modal` + `Animated` 实现（与 AppDrawer 同款方案）。

---

## 5. 项目目录结构

> ✅ 已完成　🔨 本次新增

```
KidSprout/
├─ app/
│  ├─ _layout.tsx                  ✅
│  ├─ index.tsx                    ✅  首页（v0.7 新增 BottomSheet 状态）
│  └─ children/
│     ├─ new.tsx                   ✅
│     └─ [childId]/
│        ├─ index.tsx              ✅  身高详情页
│        ├─ edit.tsx               ✅
│        ├─ add-measurement.tsx    ✅  添加身高
│        ├─ chart-fullscreen.tsx   ✅
│        ├─ weight.tsx             🔨  体重详情页（新建）
│        ├─ add-weight-measurement.tsx  🔨  添加体重（新建）
│        └─ weight-chart-fullscreen.tsx 🔨  体重全屏图表（新建）
│
├─ src/
│  ├─ components/
│  │  ├─ chart/                    ✅
│  │  ├─ debug/                    ✅
│  │  └─ common/
│  │     ├─ AppDrawer.tsx          ✅
│  │     ├─ EmptyState.tsx         ✅
│  │     └─ ChildActionBottomSheet.tsx  🔨  选择面板（新建）
│  │
│  ├─ data/
│  │  └─ standards/
│  │     ├─ japan.ts               ✅  日本身高
│  │     ├─ who.ts                 ✅  WHO 身高
│  │     ├─ china.ts               ✅  中国身高
│  │     ├─ japan_weight.ts        🔨  日本体重（新建）
│  │     ├─ who_weight.ts          🔨  WHO 体重（新建）
│  │     └─ china_weight.ts        🔨  中国体重（新建）
│  │
│  ├─ db/
│  │  ├─ sqlite.ts                 ✅  新增 weight_kg 列幂等迁移
│  │  ├─ child.repo.ts             ✅
│  │  ├─ measurement.repo.ts       ✅  新增 weightKg 字段支持
│  │  └─ settings.repo.ts          ✅
│  │
│  ├─ hooks/
│  │  ├─ growth/
│  │  │  └─ useComputedMeasurements.ts  ✅
│  │  ├─ useFormatAge.ts           ✅
│  │  ├─ useAppRating.ts           ✅
│  │  └─ usePurchase.ts            🔨  内购 Hook（新建）
│  │
│  ├─ store/
│  │  ├─ childStore.ts             ✅
│  │  ├─ measurementStore.ts       ✅
│  │  ├─ settingsStore.ts          ✅
│  │  └─ purchaseStore.ts          🔨  内购状态（新建）
│  │
│  ├─ types/
│  │  ├─ child.ts                  ✅
│  │  ├─ growth.ts                 ✅  indicator 扩展 weight-for-age
│  │  └─ measurement.ts            ✅  新增 weightKg?: number
│  │
│  ├─ constants/
│  │  ├─ colors.ts                 ✅
│  │  ├─ chart.ts                  ✅
│  │  └─ standards.ts              ✅  新增 getWeightStandardFile()
│  │
│  └─ i18n/
│     └─ locales/
│        ├─ zh.json                ✅  新增 weight / purchase key
│        ├─ zh-Hant.json           ✅  同步
│        ├─ ja.json                ✅  同步
│        ├─ en.json                ✅  同步
│        ├─ es.json                ✅  同步
│        └─ ko.json                ✅  同步
```

---

## 6. 核心数据结构

### 6.1 业务类型

```ts
// src/types/child.ts（无变化）
export type Sex = "female" | "male";
export type Child = {
  id: string;
  name: string;
  sex: Sex;
  birthDate: string;
  standardId: string;
  fatherHeightCm?: number;
  motherHeightCm?: number;
  createdAt: string;
  updatedAt: string;
};
```

```ts
// src/types/measurement.ts（v0.7 新增 weightKg）
export type Measurement = {
  id: string;
  childId: string;
  measuredAt: string;   // ISO date: "2025-11-05"
  heightCm: number;
  weightKg?: number;    // 🔨 新增：体重（可选，向后兼容）
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
// src/types/growth.ts（v0.7 扩展 indicator 和 unit）
export type GrowthMeta = {
  id: string;
  source: 'WHO' | 'JAPAN' | 'CHINA';
  version: string;
  indicator: 'height-for-age' | 'weight-for-age';  // 🔨 扩展
  sex: Sex;
  ageMinMonths: number;
  ageMaxMonths: number;
  unit: 'cm' | 'kg';   // 🔨 扩展
  method: 'percentile' | 'lms' | 'hybrid';
};

// GrowthRow / GrowthStandardFile 无变化
```

### 6.2 数据库结构

```sql
-- v0.7 迁移：measurements 表新增 weight_kg 列
-- 采用 PRAGMA table_info 检测，幂等执行（已有列则跳过）
ALTER TABLE measurements ADD COLUMN weight_kg REAL;

-- settings 表新增内购状态持久化
-- key: 'purchase_weight', value: '1'（购买成功后写入）
```

---

## 7. 数据源规范

### 7.1 身高数据（已实现）

| 文件 | 数据来源 | 月龄范围 |
|------|---------|---------|
| `japan.ts` | 厚生労働省乳幼児発育調査 + 文部科学省学校保健統計 | 0～204m |
| `who.ts` | WHO 2006 + WHO 2007 | 0～228m |
| `china.ts` | 中国 WS/T 423—2022 + WS/T 612—2018 | 0～216m |

### 7.2 体重数据（v0.7 新增）

与身高数据格式相同，`indicator: 'weight-for-age'`，`unit: 'kg'`。

| 文件 | 数据来源 | 月龄范围 | 百分位 |
|------|---------|---------|--------|
| `who_weight.ts` | WHO Child Growth Standards 2006 (0-60m) + WHO Reference 2007 (61-120m) | 0～120m | P3/P15/P50/P85/P97 |
| `japan_weight.ts` | 厚生労働省乳幼児発育調査 + 文部科学省学校保健統計 | 0～204m | P3/P10/P25/P50/P75/P90/P97 |
| `china_weight.ts` | 中国国家卫生健康委员会 WS/T 423 | 0～216m | P3/P15/P50/P85/P97 |

> 注：体重数据上限月龄通常低于身高（WHO 体重仅到 120m = 10 岁），页面显示以数据上限为准。

### 7.3 hybrid 格式（阶段二 LMS 实装时）

```ts
// LMS + percentile 两者并存（精密计算用）
{
  ageMonths: 61,
  l: 1.0, m: 109.6, s: 0.0400,  // LMS：z-score 计算用
  p3: 100.6, p15: 104.7, p50: 109.6, p85: 114.6, p97: 118.8  // 描画用
}
```

### 7.4 数据源注册（`src/constants/standards.ts`）

```ts
// 现有：getStandardFile(standardId, sex) → 身高数据
// 新增：getWeightStandardFile(standardId, sex) → 体重数据
export function getWeightStandardFile(
  standardId: StandardId,
  sex: Sex,
): GrowthStandardFile { ... }
```

---

## 8. 核心算法设计

### 8.1 月龄计算（`services/growth/age.ts`）

```ts
export function getAgeInMonths(birthDate: Date, measuredAt: Date): number {
  const ms = measuredAt.getTime() - birthDate.getTime();
  const days = ms / (1000 * 60 * 60 * 24);
  return days / 30.4375;
}
```

### 8.2 线性插值（`services/growth/interpolation.ts`）

```ts
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function interpolateGrowthRow(
  ageMonths: number,
  rows: GrowthRow[],
): GrowthRow { ... }
```

### 8.3 百分位估算（`services/growth/percentile.ts`）

```ts
export function estimatePercentileFromBands(
  heightCm: number,
  bands: Band[],
): number { ... }

export function rowToBands(row: GrowthRow): Band[] { ... }
```

### 8.4 体重百分位计算

体重百分位**完全复用**身高的计算链路：

```
weightKg → interpolateGrowthRow() → rowToBands() → estimatePercentileFromBands()
```

`useComputedMeasurements` hook 接口已是通用设计（接受任意 LMS/percentile 行数组），体重页只需传入体重 LMS 数据即可，无需修改 hook 本身。

### 8.5 成年身高估算（`services/growth/prediction.ts`）

沿当前 percentile 延伸至数据源上限月龄，读取对应身高。
**体重页不提供此功能。**

### 8.6 百分位 Z-score（阶段二 · `services/growth/zscore.ts`）

```ts
export function calcZScore(x: number, l: number, m: number, s: number): number {
  if (Math.abs(l) < 1e-6) return Math.log(x / m) / s;
  return (Math.pow(x / m, l) - 1) / (l * s);
}
```

---

## 9. 成长曲线 UI 设计规范

### 9.1 通用规范

- 背景标准曲线：P3 / P15 / P50 / P85 / P97
- 用户测量点：实心圆点 + 连线
- 最新点高亮
- 预测延伸线（虚线，仅身高页显示）
- 百分位颜色：`#4CAF82`（P10~P90）/ `#FF9500`（P3~P10 或 P90~P97）/ `#FF3B30`（P3以下或P97以上）

### 9.2 体重图表扩展

- Y 轴单位：kg
- 图表组件 `GrowthChart` 已通用，传入体重 LMS rows 即可
- 百分位颜色规则与身高相同
- **不显示预测线**（`prediction` prop 传 `undefined`）

---

## 10. 内购功能架构

### 10.1 产品 ID

| 平台 | Product ID |
|------|-----------|
| App Store | `com.qiyan.KidSprout.weight_feature` |
| Google Play | `weight_feature` |

产品类型：**Non-Consumable（一次性买断）**

### 10.2 状态管理（`src/store/purchaseStore.ts`）

```ts
type PurchaseStore = {
  hasPurchasedWeightFeature: boolean;
  isLoading: boolean;
  setPurchased: (value: boolean) => void;
};
```

**持久化：** SQLite settings 表
- 购买成功：`setSetting('purchase_weight', '1')`
- App 启动：读取 settings 还原状态（`_layout.tsx` 中 `initDb()` 后调用）

### 10.3 usePurchase Hook（`src/hooks/usePurchase.ts`）

```ts
export function usePurchase() {
  return {
    hasPurchased: boolean,
    isLoading: boolean,
    purchase: () => Promise<void>,   // 触发内购
    restore: () => Promise<void>,    // 恢复购买
  };
}
```

**本期：** 本地状态实现，`purchase()` 直接写入成功状态（UI 流程验证）。
**下期：** 接入 `expo-in-app-purchases`，接口不变。

### 10.4 UI 呈现

**BottomSheet 体重行（未购买）：**
- 文字颜色 `#CCC`（灰色）
- 右侧 💎 颜色 `#F5C518`（金黄）
- 点击触发 Alert

**Alert：**
```
标题：体重曲线（高级功能）
内容：解锁体重成长曲线，记录孩子体重变化，与同龄儿童对比百分位。
按钮：[立即解锁]  [取消]
```

---

## 11. 商店内购元数据配置

### 11.1 App Store Connect 配置步骤

1. 登录 [App Store Connect](https://appstoreconnect.apple.com/)
2. 进入 **小芽成长** → **功能** → **App 内购买项目** → **「+」**
3. 选择类型：**Non-Consumable（非消耗型）**
4. 填写基本信息：

   | 字段 | 值 |
   |------|---|
   | 参考名称 | Weight Curve Feature |
   | 产品 ID | `com.qiyan.KidSprout.weight_feature` |
   | 定价档位 | 建议 Tier 3（约 ¥18 / $2.99） |

5. **本地化（每种语言）：**

   | 语言 | 显示名称 | 描述 |
   |------|---------|------|
   | 简体中文 | 体重曲线功能 | 解锁体重成长曲线，记录孩子体重变化，查看在同龄儿童中的百分位位置。 |
   | 繁体中文 | 體重曲線功能 | 解鎖體重成長曲線，記錄孩子體重變化，查看在同齡兒童中的百分位位置。 |
   | 日本語 | 体重成長曲線機能 | 体重成長曲線をアンロックし、お子さまの体重変化を記録、同年齢の子どもと比較できます。 |
   | English | Weight Curve Feature | Unlock weight growth charts to track your child's weight and compare with age-matched percentiles. |
   | Español | Función de curva de peso | Desbloquea las curvas de crecimiento de peso para registrar el peso de tu hijo y compararlo con percentiles. |
   | 한국어 | 체중 성장곡선 기능 | 체중 성장곡선을 잠금 해제하여 아이의 체중 변화를 기록하고 같은 연령대와 백분위를 비교하세요. |

6. 上传截图（至少 1 张展示体重曲线的截图）
7. 审核备注：`This is a one-time purchase to unlock the weight growth curve feature.`
8. 状态设为 **Ready to Submit**，随 App 版本提交审核

### 11.2 Google Play Console 配置步骤

1. 登录 [Google Play Console](https://play.google.com/console/)
2. 进入 **小芽成长** → **创收** → **应用内商品** → **受管理的产品** → **「创建产品」**
3. 填写基本信息：

   | 字段 | 值 |
   |------|---|
   | 产品 ID | `weight_feature` |
   | 名称（默认语言） | Weight Curve Feature |
   | 说明 | Unlock weight growth charts |
   | 状态 | 活跃 |
   | 定价 | 参考 App Store 档位（建议 ¥18 / ₩3,900） |

4. **翻译（每种语言）：**

   | 语言 | 标题 | 说明 |
   |------|------|------|
   | zh-CN | 体重曲线功能 | 解锁体重成长曲线，记录孩子体重变化，查看百分位。 |
   | zh-TW | 體重曲線功能 | 解鎖體重成長曲線，記錄孩子體重變化，查看百分位。 |
   | ja | 体重成長曲線機能 | 体重曲線をアンロックし、体重変化を記録・比較できます。 |
   | en | Weight Curve Feature | Unlock weight growth charts to track and compare your child's weight. |
   | es | Función de curva de peso | Desbloquea curvas de peso para registrar y comparar. |
   | ko | 체중 성장곡선 기능 | 체중 성장곡선을 잠금 해제하여 체중 변화를 기록하고 비교하세요. |

5. 保存并发布

### 11.3 测试配置

| 平台 | 测试方式 |
|------|---------|
| iOS | App Store Connect 创建 Sandbox 测试账号 → 设备设置中登录沙盒账号 |
| Android | Google Play Console **许可测试** 中添加测试人员邮箱，使用 Internal testing track |

---

## 12. 国际化规范

### 12.1 现有结构（保持不变）

文件路径：`src/i18n/locales/[lang].json`，扁平 JSON，嵌套不超过 3 层。
参见现有 `zh.json` 结构作为标准。

### 12.2 v0.7 新增 key

在所有 6 个语言文件（zh / zh-Hant / ja / en / es / ko）中同步添加：

```jsonc
// 在现有 "childDetail" 对象内补充
"childDetail": {
  // ...现有 key 不变...
  "addWeight": "＋ 添加体重",
  "deleteWeightRecord": {
    "title": "删除这条记录？",
    "msg": "{{date}} 的体重记录将被永久删除。",
    "cancel": "再想想",
    "confirm": "确认删除"
  },
  "analysis": {
    // ...现有 key 不变...
    "weight": "体重",
    "weightUnit": "kg"
  }
},

// 在现有 "home" 对象内补充
"home": {
  // ...现有 key 不变...
  "selectMetric": {
    "height": "身高",
    "weight": "体重"
  }
},

// 新增顶级 "purchase" 对象
"purchase": {
  "weightFeature": {
    "alertTitle": "体重曲线（高级功能）",
    "alertMessage": "解锁体重成长曲线，记录孩子体重变化，与同龄儿童对比百分位。",
    "buy": "立即解锁",
    "cancel": "取消",
    "restoreSuccess": "已恢复购买",
    "restoreFail": "未找到购买记录"
  }
},

// 新增顶级 "addWeightMeasurement" 对象（与 addMeasurement 对称）
"addWeightMeasurement": {
  "title": "记录今天的体重",
  "labelDate": "今天几号测的？",
  "labelWeight": "量了多少？（kg）",
  "weightPlaceholder": "例：18.5",
  "labelNote": "有什么想记下来的吗？",
  "notePlaceholder": "例：医院体检、家里量的…",
  "save": "记下来！",
  "alertTitle": "好像哪里不对～",
  "alertWeightInvalid": "体重请填写 1〜200 kg 之间的数值哦"
}
```

**各语言 key 对照：**

| key | zh | zh-Hant | ja | en | es | ko |
|-----|----|---------|----|----|----|-----|
| `childDetail.analysis.weight` | 体重 | 體重 | 体重 | Weight | Peso | 체중 |
| `childDetail.addWeight` | ＋ 添加体重 | ＋ 添加體重 | ＋ 体重を追加 | ＋ Add Weight | ＋ Agregar peso | ＋ 체중 추가 |
| `home.selectMetric.height` | 身高 | 身高 | 身長 | Height | Altura | 키 |
| `home.selectMetric.weight` | 体重 | 體重 | 体重 | Weight | Peso | 체중 |
| `purchase.weightFeature.alertTitle` | 体重曲线（高级功能） | 體重曲線（進階功能） | 体重曲線（プレミアム） | Weight Charts (Premium) | Curva de peso (Premium) | 체중 곡선 (프리미엄) |
| `purchase.weightFeature.buy` | 立即解锁 | 立即解鎖 | アンロック | Unlock Now | Desbloquear | 잠금 해제 |
| `addWeightMeasurement.title` | 记录今天的体重 | 記錄今天的體重 | 今日の体重を記録 | Record Today's Weight | Registrar el peso de hoy | 오늘 체중 기록 |

---

## 13. 分阶段开发路线

### Phase A：数据层（约 2h）

1. `src/types/growth.ts` — indicator 扩展 `'weight-for-age'`，unit 扩展 `'kg'`
2. `src/types/measurement.ts` — 添加 `weightKg?: number`
3. `src/db/sqlite.ts` — 幂等 ALTER TABLE 添加 `weight_kg` 列
4. `src/db/measurement.repo.ts` — CRUD 全部加入 `weightKg`
5. `src/data/standards/who_weight.ts` — WHO 体重数据（新建）
6. `src/data/standards/japan_weight.ts` — 日本体重数据（新建）
7. `src/data/standards/china_weight.ts` — 中国体重数据（新建）
8. `src/constants/standards.ts` — 添加 `getWeightStandardFile()`

### Phase B：内购状态（约 0.5h）

1. `src/store/purchaseStore.ts` — Zustand store + SQLite 持久化（新建）
2. `src/hooks/usePurchase.ts` — 封装 hook，本期本地实现（新建）
3. `app/_layout.tsx` — 启动时初始化 purchaseStore

### Phase C：BottomSheet（约 1.5h）

1. `src/components/common/ChildActionBottomSheet.tsx` — 新建（Modal + Animated）
2. `app/index.tsx` — 集成 BottomSheet，替换直接导航逻辑

### Phase D：体重曲线页（约 3h）

1. `app/children/[childId]/weight.tsx` — 体重详情页（新建，独立实现）
2. `app/children/[childId]/add-weight-measurement.tsx` — 录入体重（新建）
3. `app/children/[childId]/weight-chart-fullscreen.tsx` — 全屏图表（新建）

### Phase E：国际化（约 1h）

6 个语言文件同步添加第 12 节中的所有新 key。

---

## 验证清单

| 场景 | 预期结果 |
|------|---------|
| 首页点击孩子卡片 | BottomSheet 从底部弹出，显示姓名 + 身高/体重两个选项 |
| 点击身高（任何状态） | 进入身高详情页，标题显示「小明 身高」 |
| 点击体重（未购买） | 体重行灰色 + 💎，点击弹出购买 Alert |
| 点击 Alert「立即解锁」 | 购买状态写入，体重行变为正常可点击 |
| 点击体重（已购买） | 进入体重详情页，标题显示「小明 体重」 |
| 体重页添加记录 | 保存后列表出现记录，图表绘制测量点 |
| 退出重启 App | 体重记录和购买状态均保留 |
| 旧数据迁移 | 已有 measurements 行正常读写，weight_kg 列为 NULL |
| 切换语言为日語 | BottomSheet、体重页、购买 Alert 均正确日文显示 |
