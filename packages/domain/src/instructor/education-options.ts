import type { DomainSelectOption } from '../shared/types.js'

export const EDUCATION_SCHOOL_TYPE = {
  high: 'high',
  college23: 'college23',
  college4: 'college4',
  graduate: 'graduate',
} as const

export type EducationSchoolType =
  (typeof EDUCATION_SCHOOL_TYPE)[keyof typeof EDUCATION_SCHOOL_TYPE]

export const EDUCATION_SCHOOL_TYPE_OPTIONS: DomainSelectOption<EducationSchoolType>[] = [
  { value: EDUCATION_SCHOOL_TYPE.high, label: '고등학교' },
  { value: EDUCATION_SCHOOL_TYPE.college23, label: '대학교 2, 3년제' },
  { value: EDUCATION_SCHOOL_TYPE.college4, label: '대학교 4년제' },
  { value: EDUCATION_SCHOOL_TYPE.graduate, label: '대학원' },
]

export const EDUCATION_STATUS = {
  enrolled: 'enrolled',
  graduated: 'graduated',
  completed: 'completed',
} as const

export type EducationStatus = (typeof EDUCATION_STATUS)[keyof typeof EDUCATION_STATUS]

export const EDUCATION_STATUS_OPTIONS: DomainSelectOption<EducationStatus>[] = [
  { value: EDUCATION_STATUS.enrolled, label: '재학' },
  { value: EDUCATION_STATUS.graduated, label: '졸업' },
  { value: EDUCATION_STATUS.completed, label: '수료' },
]

export const EDUCATION_DEGREE = {
  master: 'master',
  doctor: 'doctor',
} as const

export type EducationDegree = (typeof EDUCATION_DEGREE)[keyof typeof EDUCATION_DEGREE]

export const EDUCATION_DEGREE_OPTIONS: DomainSelectOption<EducationDegree>[] = [
  { value: EDUCATION_DEGREE.master, label: '석사' },
  { value: EDUCATION_DEGREE.doctor, label: '박사' },
]

/** 학력 상세 체크 옵션 (= 최종 학력 유형과 동일 키) */
export const EDUCATION_DETAIL_OPTIONS = EDUCATION_SCHOOL_TYPE_OPTIONS

export type EducationDetailKey = EducationSchoolType

export const EDUCATION_LEVEL_ORDER: EducationDetailKey[] = [
  EDUCATION_SCHOOL_TYPE.high,
  EDUCATION_SCHOOL_TYPE.college23,
  EDUCATION_SCHOOL_TYPE.college4,
  EDUCATION_SCHOOL_TYPE.graduate,
]

export function isEducationDetailKey(value: string): value is EducationDetailKey {
  return EDUCATION_LEVEL_ORDER.includes(value as EducationDetailKey)
}

/** 최종 학력 이하(포함)만 학력 상세 체크 옵션으로 노출 */
export function resolveAvailableEducationDetailKeys(
  eduSchoolType: string | undefined,
): EducationDetailKey[] {
  if (!eduSchoolType || !isEducationDetailKey(eduSchoolType)) return []
  const index = EDUCATION_LEVEL_ORDER.indexOf(eduSchoolType)
  return EDUCATION_LEVEL_ORDER.slice(0, index + 1)
}

export function orderEducationDetailKeys(keys: EducationDetailKey[]): EducationDetailKey[] {
  const set = new Set(keys)
  return EDUCATION_LEVEL_ORDER.filter(key => set.has(key))
}
