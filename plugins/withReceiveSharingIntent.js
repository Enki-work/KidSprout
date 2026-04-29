/**
 * Expo Config Plugin — react-native-receive-sharing-intent Android 支持
 *
 * 作用：在 MainActivity.kt 中注入 onNewIntent 覆写，
 * 使热启动（App 已运行）时也能正确更新 intent，
 * 让 ReceiveSharingIntentModule.getFileNames() 读到最新的 SEND intent。
 *
 * iOS 不需要此插件（iOS 使用 UTType document opener + Linking 方案）。
 */

const fs = require('fs');
const path = require('path');
const { withDangerousMod, withMainActivity } = require('@expo/config-plugins');

const IMPORT_LINE = 'import android.content.Intent';

const ON_NEW_INTENT = `
  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
  }`;

module.exports = function withReceiveSharingIntent(config) {
  config = withMainActivity(config, (mod) => {
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

  return withDangerousMod(config, [
    'android',
    (mod) => {
      patchReceiveSharingIntentViewHandler(mod.modRequest.projectRoot);
      return mod;
    },
  ]);
};

function patchReceiveSharingIntentViewHandler(projectRoot) {
  const helperPath = path.join(
    projectRoot,
    'node_modules',
    'react-native-receive-sharing-intent',
    'android',
    'src',
    'main',
    'java',
    'com',
    'reactnativereceivesharingintent',
    'ReceiveSharingIntentHelper.java',
  );

  if (!fs.existsSync(helperPath)) return;

  let contents = fs.readFileSync(helperPath, 'utf8');
  const withNullableTypePatch = contents.replace(
    '      if(type == null) { return; }',
    '      if(type == null) { type = ""; }',
  );
  const didPatchNullableType = withNullableTypePatch !== contents;
  contents = withNullableTypePatch;

  if (contents.includes('Uri contentUri = intent.getData();')) {
    if (didPatchNullableType) fs.writeFileSync(helperPath, contents);
    return;
  }

  const original = `      }else if(Objects.equals(action, Intent.ACTION_VIEW)){
        String link = intent.getDataString();
        WritableMap files = new WritableNativeMap();
        WritableMap file = new WritableNativeMap();
        file.putString("contentUri",null);
        file.putString("filePath", null);
        file.putString("mimeType",null);
        file.putString("text",null);
        file.putString("weblink", link);
        file.putString("fileName", null);
        file.putString("extension", null);
        files.putMap("0",file);
        promise.resolve(files);
      }`;

  const patched = `      }else if(Objects.equals(action, Intent.ACTION_VIEW)){
        Uri contentUri = intent.getData();
        WritableMap files = new WritableNativeMap();
        WritableMap file = new WritableNativeMap();
        if(contentUri != null){
          String filePath = FileDirectory.INSTANCE.getAbsolutePath(context, contentUri);
          ContentResolver contentResolver = context.getContentResolver();
          file.putString("contentUri", contentUri.toString());
          file.putString("filePath", filePath);
          file.putString("mimeType", contentResolver.getType(contentUri));
          Cursor queryResult = contentResolver.query(contentUri, null, null, null, null);
          if(queryResult != null && queryResult.moveToFirst()){
            file.putString("fileName", queryResult.getString(queryResult.getColumnIndex(OpenableColumns.DISPLAY_NAME)));
            queryResult.close();
          }else{
            file.putString("fileName", null);
          }
        }else{
          file.putString("contentUri", null);
          file.putString("filePath", null);
          file.putString("mimeType", null);
          file.putString("fileName", null);
        }
        file.putString("text",null);
        file.putString("weblink", null);
        file.putString("extension", null);
        files.putMap("0",file);
        promise.resolve(files);
      }`;

  if (!contents.includes(original)) {
    if (didPatchNullableType) fs.writeFileSync(helperPath, contents);
    return;
  }

  contents = contents.replace(original, patched);
  fs.writeFileSync(helperPath, contents);
}
