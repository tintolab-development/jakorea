import type { TextbookStatusKey } from '@/data/mock/participating-schools'
import type { UjatInstitutionApplicationGradeBlockDetail } from '../../../application-institution/detail/detail-types'

/** UJAT 초등 프로그램 학년별 교재명(mock) */
export const UJAT_ELEMENTARY_TEXTBOOK_BY_GRADE: Record<string, string> = {
  '1학년': '우리가족',
  '2학년': '우리마을',
  '3학년': '우리지역',
  '4학년': '우리나라',
  '5학년': '우리세계',
  '6학년': '우리가족',
}

export const UJAT_ELEMENTARY_BOOKS_PER_KIT = 24

/** UJAT 교육 진행 참여 기관 상세 — 교재 배송 상태 라벨 */
export const UJAT_EDUCATION_PROGRESS_TEXTBOOK_STATUS_LABELS: Record<TextbookStatusKey, string> = {
  preparing: '배송전',
  shipping: '배송 중',
  delivered: '배송완료',
  not_applicable: '해당 없음',
}

export type UjatEducationProgressInstitutionTextbookSupply = {
  textbookName: string
  kitCount: number
  bookCount: number
  status: TextbookStatusKey
}

export function calculateGradeTextbookSupply(
  gradeBlock: UjatInstitutionApplicationGradeBlockDetail
): UjatEducationProgressInstitutionTextbookSupply {
  const studentTotal = gradeBlock.classes.reduce((sum, row) => sum + row.studentCount, 0)
  const kitCount =
    studentTotal > 0 ? Math.ceil(studentTotal / UJAT_ELEMENTARY_BOOKS_PER_KIT) : 0
  const bookCount = kitCount * UJAT_ELEMENTARY_BOOKS_PER_KIT
  const textbookName = UJAT_ELEMENTARY_TEXTBOOK_BY_GRADE[gradeBlock.gradeLabel] ?? '-'

  return {
    textbookName,
    kitCount,
    bookCount,
    status: 'preparing',
  }
}

export function formatGradeTextbookSupplyDisplay(supply: UjatEducationProgressInstitutionTextbookSupply): string {
  if (supply.kitCount <= 0) return '-'
  return `${supply.textbookName} | ${supply.kitCount}키트 (${supply.bookCount}권)`
}
