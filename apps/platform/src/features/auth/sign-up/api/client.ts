import { axiosClient } from '@/shared/api/axios-instance'
import { signupPaths } from './endpoints'
import type {
  HomepageEmailAvailabilityResponse,
  HomepageGeneralSignupRequest,
  HomepageOrganizationSearchResponse,
  HomepageSignupResponse,
  HomepageTeacherSignupRequest,
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
