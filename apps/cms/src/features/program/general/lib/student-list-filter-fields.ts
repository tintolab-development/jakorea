import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'

export const STUDENT_LIST_GENDER_FILTER_OPTIONS = [
  { label: '남', value: 'male' },
  { label: '여', value: 'female' },
]

/** @deprecated 고정 1~6반 — `buildStudentGradeClassOptions(classCount)` 사용 */
export const STUDENT_GRADE_CLASS_OPTIONS = buildStudentGradeClassOptions(6)

/** 참여 기관 신청 학급 수(`classCount`) 기준 학급 Select 옵션 (예: 4 → 1반 … 4반) */
export function buildStudentGradeClassOptions(classCount?: number | null) {
  if (classCount == null || classCount < 1) return []

  return Array.from({ length: classCount }, (_, index) => {
    const label = `${index + 1}반`
    return { label, value: label }
  })
}

const STUDENT_LIST_FILTER_CONTROL_WIDTH = FILTER_CONTROL_MAX_WIDTH_PX

/** 학교 상세 > 학생 명단 탭 필터 (학생명·성별·학급) */
export function buildStudentListFilterFields(classCount?: number | null): FilterFieldConfig[] {
  const gradeClassOptions = buildStudentGradeClassOptions(classCount)
  return [
    {
      key: 'studentName',
      type: 'search',
      label: '학생명',
      placeholder: '학생명을 입력하세요',
      width: STUDENT_LIST_FILTER_CONTROL_WIDTH,
    },
    {
      key: 'studentGender',
      type: 'select',
      label: '성별',
      placeholder: '전체',
      options: STUDENT_LIST_GENDER_FILTER_OPTIONS,
      width: STUDENT_LIST_FILTER_CONTROL_WIDTH,
    },
    {
      key: 'studentClass',
      type: 'select',
      label: '학급',
      placeholder: '전체',
      options: gradeClassOptions,
      width: STUDENT_LIST_FILTER_CONTROL_WIDTH,
    },
  ]
}
