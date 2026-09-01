/** 연수 차시별 강사비 — 2차시 17만 / 3차시 22만 / 4차시 27만 */
export function calculatePaymentAmount(classCount: number | null | undefined): number | null {
  if (classCount == null) return null
  switch (classCount) {
    case 2:
      return 170_000
    case 3:
      return 220_000
    case 4:
      return 270_000
    default:
      return null
  }
}
