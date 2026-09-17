import {
  fetchOrganizationApplicationsRemote,
  fetchVolunteerApplicationsRemote,
} from '@/features/program/general/api/applications-api-client'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import {
  mapOrganizationApplicationToUjatInstitutionRow,
  mapVolunteerApplicationToUjatApplicantRow,
} from '@/features/program/ujat/api/applications-adapters'
import type { UjatInstitutionApplicationRow } from '@/features/program/ujat/ui/detail-modal/application-institution/list/types'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { sortUjatVolunteerApplicants } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import { GENERAL_PROGRAM_LIST_PAGE_SIZE } from '@/features/program/general/api/general-program-list-filter-params'

const PAGE_SIZE = GENERAL_PROGRAM_LIST_PAGE_SIZE

function assertApplicationsRemoteReady(): void {
  if (shouldUseUjatApplicationsRemoteApi()) return
  throw new Error(
    'UJAT 신청 API가 활성화되지 않았습니다. applications 모듈·원격 JWT를 확인해 주세요. mock 폴백은 사용하지 않습니다.'
  )
}

export type UjatInstitutionApplicationsPage = {
  rows: UjatInstitutionApplicationRow[]
  page: number
  size: number
  totalElements: number
  hasMore: boolean
}

export type UjatVolunteerApplicationsPage = {
  rows: UjatVolunteerApplicantRow[]
  page: number
  size: number
  totalElements: number
  hasMore: boolean
}

function resolvePageMeta(input: {
  itemCount: number
  requestedPage: number
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
}) {
  const size = input.size ?? PAGE_SIZE
  const page = input.page ?? input.requestedPage
  const totalElements = input.totalElements ?? page * size + input.itemCount
  const totalPages = input.totalPages ?? (size > 0 ? Math.ceil(totalElements / size) : page + 1)
  return {
    page,
    size,
    totalElements,
    hasMore: page + 1 < totalPages,
  }
}

export async function listUjatInstitutionApplicationsPage(
  programId: string,
  pageParam = 0
): Promise<UjatInstitutionApplicationsPage> {
  assertApplicationsRemoteReady()
  const response = await fetchOrganizationApplicationsRemote(programId, {
    page: pageParam,
    size: PAGE_SIZE,
  })
  const meta = resolvePageMeta({
    itemCount: response.items?.length ?? 0,
    requestedPage: pageParam,
    page: response.page,
    size: response.size,
    totalElements: response.totalElements,
    totalPages: response.totalPages,
  })
  return {
    ...meta,
    rows: (response.items ?? []).map((dto, index) =>
      mapOrganizationApplicationToUjatInstitutionRow(dto, meta.page * meta.size + index)
    ),
  }
}

export async function listUjatVolunteerApplicationsPage(
  programId: string,
  half: UjatVolunteerRecruitHalf,
  pageParam = 0
): Promise<UjatVolunteerApplicationsPage> {
  assertApplicationsRemoteReady()
  const response = await fetchVolunteerApplicationsRemote(programId, {
    page: pageParam,
    size: PAGE_SIZE,
  })
  const meta = resolvePageMeta({
    itemCount: response.items?.length ?? 0,
    requestedPage: pageParam,
    page: response.page,
    size: response.size,
    totalElements: response.totalElements,
    totalPages: response.totalPages,
  })
  const rows = (response.items ?? []).map((dto, index) =>
    mapVolunteerApplicationToUjatApplicantRow(dto, meta.page * meta.size + index, programId, half)
  )
  return {
    ...meta,
    rows: sortUjatVolunteerApplicants(rows),
  }
}
