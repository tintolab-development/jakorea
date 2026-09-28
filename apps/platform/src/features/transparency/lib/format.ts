/** 금액 표시 — 예: 1,234,567원 */
export function formatKrwAmount(amount: number) {
  return `${amount.toLocaleString('ko-KR')}원`
}
