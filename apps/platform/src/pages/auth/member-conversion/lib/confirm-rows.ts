import type { PortalProfileResponse } from '@/features/auth/sign-in/api/types'
import {
  formatSettingsDateDot,
  formatSettingsEnrollment,
  formatSettingsGender,
  formatSettingsGrade,
  formatSettingsPhone,
  formatSettingsText,
} from '@/features/mypage/settings/lib/map-view'

export type MemberConversionConfirmRow = {
  label: string
  value: string
}

function memberTypeLabel(profile: PortalProfileResponse) {
  if (profile.teacher === true) return '교사 회원'
  const memberType = profile.memberType?.trim().toUpperCase()
  if (memberType === 'TEACHER') return '교사 회원'
  if (memberType) return '일반 회원'
  return '-'
}

function regionAddress(profile: PortalProfileResponse) {
  const address = [profile.address?.trim(), profile.addressDetail?.trim()].filter(Boolean).join(' ')
  return address || '-'
}

/** 회원 전환 확인 — 시안 행 순서. 값이 없으면 `-`. */
export function buildMemberConversionConfirmRows(
  profile: PortalProfileResponse,
): MemberConversionConfirmRow[] {
  return [
    { label: '회원 유형', value: memberTypeLabel(profile) },
    { label: '이름', value: formatSettingsText(profile.name) },
    { label: '휴대폰 번호', value: formatSettingsPhone(profile.phone) },
    { label: '생년월일', value: formatSettingsDateDot(profile.birthDate) },
    { label: '성별', value: formatSettingsGender(profile.gender) },
    { label: '재학유무', value: formatSettingsEnrollment(profile.schoolEnrollmentStatus) },
    { label: '소속/학교명', value: formatSettingsText(profile.schoolName) },
    { label: '학년', value: formatSettingsGrade(profile.grade) },
    { label: '소속 기관명', value: formatSettingsText(profile.affiliationName) },
    { label: '지역 주소', value: regionAddress(profile) },
    { label: '이메일 ID', value: formatSettingsText(profile.email) },
    { label: '1365 ID', value: formatSettingsText(profile.external1365Id) },
  ]
}
