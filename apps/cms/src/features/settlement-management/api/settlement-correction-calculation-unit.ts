/**
 * 정산 정정 승인 — 특강/기타 인건비 수동 책정 calculationUnit (BE 261028).
 * Orval 생성 enum에 PER_CLASS가 아직 없을 수 있어 feature SSOT로 둔다.
 *
 * NOTE: CMS에 approveCorrection(calculationUnit) UI 연결이 없으면 이 모듈은
 * 라벨·페이로드 헬퍼만 제공한다. 전체 승인 화면은 BLOCKED.
 */

export const SettlementCorrectionCalculationUnit = {
  PER_LECTURE: 'PER_LECTURE',
  PER_HOUR: 'PER_HOUR',
  PER_CLASS: 'PER_CLASS',
} as const

export type SettlementCorrectionCalculationUnit =
  (typeof SettlementCorrectionCalculationUnit)[keyof typeof SettlementCorrectionCalculationUnit]

export const SETTLEMENT_CORRECTION_CALCULATION_UNIT_OPTIONS: {
  value: SettlementCorrectionCalculationUnit
  label: string
}[] = [
  { value: SettlementCorrectionCalculationUnit.PER_LECTURE, label: '출강 1회당' },
  { value: SettlementCorrectionCalculationUnit.PER_HOUR, label: '1시간당' },
  { value: SettlementCorrectionCalculationUnit.PER_CLASS, label: '1차시당' },
]

export function settlementCorrectionCalculationUnitLabel(
  unit: string | null | undefined
): string | null {
  if (unit == null) return null
  const trimmed = unit.trim().toUpperCase()
  const found = SETTLEMENT_CORRECTION_CALCULATION_UNIT_OPTIONS.find(o => o.value === trimmed)
  return found?.label ?? null
}

export function parseSettlementCorrectionCalculationUnit(
  raw: string | null | undefined
): SettlementCorrectionCalculationUnit | null {
  if (raw == null) return null
  const trimmed = raw.trim().toUpperCase()
  if (trimmed === SettlementCorrectionCalculationUnit.PER_LECTURE) return 'PER_LECTURE'
  if (trimmed === SettlementCorrectionCalculationUnit.PER_HOUR) return 'PER_HOUR'
  if (trimmed === SettlementCorrectionCalculationUnit.PER_CLASS) return 'PER_CLASS'
  return null
}
