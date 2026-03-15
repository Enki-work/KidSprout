import { useTranslation } from 'react-i18next';

/**
 * 返回一个语言感知的月龄格式化函数。
 * 示例（中文）：15 → "1岁3个月"
 * 示例（日文）：15 → "1歳3ヶ月"
 */
export function useFormatAge(): (months: number) => string {
  const { t } = useTranslation();
  return (months: number) => {
    const years = Math.floor(months / 12);
    const remain = Math.floor(months % 12);
    if (years === 0) return t('age.months', { count: remain });
    if (remain === 0) return t('age.years', { count: years });
    return t('age.yearsMonths', { years, months: remain });
  };
}
