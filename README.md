# ——

> 用科学的成长曲线，见证孩子每一寸成长

---

## 简介

**小芽成长**是一款专为家长设计的儿童身高成长记录与分析应用。通过整合 WHO、日本厚生劳动省、中国权威机构等多国权威统计数据，以可视化成长曲线的方式，帮助家长直观了解孩子在同龄人中的身高位置，并预测18岁成年后的预期身高。

---

## 核心功能

### 成长曲线绘制

- 基于权威统计数据，实时矢量绘制 0～18 岁各百分位成长曲线
- 支持图表缩放，精确查看任意年龄段数据
- 将孩子的实测身高叠加显示在曲线图上，一目了然

### 多数据源支持

- **WHO**：世界卫生组织全球儿童生长标准
- **日本厚生劳动省**：日本儿童身高统计数据
- **中国权威机构**：中国儿童身高发育参考标准
- 可随时切换数据源，重新绘制成长曲线进行对比

### 身高记录管理

- 定期记录孩子身高，自动生成个人成长轨迹
- 支持多个孩子的独立档案管理
- 预测18岁成年后的预期身高区间

### 多语言支持

- 中文 / 日語 / English / Español / 한국어

---

## 技术栈

| 层级   | 技术                                   |
| ------ | -------------------------------------- |
| 框架   | React Native + Expo                    |
| 平台   | iOS / Android / Web（Electron 桌面版） |
| 图表   | 矢量实时绘制（支持缩放）               |
| 本地化 | i18n 多语言                            |

---

## 平台发布

- **iOS**：App Store
- **Android**：Google Play
- **macOS**：Expo Web + Electron 打包

---

## 应用信息

| 项目      | 内容                |
| --------- | ------------------- |
| 中文名    | 小芽成长            |
| 英文名    | KidSprout           |
| 日文名    | 成長ツリー          |
| Bundle ID | com.qiyan.KidSprout |
| 目标用户  | 0～18岁儿童的家长   |

---

## 开发运行

```bash
# 安装依赖
npm install

# 启动 iOS
npm run ios

# 启动 Android
npm run android

# 启动 Web（浏览器）
npm run web
```

---

## 原生构建（Prebuild）

> 需要配置本地化 App 名称、原生插件等时，需先生成原生代码目录。

### 1. 生成原生代码

```bash
# 生成 ios/ 和 android/ 目录（首次或 app.json 变更后执行）
npx expo prebuild

# 指定平台
npx expo prebuild --platform ios
npx expo prebuild --platform android
```

> ⚠️ `prebuild` 会根据 `app.json` 重新生成原生文件，**手动修改的原生文件可能被覆盖**。
> 建议将 `ios/` 和 `android/` 纳入 Git 管理，每次 prebuild 后用 `git diff` 检查差异。

### 2. 多语言 App 名称（Config Plugin 自动配置）

本地化 App 名称通过 `plugins/withLocalizedAppName.js` 自动生成，**无需手动编辑原生文件**。

| 语言                         | App 名     |
| ---------------------------- | ---------- |
| 中文（zh-Hans）              | 小芽成长   |
| 日语（ja）                   | 成長ツリー |
| 英 / 西 / 韩（en / es / ko） | KidSprout  |

执行 `npx expo prebuild` 后，插件会自动写入：

- **Android**：`res/values-xx/strings.xml`
- **iOS**：`xx.lproj/InfoPlist.strings` + `Info.plist` 语言列表

如需修改名称，编辑 `plugins/withLocalizedAppName.js` 中的 `APP_NAMES` 对象，再重新 prebuild 即可。

### 3. 原生运行

```bash
# iOS（需 Xcode）
npx expo run:ios

# Android（需 Android Studio + 模拟器/真机）
npx expo run:android
```

---

## 内购功能测试（react-native-iap）

> **为什么不能在 Expo Go 中测试内购？**
>
> `react-native-iap` 依赖原生 StoreKit / Billing 模块，Expo Go 沙盒中不包含这些原生代码。
> 内购功能必须通过 **本地原生构建** 或 **EAS Build** 才能运行。
> 在 Expo Go 中启动时，所有内购调用已做 try-catch 保护，不会崩溃，但无法实际发起购买。

### 方法一：本地构建（推荐开发阶段）

```bash
# 1. 生成原生代码（app.json 变更后需重新执行）
npx expo prebuild --platform ios

# 2. 安装 iOS 依赖
cd ios && pod install && cd ..

# 确认 Xcode 能识别到设备
xcrun xctrace list devices

# 3. 编译并启动到模拟器或真机
npx expo run:ios --device 00008140-000C491E0C44801C
```

### 方法二：EAS Build（推荐提交前验证）

```bash
# 构建开发版（包含 dev 工具）
eas build --platform ios --profile development

# 构建 TestFlight 包（模拟真实用户环境）
eas build --platform ios --profile preview
```

### 在模拟器 / 真机上测试 StoreKit 沙盒

#### iOS 模拟器（StoreKit 本地配置文件）

1. 在 Xcode 中打开 `ios/app.xcworkspace`
2. 菜单 → **Product → Scheme → Edit Scheme…**
3. 选择 **Run** → **Options** → **StoreKit Configuration** → 选择项目根目录下的 `.storekit` 配置文件（如无则新建）
4. 新建 `.storekit` 文件时，添加一个 **Non-Consumable** 商品，Product ID 填写 `com.qiyan.KidSprout.weight`
5. 重新运行 App，即可在模拟器中触发沙盒购买弹窗

> 当前正式内购只有一次性买断商品，没有正式订阅商品：
> iOS 使用 `com.qiyan.KidSprout.weight`，Android 使用 `com.qiyan.kidsprout.weight`。历史订阅测试可忽略。

#### iOS 真机（App Store Connect 沙盒账号）

1. 在 [App Store Connect](https://appstoreconnect.apple.com) → 用户和访问 → 沙盒测试员 中创建测试账号
2. 在真机 → **设置 → App Store → 沙盒账户** 中登录测试账号
3. 运行通过本地构建或 TestFlight 安装的 App，触发购买时会使用沙盒账户，不会实际扣款

> **注意**：沙盒购买不会触发真实账单，恢复购买（Restore）同样可以用沙盒账号测试。

### 4. EAS Build（云端构建，推荐发布时使用）

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo 账号
eas login

# 初始化 EAS 配置（首次）
eas build:configure

# 构建 iOS（生产）
eas build --platform ios --profile production

# 构建 Android（生产，生成正式签名的 AAB）
eas build --platform android --profile production
```

> **说明**：
>
> 1. Android 正式发版默认走 **EAS 远程签名凭据**，本地没有 `release.keystore` 也可以构建和提交。
> 2. 本地 `./gradlew bundleRelease` 仅适合排查原生构建问题；当前项目正式发布不以本地 Gradle 产物为准。
> 3. 如需确认 Android 远程签名凭据是否存在，可运行：`eas credentials -p android`

### 5. 提交到商店

#### App Store（iOS）

```bash
# 提交最新构建到 App Store Connect
eas submit --platform ios --profile production

# 同步 store.config.json 中的元数据（标题、描述、关键词等）到 App Store Connect
eas metadata:push
```

> **前提**：已在 App Store Connect 手动创建 App 记录，并完成隐私信息、年龄分级等必填项。

#### Google Play（Android）

```bash
# 提交最新构建到 Google Play（Internal Testing）
eas submit --platform android --profile production

# 或者一步完成构建 + 提交
eas build --platform android --profile production --auto-submit
```

> **前提**：
>
> 1. 已在 Google Play Console 手动创建 App 记录并上传至少一个 AAB（首次需手动上传）
> 2. 已配置 Google Play API Service Account 并授予发布权限
> 3. EAS Metadata 目前只接受 `store.config.json` 中的 `apple` 配置；Google Play 元数据备份在 `store.google.config.json`，需在 Play Console 手动填写
> 4. Google Play 应用内商品需手动配置：
>    - 类型：`Managed product`
>    - Product ID：`com.qiyan.kidsprout.weight`
>    - 不创建订阅商品

### 6. Release Notes 文案风格

`store.config.json` 中的 `releaseNotes` 使用「松弛感更新 / 生活流更新」风格，不写成冷冰冰的功能清单。

写作原则：

- 先说这次更新想让日常记录变得更顺手、更安心，语气像开发者对家长轻声说明。
- 再自然带出主要变化，例如体重记录、成长曲线、记录编辑、备份恢复、图表体验、Android 文件导入。
- 避免使用“重磅上线”“全新升级”“震撼发布”等营销口吻。
- 不堆技术名词，不写实现细节，不提内部模块名、数据库、权限、修复 bug 编号。
- Apple 的 release notes 可以写成 2-3 个自然段；Google Play 的 release notes 更短，适合一小段生活化总结。
- 多语言版本保持同一语气，不逐字硬翻译；日文尤其保持自然、柔和、不过度宣传。

示例语气：

```text
这次更新，想让记录成长这件事更顺手一点。

现在可以把体重也记进来了，和身高一样看看成长曲线和百分位。记录填错了也不用紧张，身高、体重都可以回去修改。

还加了备份和恢复，换手机、重装 App 时心里更踏实。图表页、全屏图表、底部按钮和 Android 文件导入也顺手修了修。
```

---

## 数据来源

- [WHO Child Growth Standards](https://www.who.int/tools/child-growth-standards)
- [日本厚生劳働省 乳幼児身体発育調査](https://www.mhlw.go.jp/)
- 中华人民共和国卫生健康委员会儿童生长发育标准
  - https://www.nhc.gov.cn/wjw/pqt/201807/a5269d062966455ea55d90a02c690311/files/1739781199549_21835.pdf
  - https://www.nhc.gov.cn/wjw/c100311/202211/923e7646561d4b88b72da9097d4da4d5.shtml
- https://mapp.api.weibo.cn/fx/8310c5049465e16487e481d0632e8ccc.html
- https://caod.oriprobe.com/articles/16246428/Height_and_weight_standardized_growth_charts_for_C.htm
- http://cjchc.xjtu.edu.cn/CN/article/advancedSearchResult.do
- https://www.doctor-network.com/Public/LittleTools/356.html

---

## 许可证

MIT License © 2026 qiyan
