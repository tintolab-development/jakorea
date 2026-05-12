/**
 * `/templates` 작성 양식·일반·경제 프로그램 등록폼 등에서 쓰는 CmsSelect 옵션 단일 출처.
 * - 세부 프로그램명·후원사·후원사 담당자: 목록은 별도 관리/API mock에서 조합하고, 여기서는 고정 분기값·라벨만 제공.
 * - IPS 2차(채널·Succeed 종류 등) 규칙은 `program-registration-ips-options.ts`에 유지.
 */

export type TemplateFormSelectOption = {
  value: string
  label: string
}

// ── 세부 프로그램명 (관리 목록 + 고정) ─────────────────────────────

/** 관리 목록에 없을 때 선택하는 고정 값 */
export const TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE = '__detailed_program_none__' as const

export const TEMPLATE_FORM_DETAILED_PROGRAM_NONE_OPTION: TemplateFormSelectOption = {
  value: TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
  label: '해당없음',
}

/** API·mock에서 만든 `{ value, label }[]` 끝에 `해당없음`을 붙인다. */
export function withDetailedProgramNoneOption(
  options: readonly TemplateFormSelectOption[]
): TemplateFormSelectOption[] {
  return [...options, TEMPLATE_FORM_DETAILED_PROGRAM_NONE_OPTION]
}

// ── 프로그램 진행 현황 ─────────────────────────────────────────────

export const TEMPLATE_FORM_PROGRAM_PROGRESS_OPTIONS: TemplateFormSelectOption[] = [
  { value: 'scheduled', label: '진행 예정' },
  { value: 'in_progress', label: '진행 중' },
  { value: 'completed', label: '진행 완료' },
]

// ── 교육 대상 (= 모집 대상) ───────────────────────────────────────

export const TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS: TemplateFormSelectOption[] = [
  { value: 'elementary', label: '초등학생' },
  { value: 'middle', label: '중학생' },
  { value: 'high', label: '고등학생' },
  { value: 'university', label: '대학(원)생' },
  { value: 'adult', label: '성인' },
]

// ── 참여자 유형 (셀렉트·체크 라벨 공통) ───────────────────────────

export const TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS: TemplateFormSelectOption[] = [
  { value: 'school_institution', label: '학교/기관' },
  { value: 'individual', label: '개인' },
  { value: 'teacher_instructor', label: '교사/강사' },
  { value: 'volunteer', label: '봉사자' },
]

// ── 사업 분야 (일반 프로그램 등록폼) ───────────────────────────────

export const TEMPLATE_FORM_BUSINESS_AREA_OPTIONS: TemplateFormSelectOption[] = [
  { value: 'career_employment', label: '진로취업' },
  { value: 'economy_finance', label: '경제금융' },
  { value: 'entrepreneurship', label: '기업가정신' },
  { value: 'digital_literacy', label: '디지털 리터러시' },
]

/** 1사1교 경제금융교육 등 경제 전용 폼 — 단일 분기 */
export const TEMPLATE_FORM_ECONOMY_BUSINESS_FIELD_OPTIONS: readonly TemplateFormSelectOption[] = [
  { value: 'economy_education', label: '경제교육' },
] as const

// ── 교육 과정 / IP / Course / Partner (영문 라벨 고정) ─────────────

export const TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS = [
  { value: 'traditional_paper', label: 'Traditional (Paper)' },
  { value: 'digital_computer', label: 'Digital (Computer)' },
  { value: 'blended_paper_computer', label: 'Blended (Paper & Computer)' },
] as const satisfies readonly TemplateFormSelectOption[]

export const TEMPLATE_FORM_IP_OWNED_OPTIONS = [
  { value: 'ja', label: 'JA' },
  { value: 'partner', label: 'Partner' },
  { value: 'jointly', label: 'Jointly' },
] as const satisfies readonly TemplateFormSelectOption[]

export const TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS = [
  { value: 'ja', label: 'JA' },
  { value: 'partner', label: 'Partner' },
  { value: 'jointly', label: 'Jointly' },
] as const satisfies readonly TemplateFormSelectOption[]

export const TEMPLATE_FORM_PARTNER_INVOLVEMENT_OPTIONS: TemplateFormSelectOption[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]
