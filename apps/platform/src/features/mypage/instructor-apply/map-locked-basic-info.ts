import type { SchoolTeacherEmploymentStatus } from '@jakorea/domain/instructor/employment-status'
import type { Gender } from '@jakorea/domain/instructor/gender'
import type { InstructorMemberType } from '@jakorea/domain/instructor/member-type'
import type { PortalProfileResponse } from '@/features/auth/sign-in'
import {
  formatBirthDateInput,
  MOCK_VERIFIED_NAME,
  MOCK_VERIFIED_PHONE,
} from '@/features/auth/sign-up'
import { getDevMemberProfile } from '@/shared/lib/dev-member-profile'
import { MOCK_MYPAGE_USER_NAME } from '../lib/constants'
import type { PlatformMemberProfile } from '../model/types'

/** 강사 신청 — 회원가입 정보로 고정·비활성화하는 기본정보 */
export type InstructorApplyLockedBasicInfo = {
  name: string
  gender: Gender | ''
  birthDate: string
  contact: string
  email: string
  homeAddress: string
  homeAddressDetail: string
  /** 회원가입 유형 — UI 미노출, 값만 고정 */
  memberType: InstructorMemberType
  schoolName: string
  employmentStatus: SchoolTeacherEmploymentStatus | ''
  affiliationName: string
  affiliationNone: boolean
}

/** API `YYYY-MM-DD` | `YYYYMMDD` → 폼 `YYYY.MM.DD` */
export function toInstructorFormBirthDate(value: string | undefined): string {
  if (!value?.trim()) return ''
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return formatBirthDateInput(digits)
}

export function toInstructorFormGender(value: string | undefined): Gender | '' {
  const normalized = value?.trim().toUpperCase()
  if (normalized === 'M' || normalized === 'MALE') return 'male'
  if (normalized === 'F' || normalized === 'FEMALE') return 'female'
  return ''
}

export function toInstructorFormMemberType(
  profile: PortalProfileResponse | null | undefined,
): InstructorMemberType {
  if (profile?.teacher === true) return 'school_teacher'
  const memberType = profile?.memberType?.trim().toUpperCase()
  if (memberType === 'TEACHER') return 'school_teacher'
  return 'general'
}

export function toInstructorFormEmploymentStatus(
  value: string | undefined,
): SchoolTeacherEmploymentStatus | '' {
  const normalized = value?.trim().toUpperCase().replace(/-/g, '_')
  if (normalized === 'ACTIVE' || normalized === 'EMPLOYED') return 'ACTIVE'
  if (normalized === 'ON_LEAVE') return 'ON_LEAVE'
  if (normalized === 'TRANSFERRED') return 'TRANSFERRED'
  if (normalized === 'WITHDRAWN') return 'WITHDRAWN'
  return ''
}

export function mapPortalProfileToLockedBasicInfo(
  profile: PortalProfileResponse | null | undefined,
): InstructorApplyLockedBasicInfo {
  const memberType = toInstructorFormMemberType(profile)
  const affiliationName = profile?.affiliationName?.trim() ?? ''

  if (memberType === 'school_teacher') {
    return {
      name: profile?.name?.trim() ?? '',
      gender: toInstructorFormGender(profile?.gender),
      birthDate: toInstructorFormBirthDate(profile?.birthDate),
      contact: profile?.phone?.trim() ?? '',
      email: profile?.email?.trim() ?? '',
      homeAddress: profile?.address?.trim() ?? '',
      homeAddressDetail: profile?.addressDetail?.trim() ?? '',
      memberType,
      schoolName: profile?.schoolName?.trim() ?? '',
      employmentStatus: toInstructorFormEmploymentStatus(profile?.teacherEmploymentStatus),
      affiliationName: '',
      affiliationNone: false,
    }
  }

  return {
    name: profile?.name?.trim() ?? '',
    gender: toInstructorFormGender(profile?.gender),
    birthDate: toInstructorFormBirthDate(profile?.birthDate),
    contact: profile?.phone?.trim() ?? '',
    email: profile?.email?.trim() ?? '',
    homeAddress: profile?.address?.trim() ?? '',
    homeAddressDetail: profile?.addressDetail?.trim() ?? '',
    memberType: 'general',
    schoolName: '',
    employmentStatus: '',
    affiliationName,
    affiliationNone: !affiliationName,
  }
}

function isTeacherDevProfile(profile: PlatformMemberProfile) {
  return profile === 'school_teacher' || profile === 'instructor_dual'
}

/** 원격 API 미사용(dev) — 회원가입 mock / dev 회원 프로필 반영 */
export function getMockInstructorApplyLockedBasic(
  profile: PlatformMemberProfile = getDevMemberProfile(),
): InstructorApplyLockedBasicInfo {
  const teacher = isTeacherDevProfile(profile)
  return {
    name: MOCK_MYPAGE_USER_NAME || MOCK_VERIFIED_NAME,
    gender: 'male',
    birthDate: '1990.01.01',
    contact: MOCK_VERIFIED_PHONE,
    email: 'hong@example.com',
    homeAddress: '서울특별시 중구 세종대로 110',
    homeAddressDetail: 'JA Korea',
    memberType: teacher ? 'school_teacher' : 'general',
    schoolName: teacher ? '서울초등학교' : '',
    employmentStatus: teacher ? 'ACTIVE' : '',
    affiliationName: teacher ? '' : '주식회사 예시',
    affiliationNone: false,
  }
}

/** @deprecated use getMockInstructorApplyLockedBasic */
export const MOCK_INSTRUCTOR_APPLY_LOCKED_BASIC = getMockInstructorApplyLockedBasic()
