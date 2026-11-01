import type { SchoolTeacherEmploymentStatus } from '@jakorea/domain/instructor/employment-status'
import type { Gender } from '@jakorea/domain/instructor/gender'
import type { InstructorMemberType } from '@jakorea/domain/instructor/member-type'
import type { InstructorSharedProfileFormValues } from '@jakorea/domain/instructor/profile-form-values'
import type { PortalProfileResponse } from '@/features/auth/sign-in'
import {
  formatBirthDateInput,
  MOCK_VERIFIED_NAME,
  MOCK_VERIFIED_PHONE,
} from '@/features/auth/sign-up'
import { getDevMemberProfile } from '@/shared/lib/dev-member-profile'
import { MOCK_MYPAGE_USER_NAME } from '../lib/constants'
import type { PlatformMemberProfile } from '../model/types'

/**
 * 자택 주소 잠금
 * - 교사: 회원정보에 자택 주소 없음 → 도로명·상세 모두 편집
 * - 개인(general): 회원정보 주소 고정 → 도로명·상세 모두 비활성
 */
export function resolveInstructorApplyHomeAddressLock(
  locked: Pick<InstructorApplyLockedBasicInfo, 'memberType'>,
): { roadLocked: boolean; detailLocked: boolean } {
  if (locked.memberType !== 'general') {
    return { roadLocked: false, detailLocked: false }
  }
  return { roadLocked: true, detailLocked: true }
}

/** 개인 회원만 자택 주소 전체 고정 */
export function isInstructorApplyHomeAddressLocked(
  locked: Pick<InstructorApplyLockedBasicInfo, 'memberType'>,
): boolean {
  const { roadLocked, detailLocked } = resolveInstructorApplyHomeAddressLock(locked)
  return roadLocked && detailLocked
}

/** 회원가입(프로필) 고정 필드를 draft·API 값 위에 병합 */
export function applyLockedBasicToInstructorForm(
  base: InstructorSharedProfileFormValues,
  locked: InstructorApplyLockedBasicInfo,
  preserveEmploymentStatus = false,
): InstructorSharedProfileFormValues {
  const { roadLocked, detailLocked } = resolveInstructorApplyHomeAddressLock(locked)
  const employmentStatus =
    locked.memberType === 'school_teacher'
      ? preserveEmploymentStatus
        ? base.employmentStatus
        : locked.employmentStatus
      : ''
  return {
    ...base,
    name: locked.name,
    gender: locked.gender || base.gender,
    birthDate: locked.birthDate,
    contact: locked.contact,
    email: locked.email,
    homeAddress: roadLocked ? locked.homeAddress : base.homeAddress,
    homeAddressDetail: detailLocked ? locked.homeAddressDetail : base.homeAddressDetail,
    memberType: locked.memberType,
    schoolName: locked.memberType === 'school_teacher' ? locked.schoolName : '',
    employmentStatus,
    affiliationName: locked.memberType === 'general' ? locked.affiliationName : '',
    affiliationNone: locked.memberType === 'general' ? locked.affiliationNone : false,
  }
}

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
      /** 교사 회원정보에 자택 주소 없음 — 강사 신청에서 직접 입력 */
      homeAddress: '',
      homeAddressDetail: '',
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
  if (!import.meta.env.DEV) {
    return {
      name: '',
      gender: 'male',
      birthDate: '',
      contact: '',
      email: '',
      homeAddress: '',
      homeAddressDetail: '',
      memberType: 'general',
      schoolName: '',
      employmentStatus: '',
      affiliationName: '',
      affiliationNone: false,
    }
  }
  const teacher = isTeacherDevProfile(profile)
  return {
    name: MOCK_MYPAGE_USER_NAME || MOCK_VERIFIED_NAME,
    gender: 'male',
    birthDate: '1990.01.01',
    contact: MOCK_VERIFIED_PHONE,
    email: 'hong@example.com',
    homeAddress: teacher ? '' : '서울특별시 중구 세종대로 110',
    homeAddressDetail: teacher ? '' : 'JA Korea',
    memberType: teacher ? 'school_teacher' : 'general',
    schoolName: teacher ? '서울초등학교' : '',
    employmentStatus: teacher ? 'ACTIVE' : '',
    affiliationName: teacher ? '' : '주식회사 예시',
    affiliationNone: false,
  }
}

/** @deprecated use getMockInstructorApplyLockedBasic */
export const MOCK_INSTRUCTOR_APPLY_LOCKED_BASIC = getMockInstructorApplyLockedBasic()
