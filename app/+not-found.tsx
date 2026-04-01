import { Redirect } from 'expo-router';

// 找不到路由时（如 iOS 打开备份文件触发的 file:// URL）直接跳回首页
export default function NotFound() {
  return <Redirect href="/" />;
}
