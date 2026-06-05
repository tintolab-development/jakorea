import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'

export const STUDENT_LIST_GENDER_FILTER_OPTIONS = [
  { label: '남', value: 'male' },
  { label: '여', value: 'female' },
]

/** 학교 상세 > 학생 명단 학급 Select 옵션 (1반 … 6반) */
export const STUDENT_GRADE_CLASS_OPTIONS = Array.from({ length: 6 }, (_, index) => {
  const label = `${index + 1}반`
  return { label, value: label }
})

const STUDENT_LIST_FILTER_CONTROL_WIDTH = 260

/** 학교 상세 > 학생 명단 탭 필터 (학생명·성별·학급) */
export function buildStudentListFilterFields(): FilterFieldConfig[] {
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
      options: STUDENT_GRADE_CLASS_OPTIONS,
      width: STUDENT_LIST_FILTER_CONTROL_WIDTH,
    },
  ]
}
