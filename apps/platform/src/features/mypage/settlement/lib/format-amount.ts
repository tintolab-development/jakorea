export function formatWonAmount(amount: number | null): string {
  if (amount == null) return '-'
  return `${amount.toLocaleString('ko-KR')}원`
}

export function formatWonNumber(amount: number | null): string {
  if (amount == null) return '-'
  return amount.toLocaleString('ko-KR')
}

export function formatSignedWonAmount(amount: number | null): string {
  if (amount == null) return '-'
  const formatted = amount.toLocaleString('ko-KR')
  if (amount > 0) return `+${formatted}원`
  return `${formatted}원`
}
