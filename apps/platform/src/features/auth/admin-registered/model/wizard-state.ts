import type {
  EmploymentStatus,
  GenderType,
  MemberType,
  SchoolStatus,
} from '@/features/auth/sign-up'
import type { PortalProfileResponse } from '@/features/auth/sign-in'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { MOCK_ADMIN_REGISTERED_PROFILE } from '../lib/constants'
import type { AdminProvisionedOnboardingStep } from '../lib/onboarding-step'

const ADMIN_REGISTERED_WIZARD_STORAGE_KEY = 'platform:dev:admin-registered-wizard'

export type AdminRegisteredEntrySource = 'first-login' | 'sign-up'

export type AdminRegisteredWizardState = {
  email: string
  entrySource?: AdminRegisteredEntrySource
  memberType?: MemberType
  birthDate?: string
  gender?: GenderType
  /** 본인인증 세션 — 인증 완료 후에만 설정 */
  identityVerificationSessionId?: number
  /** NICE 본인인증 프로필 토큰 — identity/confirm 용 */
  identityProfileToken?: string
  verifiedName?: string
  verifiedPhone?: string
  schoolStatus?: SchoolStatus
  schoolName?: string
  schoolAddress?: string
  /** 학교 검색으로 고른 CMS organizationId */
  schoolOrganizationId?: number | null
  /** NEIS 학교 코드 — CMS PK 없을 때 schoolSelection.externalSchoolCode */
  schoolNeisCode?: string | null
  grade?: string
  address?: string
  addressDetail?: string
  postalCode?: string
  regionSido?: string
  regionSigungu?: string
  volunteerId?: string
  employmentStatus?: EmploymentStatus
  /** GET /api/portal/me/profile 원본 — teacherEmploymentStatus 등 매핑 참조 */
  portalProfile?: PortalProfileResponse
  /** GET /api/portal/me/profile 반영 여부 */
  profileHydrated?: boolean
  /** 로그인·GET /me 의 `adminProvisionedOnboardingStep` 스냅샷 */
  adminProvisionedOnboardingStep?: AdminProvisionedOnboardingStep
}

function readWizardState(): AdminRegisteredWizardState | null {
  const raw = window.localStorage.getItem(ADMIN_REGISTERED_WIZARD_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as AdminRegisteredWizardState

    if (!parsed.email?.trim()) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function writeWizardState(state: AdminRegisteredWizardState) {
  window.localStorage.setItem(ADMIN_REGISTERED_WIZARD_STORAGE_KEY, JSON.stringify(state))
}

export function getAdminRegisteredWizardState() {
  return readWizardState()
}

export function setAdminRegisteredWizardState(state: AdminRegisteredWizardState) {
  writeWizardState(state)
}

export function updateAdminRegisteredWizardState(partial: Partial<AdminRegisteredWizardState>) {
  const current = readWizardState()

  if (!current) {
    return null
  }

  const next = { ...current, ...partial }
  writeWizardState(next)
  return next
}

export function initAdminRegisteredWizardState(
  email: string,
  entrySource: AdminRegisteredEntrySource = 'first-login',
) {
  const seedMock = !isRemoteApiConfigured()
  const state: AdminRegisteredWizardState = {
    email: email.trim(),
    entrySource,
    ...(seedMock ? MOCK_ADMIN_REGISTERED_PROFILE : {}),
    profileHydrated: seedMock,
  }

  writeWizardState(state)
  return state
}

export function isAdminRegisteredSignUpEntry() {
  return getAdminRegisteredWizardState()?.entrySource === 'sign-up'
}

export function clearAdminRegisteredWizardState() {
  window.localStorage.removeItem(ADMIN_REGISTERED_WIZARD_STORAGE_KEY)
}

export function requireAdminRegisteredWizardState() {
  const state = readWizardState()

  if (!state?.email) {
    window.location.assign('/auth/admin-registered/notice')
    return null
  }

  return state
}

const EMPTY_PROFILE_FALLBACK = {
  schoolStatus: 'none' as SchoolStatus,
  schoolName: '',
  grade: '',
  address: '',
  addressDetail: '',
  postalCode: '',
  regionSido: '',
  regionSigungu: '',
  volunteerId: '',
}

export function getAdminRegisteredProfileFields(state: AdminRegisteredWizardState) {
  const fallback = state.profileHydrated ? EMPTY_PROFILE_FALLBACK : MOCK_ADMIN_REGISTERED_PROFILE

  return {
    schoolStatus: state.schoolStatus ?? fallback.schoolStatus,
    schoolName: state.schoolName ?? fallback.schoolName,
    grade: state.grade ?? fallback.grade,
    address: state.address ?? fallback.address,
    addressDetail: state.addressDetail ?? fallback.addressDetail,
    postalCode: state.postalCode ?? '',
    regionSido: state.regionSido ?? '',
    regionSigungu: state.regionSigungu ?? '',
    volunteerId: state.volunteerId ?? fallback.volunteerId,
  }
}
