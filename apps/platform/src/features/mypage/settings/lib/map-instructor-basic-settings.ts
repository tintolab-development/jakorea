import type { InstructorRoleRequestProfile } from '@/features/mypage/instructor-apply/api/types'
import type { InstructorRoleRequestSettlement } from '@/features/mypage/instructor-apply/api/types'
import {
  mapInstructorFeeGradeLabel,
  mapInstructorJaGradeLabel,
} from '@/features/mypage/instructor-apply/api/response-codes'
import { EMPTY_SETTINGS_VALUE } from './constants'
import {
  formatSettingsDateDot,
  formatSettingsEmployment,
  formatSettingsGender,
  formatSettingsPhone,
  formatSettingsText,
  type SettingsInfoRow,
  type SettingsProfileInput,
} from './map-view'

const SOCIAL_PROVIDER_LABEL: Record<string, string> = {
  kakao: '카카오',
  google: '구글',
  naver: '네이버',
}

export function formatSettingsJoinedAtDot(value: string | undefined): string {
  if (!value?.trim()) return EMPTY_SETTINGS_VALUE
  const matched = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!matched) return EMPTY_SETTINGS_VALUE
  return `${matched[1]}.${matched[2]}.${matched[3]}`
}

export function formatSettingsLinkedSocialAccounts(accounts: string[] | undefined): string {
  if (!accounts?.length) return EMPTY_SETTINGS_VALUE
  const labels = accounts
    .map(provider => SOCIAL_PROVIDER_LABEL[provider.trim().toLowerCase()] ?? provider.trim())
    .filter(Boolean)
  return labels.length > 0 ? labels.join(' · ') : EMPTY_SETTINGS_VALUE
}

function formatInstructorAffiliation(
  cms: InstructorRoleRequestProfile | undefined,
  profile: SettingsProfileInput,
): string {
  const school = cms?.affiliation?.schoolName?.trim()
  if (school) return school
  const names = cms?.affiliation?.organizationNames?.map(name => name.trim()).filter(Boolean) ?? []
  if (names.length > 0) return names.join(', ')
  return formatSettingsText(profile.affiliationName ?? profile.schoolName)
}

/** 교사 겸 강사 — 교사 회원과 동일하게 학교명 우선 */
function formatDualSchoolAffiliation(
  cms: InstructorRoleRequestProfile | undefined,
  profile: SettingsProfileInput,
): string {
  return formatSettingsText(
    cms?.affiliation?.schoolName?.trim() || profile.schoolName?.trim() || profile.affiliationName,
  )
}

/** 교사 겸 강사 — 재직 현황 (강사 프로필 우선, 없으면 포털 교사 정보) */
function formatDualEmploymentStatus(
  cms: InstructorRoleRequestProfile | undefined,
  profile: SettingsProfileInput,
): string {
  const fromCms = formatSettingsEmployment(cms?.affiliation?.employmentStatus)
  if (fromCms !== EMPTY_SETTINGS_VALUE) return fromCms
  return formatSettingsEmployment(profile.teacherEmploymentStatus)
}

function formatInstructorHomeAddress(
  cms: InstructorRoleRequestProfile | undefined,
  profile: SettingsProfileInput,
): string {
  const line = cms?.homeAddress?.line?.trim()
  const detail = cms?.homeAddress?.detail?.trim()
  const fromCms = [line, detail].filter(Boolean).join(' ')
  if (fromCms) return fromCms
  const fromPortal = [profile.address?.trim(), profile.addressDetail?.trim()].filter(Boolean).join(' ')
  return fromPortal || EMPTY_SETTINGS_VALUE
}

function formatBusinessIncomeDisplay(settlement: InstructorRoleRequestSettlement | undefined): string {
  if (!settlement) return EMPTY_SETTINGS_VALUE
  return settlement.businessIncome ? '해당' : '해당 없음'
}

function formatInstructorCareerSummary(cms: InstructorRoleRequestProfile | undefined): string {
  const summary =
    cms?.instructorCareerSummary?.trim() || cms?.career?.summaryYears?.trim() || ''
  return summary || EMPTY_SETTINGS_VALUE
}

function formatFeeGradeLabel(
  cms: InstructorRoleRequestProfile | undefined,
  profile: SettingsProfileInput,
): string {
  const fromMetrics = mapInstructorFeeGradeLabel(profile.listMetrics?.instructorFeeGradeLabel)
  if (fromMetrics) return fromMetrics
  const fromProfile = mapInstructorFeeGradeLabel(cms?.defaultFeeGrade)
  return fromProfile || EMPTY_SETTINGS_VALUE
}

function formatJaGradeLabel(
  cms: InstructorRoleRequestProfile | undefined,
  profile: SettingsProfileInput,
): string {
  const fromMetrics = mapInstructorJaGradeLabel(profile.listMetrics?.jaEvaluationGrade)
  if (fromMetrics) return fromMetrics
  const fromProfile = mapInstructorJaGradeLabel(cms?.defaultJaGrade)
  return fromProfile || EMPTY_SETTINGS_VALUE
}

function formatSettlementStatusLabel(profile: SettingsProfileInput): string {
  return formatSettingsText(profile.listMetrics?.settlementStatusLabel)
}

export type MapInstructorBasicSettingsOptions = {
  linkedSocialAccounts?: string[]
  /** 교사 겸 강사 — 성별·재직 현황 행 추가, `소속` → `소속/학교` */
  isDual?: boolean
}

/** 강사 회원 설정 — 기본 정보 조회 행 (시안 순서) */
export function mapInstructorBasicSettingsRows(
  profile: SettingsProfileInput,
  options?: MapInstructorBasicSettingsOptions,
): SettingsInfoRow[] {
  const cms = profile.instructorProfile?.profile
  const settlement = profile.instructorProfile?.settlement
  const social =
    options?.linkedSocialAccounts ?? profile.socialAccounts ?? []
  const isDual = options?.isDual === true
  const affiliationRows: SettingsInfoRow[] = isDual
    ? [
        { label: '소속/학교', value: formatDualSchoolAffiliation(cms, profile) },
        { label: '재직 현황', value: formatDualEmploymentStatus(cms, profile) },
      ]
    : [{ label: '소속', value: formatInstructorAffiliation(cms, profile) }]

  return [
    { label: '정산 현황', value: formatSettlementStatusLabel(profile) },
    { label: 'JA 평가 등급', value: formatJaGradeLabel(cms, profile) },
    { label: '가입일', value: formatSettingsJoinedAtDot(profile.joinedAt) },
    { label: '이메일 ID', value: formatSettingsText(profile.email) },
    {
      label: '연동된 소셜 계정',
      value: formatSettingsLinkedSocialAccounts(social),
    },
    { label: '이름', value: formatSettingsText(profile.name), dividerBefore: true },
    { label: '휴대폰 번호', value: formatSettingsPhone(profile.phone) },
    { label: '생년월일', value: formatSettingsDateDot(profile.birthDate) },
    ...(isDual ? [{ label: '성별', value: formatSettingsGender(profile.gender) }] : []),
    ...affiliationRows,
    { label: '강사 경력', value: formatInstructorCareerSummary(cms) },
    { label: '자택 주소', value: formatInstructorHomeAddress(cms, profile) },
    { label: '강사비 등급', value: formatFeeGradeLabel(cms, profile) },
    { label: '사업소득자 여부', value: formatBusinessIncomeDisplay(settlement) },
    {
      label: '한 줄 소개',
      value: formatSettingsText(cms?.oneLineIntro),
      multiline: true,
    },
  ]
}
