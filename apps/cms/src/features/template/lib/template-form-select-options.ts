/**
 * `/templates` 작성 양식·일반·경제 프로그램 등록폼 등에서 쓰는 CmsSelect 옵션 단일 출처.
 * - 세부 프로그램명·후원사·후원사 담당자: 목록은 별도 관리/API mock에서 조합하고, 여기서는 고정 분기값·라벨만 제공.
 * - IPS 2차(채널·Succeed 종류 등) 규칙은 `program-registration-ips-options.ts`에 유지.
 * - 교육 대상·참여자 유형은 `@jakorea/domain`에서 re-export(참여자 유형 「강사」 라벨만 CMS에서 덮어쓴다).
 */

import type { DomainSelectOption } from '@jakorea/domain/shared/types'
import { EDUCATION_TARGET_OPTIONS } from '@jakorea/domain/recruitment/education-target'
import { PARTICIPANT_TYPE_OPTIONS } from '@jakorea/domain/recruitment/participant-type'

export type TemplateFormSelectOption = DomainSelectOption

export const TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS: TemplateFormSelectOption[] =
  EDUCATION_TARGET_OPTIONS

/**
 * CMS 프로그램 등록·상세 참여자 유형 라벨 — 「교사/강사」 대신 「강사」(개인 / 학교·기관 / 강사 / 봉사자).
 * 값(`teacher_instructor`)은 도메인 그대로 둔다. Platform이 쓰는 도메인 옵션은 바꾸지 않는다.
 */
const CMS_PARTICIPANT_TYPE_LABEL_OVERRIDES: Partial<Record<string, string>> = {
  teacher_instructor: '강사',
}

export const TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS: TemplateFormSelectOption[] =
  PARTICIPANT_TYPE_OPTIONS.map(option => ({
    ...option,
    label: CMS_PARTICIPANT_TYPE_LABEL_OVERRIDES[option.value] ?? option.label,
  }))

// ── 세부 프로그램명 (관리 목록 + 고정) ─────────────────────────────

/** 관리 목록에 없을 때 선택하는 고정 값 */
export const TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE = '__detailed_program_none__' as const

export const TEMPLATE_FORM_DETAILED_PROGRAM_NONE_OPTION: TemplateFormSelectOption = {
  value: TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
  label: '해당 없음',
}

/** API·mock에서 만든 `{ value, label }[]` 끝에 `해당없음`을 붙인다. */
export function withDetailedProgramNoneOption(
  options: readonly TemplateFormSelectOption[]
): TemplateFormSelectOption[] {
  return [...options, TEMPLATE_FORM_DETAILED_PROGRAM_NONE_OPTION]
}

// ── 프로그램 진행 현황 ─────────────────────────────────────────────

export const TEMPLATE_FORM_PROGRAM_PROGRESS_OPTIONS: TemplateFormSelectOption[] = [
  { value: 'scheduled', label: '프로그램 진행 예정' },
  { value: 'recruiting_students', label: '프로그램 진행 예정' },
  { value: 'in_progress', label: '프로그램 진행 중' },
  { value: 'completed', label: '프로그램 진행 완료' },
]

// ── 교육 대상 (= 모집 대상) — @jakorea/domain/recruitment/education-target 에서 re-export

// ── 참여자 유형 — @jakorea/domain/recruitment/participant-type 에서 re-export

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

// ── 교육 과정 / IP / Course / Partner (옵션 값·라벨은 영문 고정) ─────────────

/**
 * 프로그램 등록 기본 정보 — IP·운영 주체·파트너 항목의 화면 라벨(한글).
 * 옵션 값·라벨(JA/Partner/Jointly, Yes/No)은 영문 그대로 둔다.
 * 용어는 임시안(QA-0439) — 기획 확정 시 여기만 바꾼다.
 */
export const TEMPLATE_FORM_IPS_FIELD_LABELS = {
  ipOwned: 'IP 소유 기관',
  courseDeliveredBy: '교육 운영 주체',
  partnerInvolvement: '파트너 참여 여부',
} as const

/** UJAT 등록·수정 기본 정보 — 시안(등록 폼_공통)과 상세 조회 화면은 영문 라벨을 쓴다. */
export const UJAT_FORM_IPS_FIELD_LABELS = {
  ipOwned: 'IP Owned',
  courseDeliveredBy: 'Course Delivered By',
  partnerInvolvement: 'Partner Involvement',
} as const

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
