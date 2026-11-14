import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import { signupPaths } from './endpoints'
import type {
  HomepageEmailAvailabilityResponse,
  HomepageGeneralSignupRequest,
  HomepageOrganizationSearchResponse,
  HomepageSignupResponse,
  HomepageTeacherSignupRequest,
  PortalSignupIdentityPrecheckRequest,
  PortalSignupIdentityPrecheckResponse,
  SearchHomepageSchoolsParams,
  SignupTermsCatalogResponse,
} from '../model/types/signup-api.types'

export async function getEmailAvailability(email: string) {
  const { data } = await axiosClient.get<HomepageEmailAvailabilityResponse>(
    signupPaths.emailAvailability(),
    { params: { email } },
  )
  return data
}

export async function getSignupTerms(params: {
  memberType: 'GENERAL' | 'TEACHER'
  birthDate?: string
}) {
  const { data } = await axiosClient.get<SignupTermsCatalogResponse>(signupPaths.terms(), {
    params: {
      memberType: params.memberType,
      ...(params.birthDate ? { birthDate: params.birthDate } : {}),
    },
  })
  return data
}

type SkipAuthConfig = InternalAxiosRequestConfig & { skipAuth?: boolean; skipRefresh?: boolean }

function unwrapEnvelope(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') return {}
  const root = payload as Record<string, unknown>
  if (root.data && typeof root.data === 'object') {
    return root.data as Record<string, unknown>
  }
  return root
}

/**
 * POST /api/portal/auth/signup/identity-precheck — PUBLIC.
 * 본인인증 직후 이미 가입했는지·관리자 등록 회원인지 확인한다. 본인인증 세션을 소비하지 않는다.
 */
export async function postSignupIdentityPrecheck(
  body: PortalSignupIdentityPrecheckRequest,
): Promise<PortalSignupIdentityPrecheckResponse> {
  const { data } = await axiosClient.post<unknown>(
    signupPaths.identityPrecheck(),
    { identityVerificationSessionId: body.identityVerificationSessionId, profileToken: body.profileToken.trim() },
    { skipAuth: true, skipRefresh: true } as SkipAuthConfig,
  )
  const root = unwrapEnvelope(data)
  return {
    alreadyRegistered: root.alreadyRegistered === true,
    registeredByAdmin: root.registeredByAdmin === true,
    maskedEmail: typeof root.maskedEmail === 'string' ? root.maskedEmail : null,
  }
}

export async function postGeneralSignup(body: HomepageGeneralSignupRequest) {
  const { data } = await axiosClient.post<HomepageSignupResponse>(
    signupPaths.signupGeneral(),
    body,
  )
  return data
}

export async function postTeacherSignup(body: HomepageTeacherSignupRequest) {
  const { data } = await axiosClient.post<HomepageSignupResponse>(
    signupPaths.signupTeacher(),
    body,
  )
  return data
}

export async function searchHomepageSchools(params: SearchHomepageSchoolsParams) {
  const { data } = await axiosClient.get<HomepageOrganizationSearchResponse>(
    signupPaths.schools(),
    {
      params: {
        keyword: params.keyword,
        regionSido: params.regionSido,
        regionSigungu: params.regionSigungu,
        organizationCategory: params.organizationCategory,
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    },
  )
  return data
}
