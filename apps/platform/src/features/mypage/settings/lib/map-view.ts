import { EMPTY_SETTINGS_VALUE } from './constants.ts'

export type SettingsProfileInput = {
  joinedAt?: string
  name?: string
  phone?: string
  birthDate?: string
  gender?: string
  schoolEnrollmentStatus?: string
  schoolName?: string
  affiliationName?: string
  grade?: string
  address?: string
  addressDetail?: string
  postalCode?: string
  regionSido?: string
  regionSigungu?: string
  schoolOrganizationId?: number | null
  schoolAddress?: string
  teacherEmploymentStatus?: string
  email?: string
  external1365Id?: string
}

export type SettingsInfoRow = {
  label: string
  value: string
  action?: '1365-shortcut'
}

export type SettingsGuardianView = {
  name: string
  phone: string
  relationship: string
}

export type SettingsViewModel = {
  basicRows: SettingsInfoRow[]
  guardian: SettingsGuardianView | null
}

export function formatSettingsDateDot(value: string | undefined): string {
  if (!value?.trim()) return EMPTY_SETTINGS_VALUE
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length !== 8) return EMPTY_SETTINGS_VALUE
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`
}

export function formatSettingsJoinedAt(value: string | undefined): string {
  if (!value?.trim()) return EMPTY_SETTINGS_VALUE
  const matched = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!matched) return EMPTY_SETTINGS_VALUE
  return `${matched[1]}년 ${matched[2]}월 ${matched[3]}일`
}

export function formatSettingsPhone(value: string | undefined): string {
  const digits = value?.replace(/\D/g, '') ?? ''
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  const trimmed = value?.trim()
  return trimmed || EMPTY_SETTINGS_VALUE
}

export function formatSettingsGender(value: string | undefined): string {
  const normalized = value?.trim().toUpperCase()
  if (normalized === 'M' || normalized === 'MALE' || normalized === '남성') return '남성'
  if (normalized === 'F' || normalized === 'FEMALE' || normalized === '여성') return '여성'
  return EMPTY_SETTINGS_VALUE
}

export function formatSettingsEnrollment(value: string | undefined): string {
  const normalized = value?.trim().toUpperCase().replace(/-/g, '_')
  if (!normalized) return EMPTY_SETTINGS_VALUE
  if (normalized === 'ENROLLED' || normalized === 'IN_SCHOOL' || normalized === 'YES') {
    return '재학 중'
  }
  if (normalized === 'NONE' || normalized === 'NOT_ENROLLED' || normalized === 'NO') {
    return '해당 없음'
  }
  return EMPTY_SETTINGS_VALUE
}

export function formatSettingsGrade(value: string | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) return EMPTY_SETTINGS_VALUE
  if (trimmed.includes('학년')) return trimmed
  if (/^\d+$/.test(trimmed)) return `${trimmed}학년`
  return trimmed
}

export function formatSettingsText(value: string | undefined): string {
  return value?.trim() || EMPTY_SETTINGS_VALUE
}

function formatSettingsAddress(address: string | undefined, addressDetail: string | undefined) {
  return [address?.trim(), addressDetail?.trim()].filter(Boolean).join(' ')
}

export function mapPortalProfileToSettingsView(
  profile: SettingsProfileInput,
  guardian?: SettingsGuardianView | null,
): SettingsViewModel {
  const affiliation = profile.schoolName?.trim() || profile.affiliationName?.trim()
  const address = formatSettingsAddress(profile.address, profile.addressDetail)
  const volunteerId = profile.external1365Id?.trim() || EMPTY_SETTINGS_VALUE

  return {
    basicRows: [
      { label: '가입일', value: formatSettingsJoinedAt(profile.joinedAt) },
      { label: '이름', value: formatSettingsText(profile.name) },
      { label: '휴대폰 번호', value: formatSettingsPhone(profile.phone) },
      { label: '생년월일', value: formatSettingsDateDot(profile.birthDate) },
      { label: '성별', value: formatSettingsGender(profile.gender) },
      { label: '재학유무', value: formatSettingsEnrollment(profile.schoolEnrollmentStatus) },
      { label: '소속/학교명', value: formatSettingsText(affiliation) },
      { label: '학년', value: formatSettingsGrade(profile.grade) },
      { label: '자택 주소', value: address || EMPTY_SETTINGS_VALUE },
      { label: 'Email', value: formatSettingsText(profile.email) },
      { label: '1365 ID', value: volunteerId, action: '1365-shortcut' },
    ],
    guardian: guardian ?? null,
  }
}
