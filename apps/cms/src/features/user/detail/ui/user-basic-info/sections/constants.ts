export const GENDER_EDIT_OPTIONS = [
  { value: '남성', label: '남성' },
  { value: '여성', label: '여성' },
]

export const INDIVIDUAL_SCHOOL_ENROLLMENT_OPTIONS = [
  { label: '재학 중', value: 'enrolled' },
  { label: '해당 없음', value: 'not_enrolled' },
] as const

export const JA_EVALUATION_GRADE_OPTIONS = ['A', 'B', 'C', 'D'].map(v => ({
  value: v,
  label: v,
}))

const INDIVIDUAL_AFFILIATION_GRADE_OPTIONS: { value: string; label: string }[] = [
  { value: '1학년', label: '1학년' },
  { value: '2학년', label: '2학년' },
  { value: '3학년', label: '3학년' },
  { value: '4학년', label: '4학년' },
  { value: '5학년', label: '5학년' },
  { value: '6학년', label: '6학년' },
]

/**
 * 일반(개인) 회원 상세 수정 — Figma 12239:235338 Field / Table 고정 폭.
 * 셀 폭에 늘리지 않고 시안 폭으로 고정한다.
 */
export const ALL_USERS_EDIT_FIELD_WIDTH = {
  /** 성명·연락처·이메일·생년월일·1365 ID·상세 주소 (Field / Table / Input) */
  input: 200,
  /** 소속 학교 검색 (Field / Table / Search) */
  schoolSearch: 140,
  /**
   * 소속 학년 (Field / Table / Select) — 시안 122이나 공통 CmsSelect 우측 화살표 영역(58px) 때문에
   * 122에서는 「1학년」이 말줄임 → 문구가 보이는 최소 폭 140
   */
  gradeSelect: 140,
  /** 자택 주소 검색 (Field / Table / Search) */
  addressSearch: 242,
} as const

/** 일반 회원 수정 — 성별 라디오 (값은 기존 `GENDER_EDIT_OPTIONS`와 동일) */
export const GENDER_EDIT_RADIO_OPTIONS = [
  { value: '남성', label: '남' },
  { value: '여성', label: '여' },
]

export function individualAffiliationGradeSelectOptions(currentGrade: string | undefined) {
  const g = currentGrade?.trim()
  const opts = [...INDIVIDUAL_AFFILIATION_GRADE_OPTIONS]
  if (g && !opts.some(o => o.value === g)) opts.unshift({ value: g, label: g })
  return opts
}
