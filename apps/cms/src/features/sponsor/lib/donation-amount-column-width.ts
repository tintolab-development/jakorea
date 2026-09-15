/** 헤더만 있을 때 최소 폭 (기존 목록 열 160px) */
export const DONATION_AMOUNT_COLUMN_MIN_WIDTH = 160

/** 본문 셀 좌우 패딩 16+16 — cms-data-table tbody */
const CELL_HORIZONTAL_PADDING = 32

const OTHER_SPONSOR_LIST_COLUMN_WIDTHS = 68 + 80 + 100 + 200 + 116 + 130 + 120 + 120 + 120

export function formatDonationAmount(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

function measureDonationLabelWidth(text: string): number {
  if (typeof document === 'undefined') {
    return Math.ceil(text.length * 10)
  }
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return Math.ceil(text.length * 10)
  context.font = '500 16px Pretendard, sans-serif'
  return Math.ceil(context.measureText(text).width)
}

/** 목록에 보이는 금액 중 가장 긴 텍스트에 맞춘 누적 후원금 열 폭 */
export function donationAmountColumnWidth(amounts: readonly number[]): number {
  const labels = ['누적 후원금', ...amounts.map(formatDonationAmount)]
  const contentWidth = Math.max(...labels.map(measureDonationLabelWidth))
  return Math.max(DONATION_AMOUNT_COLUMN_MIN_WIDTH, contentWidth + CELL_HORIZONTAL_PADDING)
}

/** 후원사 목록 테이블 가로 스크롤용 최소 폭 (다른 고정열 + 후원금 열) */
export function sponsorListTableMinWidth(donationColumnWidth: number): number {
  return OTHER_SPONSOR_LIST_COLUMN_WIDTHS + donationColumnWidth
}
