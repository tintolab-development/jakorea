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
import {
  sortUjatVolunteerApplicants,
  sortUjatVolunteerDocPassedApplicants,
} from '@/features/program/ujat/model/ujat-volunteer-applicant'
import { GENERAL_PROGRAM_LIST_PAGE_SIZE } from '@/features/program/general/api/general-program-list-filter-params'

const PAGE_SIZE = GENERAL_PROGRAM_LIST_PAGE_SIZE

function assertApplicationsRemoteReady(): void {
  if (shouldUseUjatApplicationsRemoteApi()) return
  throw new Error(
    'UJAT 신청 API가 활성화되지 않았습니다. applications 모듈·원격 JWT를 확인해 주세요. mock 폴백은 사용하지 않습니다.'
  )
}

function filterDocPassed(rows: UjatVolunteerApplicantRow[]): UjatVolunteerApplicantRow[] {
  return rows.filter(row => row.documentScreeningStatus === 'pass')
}

function filterInterview2(rows: UjatVolunteerApplicantRow[]): UjatVolunteerApplicantRow[] {
  return rows.filter(
    row =>
      row.documentScreeningStatus === 'pass' &&
      (row.interviewAssignmentStatus === 'assigned' ||
        row.interviewAssignmentStatus === 'withdrawn')
  )
}

/** size=20 페이지를 이어 받아 상세 탭용 전체 목록 구성 (테이블 infinite UI는 후속) */
async function fetchAllOrganizationApplicationItems(programId: string) {
  const items = []
  let page = 0
  for (;;) {
    const result = await fetchOrganizationApplicationsRemote(programId, {
      page,
      size: PAGE_SIZE,
    })
    const chunk = result.items ?? []
    items.push(...chunk)
    const size = result.size ?? PAGE_SIZE
    const current = result.page ?? page
    const total = result.totalElements ?? items.length
    const totalPages = result.totalPages ?? (size > 0 ? Math.ceil(total / size) : current + 1)
    if (chunk.length === 0 || current + 1 >= totalPages) break
    page = current + 1
  }
  return items
}

async function fetchAllVolunteerApplicationItems(programId: string) {
  const items = []
  let page = 0
  for (;;) {
    const result = await fetchVolunteerApplicationsRemote(programId, {
      page,
      size: PAGE_SIZE,
    })
    const chunk = result.items ?? []
    items.push(...chunk)
    const size = result.size ?? PAGE_SIZE
    const current = result.page ?? page
    const total = result.totalElements ?? items.length
    const totalPages = result.totalPages ?? (size > 0 ? Math.ceil(total / size) : current + 1)
    if (chunk.length === 0 || current + 1 >= totalPages) break
    page = current + 1
  }
  return items
}

export async function listUjatInstitutionApplications(
  programId: string
): Promise<UjatInstitutionApplicationRow[]> {
  assertApplicationsRemoteReady()
  const items = await fetchAllOrganizationApplicationItems(programId)
  return items.map((dto, index) => mapOrganizationApplicationToUjatInstitutionRow(dto, index))
}

export async function listUjatVolunteerApplications(
  programId: string,
  half: UjatVolunteerRecruitHalf
): Promise<UjatVolunteerApplicantRow[]> {
  assertApplicationsRemoteReady()
  const items = await fetchAllVolunteerApplicationItems(programId)
  return sortUjatVolunteerApplicants(
    items.map((dto, index) =>
      mapVolunteerApplicationToUjatApplicantRow(dto, index, programId, half)
    )
  )
}

export async function listUjatVolunteerDocPassedApplications(
  programId: string,
  half: UjatVolunteerRecruitHalf
): Promise<UjatVolunteerApplicantRow[]> {
  const all = await listUjatVolunteerApplications(programId, half)
  return sortUjatVolunteerDocPassedApplicants(filterDocPassed(all))
}

export async function listUjatVolunteerInterview2Applications(
  programId: string,
  half: UjatVolunteerRecruitHalf
): Promise<UjatVolunteerApplicantRow[]> {
  return filterInterview2(await listUjatVolunteerApplications(programId, half))
}
