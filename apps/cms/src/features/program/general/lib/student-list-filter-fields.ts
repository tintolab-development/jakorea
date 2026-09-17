import type { FilterFieldConfig } from '@/shared/components/filter-table-layout'
import { FILTER_CONTROL_MAX_WIDTH_PX } from '@/shared/components/table-filter-group-field-width'
import type { StudentGenderKey } from '../model/school-detail-types'

/** 학생 명단·출석 필터 — 성별 Select 값 (미기재 포함) */
export const STUDENT_LIST_GENDER_FILTER_UNSPECIFIED = 'unspecified'

export const STUDENT_LIST_GENDER_FILTER_OPTIONS = [
  { label: '남', value: 'male' },
  { label: '여', value: 'female' },
  { label: '해당 없음(미기재)', value: STUDENT_LIST_GENDER_FILTER_UNSPECIFIED },
]

/** @deprecated 고정 1~6반 — `buildStudentGradeClassOptions(classCount, educationGrade)` 사용 */
export const STUDENT_GRADE_CLASS_OPTIONS = buildStudentGradeClassOptions(6)

/** 교육 학년 라벨을 학급 옵션용 `N학년` 형태로 정규화 */
export function normalizeStudentGradeLabelForClassOption(
  educationGrade?: string | null
): string {
  const trimmed = educationGrade?.trim() ?? ''
  if (!trimmed) return ''
  const withGrade = trimmed.match(/(\d+)\s*학년/)
  if (withGrade?.[1]) return `${withGrade[1]}학년`
  const onlyNum = trimmed.match(/^(\d+)$/)
  if (onlyNum?.[1]) return `${onlyNum[1]}학년`
  return trimmed.endsWith('학년') ? trimmed : trimmed
}

/** 참여 기관 신청 학급 수(`classCount`) + 교육 학년 기준 학급 Select 옵션 */
export function buildStudentGradeClassOptions(
  classCount?: number | null,
  educationGrade?: string | null
) {
  if (classCount == null || classCount < 1) return []

  const gradeLabel = normalizeStudentGradeLabelForClassOption(educationGrade)
  return Array.from({ length: classCount }, (_, index) => {
    const classPart = `${index + 1}반`
    const label = gradeLabel ? `${gradeLabel} ${classPart}` : classPart
    return { label, value: label }
  })
}

/** 명단에 실제로 입력된 학급 값으로 필터·Select 옵션 구성 */
export function buildStudentClassFilterOptionsFromRows(
  rows: Array<{ gradeClass?: string | null }>
): Array<{ label: string; value: string }> {
  const unique = new Set<string>()
  for (const row of rows) {
    const value = row.gradeClass?.trim()
    if (value) unique.add(value)
  }
  return Array.from(unique)
    .sort((a, b) => a.localeCompare(b, 'ko'))
    .map(value => ({ label: value, value }))
}

/** 신청 학급 옵션 + 명단 학급 값을 합쳐 필터·추가·수정 Select에 동일 적용 */
export function mergeStudentClassSelectOptions(
  ...groups: Array<Array<{ label: string; value: string }>>
): Array<{ label: string; value: string }> {
  const unique = new Map<string, string>()
  for (const group of groups) {
    for (const option of group) {
      const value = option.value.trim()
      if (!value) continue
      if (!unique.has(value)) unique.set(value, option.label.trim() || value)
    }
  }
  return Array.from(unique.entries())
    .sort(([a], [b]) => a.localeCompare(b, 'ko'))
    .map(([value, label]) => ({ label, value }))
}

export type StudentListRowFilterInput = {
  name: string
  gender?: StudentGenderKey | null
  gradeClass?: string | null
}

export type StudentListAppliedFilters = {
  studentName: string
  studentGender: string
  studentClass: string
}

export function matchesStudentListFilters(
  row: StudentListRowFilterInput,
  filters: StudentListAppliedFilters
): boolean {
  const nameQuery = filters.studentName.trim()
  if (nameQuery && !row.name.includes(nameQuery)) return false

  if (filters.studentGender !== 'all' && filters.studentGender !== '') {
    if (filters.studentGender === STUDENT_LIST_GENDER_FILTER_UNSPECIFIED) {
      if (row.gender) return false
    } else if (row.gender !== filters.studentGender) {
      return false
    }
  }

  if (filters.studentClass !== 'all' && filters.studentClass !== '') {
    if ((row.gradeClass ?? '') !== filters.studentClass) return false
  }

  return true
}

const STUDENT_LIST_FILTER_CONTROL_WIDTH = FILTER_CONTROL_MAX_WIDTH_PX

/** 학교 상세 > 학생 명단 탭 필터 (학생명·성별·학급) — 학급 옵션은 추가 모달·수정 Select와 동일 */
export function buildStudentListFilterFields(
  gradeClassOptions: Array<{ label: string; value: string }> = []
): FilterFieldConfig[] {
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
