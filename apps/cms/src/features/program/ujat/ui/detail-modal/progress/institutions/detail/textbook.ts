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
  /**
   * 학년 교재 준비 수량(권) — 학생 1명당 교재 1권, 그 학년 학급별 학생 수(classes[].studentCount) 합계.
   * 서버 학년 블록 kitCount/bookCount는 기관 전체 총원 기준 키트 올림 값이라 쓰지 않는다.
   * 교재가 정해지지 않았거나 학생 수가 없으면 null.
   */
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

function sumGradeStudentCount(gradeBlock: UjatInstitutionApplicationGradeBlockDetail): number | null {
  let total = 0
  for (const classRoom of gradeBlock.classes) {
    const count = classRoom.studentCount
    if (typeof count === 'number' && Number.isFinite(count) && count > 0) total += count
  }
  return total > 0 ? total : null
}

export function calculateGradeTextbookSupply(
  gradeBlock: UjatInstitutionApplicationGradeBlockDetail
): UjatEducationProgressInstitutionTextbookSupply {
  const textbookName = displayOrDash(gradeBlock.textbookName)
  return {
    textbookName,
    bookCount: textbookName === '-' ? null : sumGradeStudentCount(gradeBlock),
    status: mapUjatTextbookDeliveryStatus(gradeBlock.textbookDeliveryStatus),
  }
}

export function formatGradeTextbookSupplyDisplay(
  supply: UjatEducationProgressInstitutionTextbookSupply
): string {
  if (supply.textbookName === '-') return '-'
  if (supply.bookCount == null) return supply.textbookName
  return `${supply.textbookName} | ${supply.bookCount}권`
}
