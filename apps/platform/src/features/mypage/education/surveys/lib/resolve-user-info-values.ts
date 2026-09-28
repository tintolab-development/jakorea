import type { SettingsProfileInput } from '@/features/mypage/settings/lib/map-view'
import {
  formatSettingsDateDot,
  formatSettingsGender,
  formatSettingsPhone,
  formatSettingsText,
} from '@/features/mypage/settings/lib/map-view'
import { resolveAffiliationLabel } from '@/features/mypage/lib/member-profile'
import { EMPTY_SETTINGS_VALUE } from '@/features/mypage/settings/lib/constants'

export type SurveyUserInfoProgramContext = {
  programTitle?: string
  /** 교육 진행 일정(진행 기간) 표시 문자열 */
  educationPeriodLabel?: string
  /** 신청자 유형 라벨 (일반회원·교사회원 등) */
  applicantTypeLabel?: string
  institutionName?: string
  institutionRegion?: string
  educationTarget?: string
  educationGrade?: string
  teamName?: string
  teamPartnerName?: string
}

export type ResolveSurveyUserInfoValuesInput = {
  profile: SettingsProfileInput
  program?: SurveyUserInfoProgramContext
}

function formatAddressRegion(profile: SettingsProfileInput): string {
  const fromRegions = [profile.regionSido?.trim(), profile.regionSigungu?.trim()]
    .filter(Boolean)
    .join(' ')
  if (fromRegions) return fromRegions
  return formatSettingsText(profile.address)
}

/** CMS 설문자 정보 `selectedUserFieldKeys` → Platform 로그인·프로그램 표시값 */
export function resolveSurveyUserInfoFieldValue(
  fieldKey: string,
  input: ResolveSurveyUserInfoValuesInput,
): string {
  const { profile, program } = input
  const affiliation =
    resolveAffiliationLabel({
      schoolName: profile.schoolName,
      affiliationName: profile.affiliationName,
    }) ?? ''

  switch (fieldKey) {
    case 'name':
      return formatSettingsText(profile.name)
    case 'gender':
      return formatSettingsGender(profile.gender)
    case 'birthDate':
      return formatSettingsDateDot(profile.birthDate)
    case 'phone':
      return formatSettingsPhone(profile.phone)
    case 'email':
      return formatSettingsText(profile.email)
    case 'addressRegion':
      return formatAddressRegion(profile)
    case 'addressDetail':
      return formatSettingsText(profile.addressDetail)
    case 'affiliation':
      return affiliation.trim() || EMPTY_SETTINGS_VALUE
    case 'applicantType':
      return formatSettingsText(program?.applicantTypeLabel)
    case 'programName':
      return formatSettingsText(program?.programTitle)
    case 'period':
      return formatSettingsText(program?.educationPeriodLabel)
    case 'institutionName':
      return formatSettingsText(program?.institutionName)
    case 'institutionRegion':
      return formatSettingsText(program?.institutionRegion)
    case 'educationTarget':
      return formatSettingsText(program?.educationTarget)
    case 'educationGrade':
      return formatSettingsText(program?.educationGrade)
    case 'teamName':
      return formatSettingsText(program?.teamName)
    case 'teamPartnerName':
      return formatSettingsText(program?.teamPartnerName)
    default:
      return EMPTY_SETTINGS_VALUE
  }
}

export function resolveSurveyUserInfoValues(
  fieldKeys: readonly string[],
  input: ResolveSurveyUserInfoValuesInput,
): Record<string, string> {
  const values: Record<string, string> = {}
  for (const key of fieldKeys) {
    values[key] = resolveSurveyUserInfoFieldValue(key, input)
  }
  return values
}

export function formatEducationPeriodLabel(lines: readonly string[] | undefined): string | undefined {
  const trimmed = (lines ?? []).map(line => line.trim()).filter(Boolean)
  if (trimmed.length === 0) return undefined
  return trimmed.join(', ')
}
