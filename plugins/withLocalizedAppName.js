/**
 * Expo Config Plugin — 多语言 App 名称
 *
 * 语言映射：
 *   zh-Hans / zh  → 小芽成长
 *   ja            → 成長ツリー
 *   en / es / ko  → KidSprout
 *
 * 每次 `npx expo prebuild` 时自动写入：
 *   Android: android/app/src/main/res/values-xx/strings.xml
 *   iOS:     ios/<name>/xx.lproj/InfoPlist.strings
 *            ios/<name>/Info.plist（CFBundleLocalizations）
 */

const { withDangerousMod, withInfoPlist } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// ── 语言 → App 名称映射 ──────────────────────────────────────────────────────
const APP_NAMES = {
  'zh-Hans': '小芽成长',
  ja:        '成長ツリー',
  en:        'KidSprout',
  es:        'KidSprout',
  ko:        'KidSprout',
};

// ── Android ──────────────────────────────────────────────────────────────────

function withAndroidLocalizedName(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const resDir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'res',
      );

      for (const [lang, name] of Object.entries(APP_NAMES)) {
        // zh-Hans → values-zh-rHans，其余直接 values-xx
        const folderName = lang === 'zh-Hans'
          ? 'values-zh-rHans'
          : `values-${lang}`;

        const dir = path.join(resDir, folderName);
        fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(
          path.join(dir, 'strings.xml'),
          `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <string name="app_name">${name}</string>\n</resources>\n`,
          'utf8',
        );
      }
      return cfg;
    },
  ]);
}

// ── iOS ──────────────────────────────────────────────────────────────────────

/** 写入 xx.lproj/InfoPlist.strings */
function withIosLocalizedName(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const projectName = cfg.modRequest.projectName;
      const iosDir = path.join(cfg.modRequest.platformProjectRoot, projectName);

      for (const [lang, name] of Object.entries(APP_NAMES)) {
        const dir = path.join(iosDir, `${lang}.lproj`);
        fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(
          path.join(dir, 'InfoPlist.strings'),
          `CFBundleDisplayName = "${name}";\nCFBundleName = "${name}";\n`,
          'utf8',
        );
      }
      return cfg;
    },
  ]);
}

/** 在 Info.plist 中声明支持的语言列表 */
function withIosLocalizations(config) {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults.CFBundleLocalizations = Object.keys(APP_NAMES);
    return cfg;
  });
}

// ── 导出合并插件 ──────────────────────────────────────────────────────────────
module.exports = function withLocalizedAppName(config) {
  config = withAndroidLocalizedName(config);
  config = withIosLocalizedName(config);
  config = withIosLocalizations(config);
  return config;
};
