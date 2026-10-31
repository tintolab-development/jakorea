import type { TextbookStatusKey } from '@/features/program/general/model/participating-schools'
import type { UjatInstitutionApplicationGradeBlockDetail } from '../../../application-institution/detail/detail-types'

/** UJAT 교육 진행 참여 기관 상세 — 교재 배송 상태 라벨. 서버 저장값이 없으면 배지를 그리지 않는다. */
export const UJAT_EDUCATION_PROGRESS_TEXTBOOK_STATUS_LABELS: Record<TextbookStatusKey, string> = {
  preparing: '배송전',
  shipping: '배송 중',
  delivered: '배송완료',
  not_applicable: '해당 없음',
}

export type UjatEducationProgressInstitutionTextbookSupply = {
  textbookName: string
  kitCount: number | null
  bookCount: number | null
  status: TextbookStatusKey | null
}

export function mapUjatTextbookDeliveryStatus(
  value: string | null | undefined
): TextbookStatusKey | null {
  const normalized = value?.trim().toUpperCase().replace(/-/g, '_')
  if (normalized === 'PREPARING' || normalized === 'BEFORE_SHIPPING' || normalized === 'BEFORE_DELIVERY') {
    return 'preparing'
  }
  if (normalized === 'SHIPPING' || normalized === 'IN_TRANSIT') return 'shipping'
  if (normalized === 'DELIVERED' || normalized === 'COMPLETE') return 'delivered'
  if (normalized === 'NOT_APPLICABLE') return 'not_applicable'
  return null
}

function displayOrDash(value: string | null | undefined): string {
  return value?.trim() || '-'
}

export function calculateGradeTextbookSupply(
  gradeBlock: UjatInstitutionApplicationGradeBlockDetail
): UjatEducationProgressInstitutionTextbookSupply {
  return {
    textbookName: displayOrDash(gradeBlock.textbookName),
    kitCount: typeof gradeBlock.kitCount === 'number' ? gradeBlock.kitCount : null,
    bookCount: typeof gradeBlock.bookCount === 'number' ? gradeBlock.bookCount : null,
    status: mapUjatTextbookDeliveryStatus(gradeBlock.textbookDeliveryStatus),
  }
}

export function formatGradeTextbookSupplyDisplay(
  supply: UjatEducationProgressInstitutionTextbookSupply
): string {
  const kitLabel = supply.kitCount != null ? `${supply.kitCount}키트` : ''
  const bookLabel = supply.bookCount != null ? `(${supply.bookCount}권)` : ''
  const quantity = [kitLabel, bookLabel].filter(Boolean).join(' ').trim()
  if (supply.textbookName === '-' && !quantity) return '-'
  if (supply.textbookName === '-') return quantity || '-'
  if (!quantity) return supply.textbookName
  return `${supply.textbookName} | ${quantity}`
}
