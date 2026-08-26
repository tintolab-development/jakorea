import {
  settlementItemSettingSections,
  type SettlementItemSettingRow,
} from '@/data/mock/settlement-item-settings'
import type { PaymentOrderCalculationTableRow } from '@/features/settlement/ui/payment-record/payment-order-calculation-breakdown-table'

export { mapSettlementFrontendItemTypeToLineKind } from '@/features/settlement-management/api/shared/map-frontend-fields'

export type PaymentOrderCalculationStatementDetailContext = {
  /** 산출 내역서 기본정보 — 강의비 책정 기준 (예: `2급 강사비`) */
  lectureFeeStandardTitle?: string
}

const LECTURE_FEE_ITEM_LABELS = new Set(['강의비', '강사비'])

function findSettlementItemSettingById(id: string): SettlementItemSettingRow | null {
  for (const section of settlementItemSettingSections) {
    const found = section.items.find(item => item.id === id)
    if (found) return found
  }
  return null
}

export function findSettlementItemSettingByTitle(title: string): SettlementItemSettingRow | null {
  const normalized = title.trim()
  if (!normalized || normalized === '—') return null
  for (const section of settlementItemSettingSections) {
    const found = section.items.find(item => item.title === normalized)
    if (found) return found
  }
  return null
}

function isLectureFeeRow(row: Pick<PaymentOrderCalculationTableRow, 'kind' | 'itemLabel'>): boolean {
  return row.kind === 'lecture_fee' || LECTURE_FEE_ITEM_LABELS.has(row.itemLabel)
}

export function resolveSettlementItemSettingForCalculationRow(
  row: PaymentOrderCalculationTableRow,
  context?: PaymentOrderCalculationStatementDetailContext | null
): SettlementItemSettingRow | null {
  if (isLectureFeeRow(row)) {
    const title = context?.lectureFeeStandardTitle?.trim()
    if (title && title !== '—') {
      return findSettlementItemSettingByTitle(title)
    }
    return null
  }

  if (row.kind === 'withholding' || row.itemLabel === '원천징수') {
    return findSettlementItemSettingById('d-1')
  }

  return null
}
