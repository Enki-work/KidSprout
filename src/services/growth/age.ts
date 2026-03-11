/**
 * 月龄计算
 * 内部统一使用月龄（小数）作为时间基准
 */

// 平均每月天数
const AVG_DAYS_PER_MONTH = 30.4375;

/**
 * 计算月龄（支持小数）
 * @param birthDate 出生日期
 * @param measuredAt 测量日期，默认今天
 */
export function getAgeInMonths(birthDate: Date, measuredAt: Date = new Date()): number {
  const ms = measuredAt.getTime() - birthDate.getTime();
  const days = ms / (1000 * 60 * 60 * 24);
  return days / AVG_DAYS_PER_MONTH;
}

/**
 * 月龄转显示文字
 * 示例：15 → "1岁3个月"
 */
export function formatAgeMonths(months: number): string {
  const years = Math.floor(months / 12);
  const remainMonths = Math.floor(months % 12);
  if (years === 0) return `${remainMonths}个月`;
  if (remainMonths === 0) return `${years}岁`;
  return `${years}岁${remainMonths}个月`;
}
