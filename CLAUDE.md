# CLAUDE.md

## 项目概要

**小芽成长（KidSprout）** — 儿童身高成长记录与成长曲线可视化应用。
基于多国权威统计数据（WHO / 日本厚生劳动省 / 中国权威机构），使用 LMS 算法实时矢量绘制成长曲线，帮助家长直观了解孩子身高在同龄人中的百分位位置及18岁预期身高。
详细信息参见 `/README.md`。

Bundle ID：`com.qiyan.KidSprout`
平台：iOS / Android / Web（Electron 桌面版）

## 语言规则

- 所有回答与说明使用 **中文**
- 代码内注释使用 **中文**

## 设计 · UI 规则

- 主题色：`#4CAF82`（绿芽色，作为全局主色统一使用）
- 使用 **React Native StyleSheet** 或 **NativeWind** 进行样式编写
- 图表使用矢量实时绘制，支持缩放，优先使用 `react-native-svg`
- 界面简洁清晰，适合家长日常使用，避免信息过载

## 组件设计规则

- 尽量将组件拆分为小单元
- 页面专属组件 → `src/screens/[ScreenName]/components/`
- 通用组件 → `src/components/`
- 1个组件 = 1个文件
- 图表相关组件统一放在 `src/components/charts/`

## Hooks 设计规则

- 业务逻辑积极抽取为 **自定义 Hook**
- 数据存取 Hook → `src/hooks/storage/`
- 成长曲线计算 Hook → `src/hooks/growth/`
- 通用 Hook → `src/hooks/`

## 技术栈

- **React Native** + **Expo SDK** — 跨平台框架
- **TypeScript** — 类型安全
- **Expo Router** — 文件路由
- **react-native-svg** — 矢量图表绘制
- **react-i18next** — 多语言国际化（中文 / 日語 / English / Español / 한국어）
- **Zustand** — 全局状态管理
- **MMKV / AsyncStorage** — 本地数据持久化
- **Zod** — 数据验证

## 成长曲线算法

- 采用 **LMS 法**（Box-Cox 正态分布）计算身高百分位
- LMS 参数表按数据源分别维护 → `src/data/lms/`
  - `who.ts` — WHO 全球标准
  - `japan.ts` — 日本厚生劳动省
  - `china.ts` — 中国标准
- 核心计算函数 → `src/utils/lmsCalculator.ts`
- 支持月龄线性插值，处理非整数月龄

## 多语言规则

- 语言文件 → `src/i18n/locales/[lang].json`
- 语言代码：`zh`、`ja`、`en`、`es`、`ko`
- 所有用户可见字符串必须通过 i18n key 引用，禁止硬编码文字
- 数据源名称（WHO 等）保持原文，不翻译

## 数据源规则

- 所有 LMS 原始数据以 TypeScript 常量形式存储，不使用外部 API 请求
- 数据按 `{ age: number, sex: 'male'|'female', L: number, M: number, S: number }[]` 格式维护
- 切换数据源后重新计算并重绘曲线，不缓存旧结果

## 编码规范

- 路径别名使用 `@/`（如 `@/components/charts/GrowthChart`）
- `useState` / `useEffect` 遵循最小依赖原则
- 避免在组件内直接做百分位计算，统一调用 `src/utils/lmsCalculator.ts`
- 本地存储的儿童档案数据结构定义在 `src/types/child.ts`

## 命令

- `npm run start` — 启动 Expo 开发服务器
- `npm run ios` — 在 iOS 模拟器运行
- `npm run android` — 在 Android 模拟器运行
- `npm run web` — 在浏览器运行（Web 版）
- `npm run lint` — ESLint 检查
- `npm run test` — 运行测试
