/**
 * Expo Config Plugin — react-native-receive-sharing-intent Android 支持
 *
 * 作用：在 MainActivity.kt 中注入 onNewIntent 覆写，
 * 使热启动（App 已运行）时也能正确更新 intent，
 * 让 ReceiveSharingIntentModule.getFileNames() 读到最新的 SEND intent。
 *
 * iOS 不需要此插件（iOS 使用 UTType document opener + Linking 方案）。
 */

const { withMainActivity } = require('@expo/config-plugins');

const IMPORT_LINE = 'import android.content.Intent';

const ON_NEW_INTENT = `
  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
  }`;

module.exports = function withReceiveSharingIntent(config) {
  return withMainActivity(config, (mod) => {
    let contents = mod.modResults.contents;

    // 1. 添加 import（如已存在则跳过）
    if (!contents.includes(IMPORT_LINE)) {
      // 插入到第一个 import 行之前
      contents = contents.replace(
        /^(import )/m,
        `${IMPORT_LINE}\n$1`,
      );
    }

    // 2. 注入 onNewIntent（如已存在则跳过）
    if (!contents.includes('onNewIntent')) {
      // 在类的最后一个 } 之前插入
      const lastBrace = contents.lastIndexOf('}');
      contents =
        contents.slice(0, lastBrace) +
        ON_NEW_INTENT +
        '\n' +
        contents.slice(lastBrace);
    }

    mod.modResults.contents = contents;
    return mod;
  });
};
