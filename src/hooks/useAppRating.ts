import { useEffect } from 'react';
import * as StoreReview from 'expo-store-review';
import { getSetting, setSetting } from '@/db/settings.repo';

const KEY_LAUNCH_COUNT  = 'launch_count';
const KEY_LAST_PROMPTED = 'rate_last_prompted'; // ISO 日期字符串
const KEY_USER_RATED    = 'rate_user_rated';    // '1' 表示用户已主动点击过评价按钮

/** 首次请求评分所需的最低启动次数 */
const MIN_LAUNCHES = 10;
/** 两次请求评分之间的最短间隔（天） */
const REMIND_INTERVAL_DAYS = 30;

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * 应用评分引导 hook
 * 满足条件时自动调用系统原生评分弹窗（expo-store-review）
 * 条件：启动次数 >= MIN_LAUNCHES，且距上次请求 >= REMIND_INTERVAL_DAYS 天
 */
export function useAppRating(): void {
  useEffect(() => {
    async function check() {
      // 1. 递增启动计数
      const prev = parseInt(getSetting(KEY_LAUNCH_COUNT) ?? '0', 10);
      const count = prev + 1;
      setSetting(KEY_LAUNCH_COUNT, String(count));

      // 2. 用户已主动评价过，不再打扰
      if (getSetting(KEY_USER_RATED) === '1') return;

      // 3. 还未达到最低启动次数
      if (count < MIN_LAUNCHES) return;

      // 4. 距上次请求不足 30 天
      const lastStr = getSetting(KEY_LAST_PROMPTED);
      if (lastStr && daysBetween(new Date(lastStr), new Date()) < REMIND_INTERVAL_DAYS) return;

      // 5. 当前设备/环境不支持原生评分弹窗
      if (!(await StoreReview.isAvailableAsync())) return;

      // 6. 记录本次请求时间，然后触发系统评分弹窗
      setSetting(KEY_LAST_PROMPTED, new Date().toISOString());
      StoreReview.requestReview();
    }
    check();
  }, []);
}

/**
 * 在用户主动点击"去评价"按钮时调用
 * 设置永久标记，之后 useAppRating 不再自动弹窗
 */
export function markUserRated(): void {
  setSetting(KEY_USER_RATED, '1');
}
