/** 曜日名（日〜土） */
export const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'] as const;

/** 'YYYY-MM-DD' 形式の日付文字列を '〇月〇日（曜）' にフォーマットする */
export function formatDateJa(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日（${DAY_NAMES[d.getDay()]}）`;
}

/** 'YYYY-MM-DD' 形式の日付文字列を 'YYYY年M月D日' にフォーマットする */
export function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 今日の日付を 'YYYY-MM-DD' 形式で返す */
export function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
