/**
 * 月龄计算
 * 内部统一使用月龄（小数）作为时间基准
 */


/**
 * 计算月龄（支持小数）
 * 整数部分：日历式（与生日同日或之后视为满整月），避免平均天数除法导致同月重复
 * 小数部分：当月剩余天数比例，供 LMS 插值平滑使用
 * @param birthDate 出生日期
 * @param measuredAt 测量日期，默认今天
 */
export function getAgeInMonths(birthDate: Date, measuredAt: Date = new Date()): number {
  const by = birthDate.getFullYear();
  const bm = birthDate.getMonth();
  const bd = birthDate.getDate();

  const my = measuredAt.getFullYear();
  const mm = measuredAt.getMonth();
  const md = measuredAt.getDate();

  // 整月数：测量日 < 生日日期 则当月未满，减 1
  let completedMonths = (my - by) * 12 + (mm - bm);
  if (md < bd) completedMonths -= 1;

  // 小数部分：当前月内已过天数 / 当月天数
  const daysInMonth = new Date(my, mm + 1, 0).getDate();
  const dayFraction = md >= bd
    ? (md - bd) / daysInMonth
    : (md + daysInMonth - bd) / daysInMonth;

  return completedMonths + dayFraction;
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
