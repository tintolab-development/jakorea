import {
  mapParticipantToParticipatingIndividualRow,
  mapParticipantToParticipatingInstructorRow,
  mapParticipantToParticipatingSchoolRow,
  mapParticipantToParticipatingVolunteerRow,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import { shouldUseProgramProgressHttpRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import {
  fetchProgramParticipantsRemote,
  fetchProgramSchedulesViaDashboardRemote,
  fetchScheduleAttendancesRemote,
  giveUpProgramParticipantRemote,
  putScheduleAttendancesRemote,
  type ProgramParticipantsListQuery,
} from '@/features/program/general/api/program-progress-api-client'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'

export const GENERAL_PROGRAM_PROGRESS_PAGE_SIZE = 20

export interface GeneralProgramProgressListPage<Row> {
  rows: Row[]
  page: number
  size: number
  totalElements: number
  hasMore: boolean
}

function resolveProgressListPage<Row>(
  rows: Row[],
  response: {
    page?: number
    size?: number
    totalElements?: number
    totalPages?: number
  },
  requestedPage: number
): GeneralProgramProgressListPage<Row> {
  const page = response.page ?? requestedPage
  const size = response.size ?? GENERAL_PROGRAM_PROGRESS_PAGE_SIZE
  const totalElements = response.totalElements ?? page * size + rows.length
  const hasMore =
    response.totalPages != null
      ? page + 1 < response.totalPages
      : (page + 1) * size < totalElements || rows.length === size
  return { rows, page, size, totalElements, hasMore }
}

/**
 * 진행현황 participants / attendances — mock 폴백 없음 (API only).
 */
function assertProgramProgressRemoteReady(): void {
  if (!shouldUseProgramProgressHttpRemoteApi()) {
    throw new Error(
      '프로그램 진행현황 API가 활성화되지 않았습니다. programs(또는 1사1교 opt-in)·programProgress 모듈과 API 로그인을 확인해 주세요. mock 폴백은 사용하지 않습니다.'
    )
  }
}

export async function fetchGeneralProgramParticipants(
  programId: string,
  params?: ProgramParticipantsListQuery
): Promise<ParticipatingIndividualParticipantRow[]> {
  return (await fetchGeneralProgramParticipantsPage(programId, params)).rows
}

export async function fetchGeneralProgramParticipantsPage(
  programId: string,
  params?: ProgramParticipantsListQuery
): Promise<GeneralProgramProgressListPage<ParticipatingIndividualParticipantRow>> {
  assertProgramProgressRemoteReady()
  const requestedPage = params?.page ?? 0
  const page = await fetchProgramParticipantsRemote(programId, {
    page: requestedPage,
    size: GENERAL_PROGRAM_PROGRESS_PAGE_SIZE,
    participantType: 'INDIVIDUAL',
    ...params,
  })
  const rows = (page.items ?? []).map((item, index) =>
    mapParticipantToParticipatingIndividualRow(
      item,
      requestedPage * GENERAL_PROGRAM_PROGRESS_PAGE_SIZE + index,
      programId
    )
  )
  return resolveProgressListPage(rows, page, requestedPage)
}

export async function fetchGeneralParticipatingInstitutions(
  programId: string
): Promise<ParticipatingSchoolRow[]> {
  return (await fetchGeneralParticipatingInstitutionsPage(programId)).rows
}

export async function fetchGeneralParticipatingInstitutionsPage(
  programId: string,
  pageParam = 0
): Promise<GeneralProgramProgressListPage<ParticipatingSchoolRow>> {
  assertProgramProgressRemoteReady()
  const page = await fetchProgramParticipantsRemote(programId, {
    page: pageParam,
    size: GENERAL_PROGRAM_PROGRESS_PAGE_SIZE,
    participantType: 'ORGANIZATION',
  })
  const rows = (page.items ?? []).map((item, index) =>
    mapParticipantToParticipatingSchoolRow(
      item,
      pageParam * GENERAL_PROGRAM_PROGRESS_PAGE_SIZE + index,
      programId
    )
  )
  return resolveProgressListPage(rows, page, pageParam)
}

export async function fetchGeneralParticipatingInstructors(
  programId: string
): Promise<ParticipatingInstructorRow[]> {
  return (await fetchGeneralParticipatingInstructorsPage(programId)).rows
}

export async function fetchGeneralParticipatingInstructorsPage(
  programId: string,
  pageParam = 0
): Promise<GeneralProgramProgressListPage<ParticipatingInstructorRow>> {
  assertProgramProgressRemoteReady()
  const page = await fetchProgramParticipantsRemote(programId, {
    page: pageParam,
    size: GENERAL_PROGRAM_PROGRESS_PAGE_SIZE,
    participantType: 'INSTRUCTOR',
  })
  const rows = (page.items ?? []).map((item, index) =>
    mapParticipantToParticipatingInstructorRow(
      item,
      pageParam * GENERAL_PROGRAM_PROGRESS_PAGE_SIZE + index,
      programId
    )
  )
  return resolveProgressListPage(rows, page, pageParam)
}

export async function fetchGeneralParticipatingVolunteers(
  programId: string
): Promise<ParticipatingVolunteerRow[]> {
  return (await fetchGeneralParticipatingVolunteersPage(programId)).rows
}

export async function fetchGeneralParticipatingVolunteersPage(
  programId: string,
  pageParam = 0
): Promise<GeneralProgramProgressListPage<ParticipatingVolunteerRow>> {
  assertProgramProgressRemoteReady()
  const page = await fetchProgramParticipantsRemote(programId, {
    page: pageParam,
    size: GENERAL_PROGRAM_PROGRESS_PAGE_SIZE,
    participantType: 'VOLUNTEER',
  })
  const rows = (page.items ?? []).map((item, index) =>
    mapParticipantToParticipatingVolunteerRow(
      item,
      pageParam * GENERAL_PROGRAM_PROGRESS_PAGE_SIZE + index,
      programId
    )
  )
  return resolveProgressListPage(rows, page, pageParam)
}

export async function fetchGeneralScheduleAttendances(programId: string, scheduleId: string) {
  assertProgramProgressRemoteReady()
  return fetchScheduleAttendancesRemote(programId, scheduleId)
}

export async function saveGeneralScheduleAttendances(
  scheduleId: string,
  attendances: import('@/shared/api/generated/dashboard/schemas/attendanceItemRequest').AttendanceItemRequest[]
) {
  assertProgramProgressRemoteReady()
  await putScheduleAttendancesRemote(scheduleId, { attendances })
}

/**
 * dashboard program-schedules + schedule attendances + participants.
 * mock/null 폴백 없음.
 */
export async function fetchGeneralProgressAttendanceBundle(programId: string): Promise<{
  schedules: import('@/shared/api/generated/dashboard/schemas/dashboardProgramScheduleResponse').DashboardProgramScheduleResponse[]
  participants: import('@/shared/api/generated/dashboard/schemas/participantListItemResponse').ParticipantListItemResponse[]
  attendancesByScheduleId: Record<
    string,
    import('@/shared/api/generated/dashboard/schemas/attendanceItemResponse').AttendanceItemResponse[]
  >
}> {
  assertProgramProgressRemoteReady()
  const [schedules, firstParticipantsPage] = await Promise.all([
    fetchProgramSchedulesViaDashboardRemote(programId),
    fetchProgramParticipantsRemote(programId, {
      page: 0,
      size: GENERAL_PROGRAM_PROGRESS_PAGE_SIZE,
    }),
  ])
  const participantItems = [...(firstParticipantsPage.items ?? [])]
  const participantTotalPages =
    firstParticipantsPage.totalPages ??
    Math.ceil(
      (firstParticipantsPage.totalElements ?? participantItems.length) /
        (firstParticipantsPage.size ?? GENERAL_PROGRAM_PROGRESS_PAGE_SIZE)
    )
  for (let page = 1; page < participantTotalPages; page += 1) {
    const nextPage = await fetchProgramParticipantsRemote(programId, {
      page,
      size: GENERAL_PROGRAM_PROGRESS_PAGE_SIZE,
    })
    participantItems.push(...(nextPage.items ?? []))
  }
  const attendancesByScheduleId: Record<
    string,
    import('@/shared/api/generated/dashboard/schemas/attendanceItemResponse').AttendanceItemResponse[]
  > = {}
  await Promise.all(
    schedules
      .filter(s => s.scheduleId != null)
      .map(async s => {
        const scheduleId = String(s.scheduleId)
        try {
          attendancesByScheduleId[scheduleId] = await fetchScheduleAttendancesRemote(
            programId,
            scheduleId
          )
        } catch {
          attendancesByScheduleId[scheduleId] = []
        }
      })
  )
  return {
    schedules,
    participants: participantItems,
    attendancesByScheduleId,
  }
}

export async function fetchGeneralProgramLectureReports(
  programId: string
): Promise<unknown[]> {
  return (await fetchGeneralProgramLectureReportsPage(programId)).rows
}

export async function fetchGeneralProgramLectureReportsPage(
  programId: string,
  pageParam = 0,
  options?: { instructorMemberId?: number }
): Promise<GeneralProgramProgressListPage<unknown>> {
  assertProgramProgressRemoteReady()
  const { fetchProgramLectureReportsRemote } = await import(
    '@/features/program/general/api/program-progress-api-client'
  )
  const page = await fetchProgramLectureReportsRemote(programId, {
    page: pageParam,
    size: GENERAL_PROGRAM_PROGRESS_PAGE_SIZE,
    instructorMemberId: options?.instructorMemberId,
  })
  return resolveProgressListPage(page.items ?? [], page, pageParam)
}

/** 프로그램(또는 강사 스코프) 강의보고서 ZIP 다운로드 */
export async function downloadGeneralProgramLectureReports(
  programId: string,
  options?: { instructorMemberId?: number }
): Promise<void> {
  assertProgramProgressRemoteReady()
  const { downloadProgramLectureReportsRemote } = await import(
    '@/features/program/general/api/program-progress-api-client'
  )
  const { downloadFromBulkEndpoint } = await import(
    '@/features/user/api/download-bulk-endpoint'
  )
  const { getFileDownload, fetchFileContentBlob } = await import(
    '@/shared/lib/admin-file-upload'
  )
  const { downloadBlob, generateFilename } = await import('@/shared/utils/file-download')

  const job = await downloadProgramLectureReportsRemote(programId, {
    instructorMemberId: options?.instructorMemberId,
  })
  const endpoint = job.downloadUrl?.trim() || job.downloadEndpoint?.trim()
  if (endpoint) {
    await downloadFromBulkEndpoint(endpoint, '강의보고서_일괄', 'zip')
    return
  }
  if (job.fileObjectId != null) {
    try {
      const resolved = await getFileDownload(job.fileObjectId)
      const url = resolved.downloadUrl?.trim()
      if (url) {
        await downloadFromBulkEndpoint(url, '강의보고서_일괄', 'zip')
        return
      }
    } catch {
      /* fall through to content blob */
    }
    const blob = await fetchFileContentBlob(job.fileObjectId)
    await downloadBlob(blob, generateFilename('강의보고서_일괄', 'zip'))
    return
  }
  throw new Error('강의보고서 다운로드 URL이 없습니다.')
}

/** 제출 파일(fileObjectId) 단건 다운로드 — 「강의보고서 보기」 */
export async function downloadGeneralProgramLectureReportFiles(
  fileObjectIds: number[],
  filenamePrefix: string
): Promise<void> {
  assertProgramProgressRemoteReady()
  const ids = fileObjectIds.filter(id => Number.isFinite(id) && id > 0)
  if (ids.length === 0) {
    throw new Error('다운로드할 강의보고서 파일이 없습니다.')
  }
  const { getFileDownload, fetchFileContentBlob } = await import(
    '@/shared/lib/admin-file-upload'
  )
  const { downloadFromBulkEndpoint } = await import(
    '@/features/user/api/download-bulk-endpoint'
  )
  const { downloadBlob, generateFilename } = await import('@/shared/utils/file-download')

  for (const [index, fileObjectId] of ids.entries()) {
    const prefix = ids.length > 1 ? `${filenamePrefix}_${index + 1}` : filenamePrefix
    try {
      const resolved = await getFileDownload(fileObjectId)
      const url = resolved.downloadUrl?.trim()
      if (url) {
        await downloadFromBulkEndpoint(url, prefix, 'pdf')
        continue
      }
    } catch {
      /* fall through */
    }
    const blob = await fetchFileContentBlob(fileObjectId)
    await downloadBlob(blob, generateFilename(prefix, 'pdf'))
  }
}

/**
 * 참여 기관(ORGANIZATION participant) 활동 포기.
 * `organization-applications/{id}/give-up` 가 아님 — participantId 필수.
 */
export async function giveUpGeneralParticipatingInstitution(
  programId: string,
  participantId: string,
  reason: string,
  options?: { stopScheduleId?: number }
): Promise<void> {
  assertProgramProgressRemoteReady()
  const trimmed = reason.trim()
  if (!trimmed) {
    throw new Error('활동 포기 사유가 필요합니다.')
  }
  await giveUpProgramParticipantRemote(programId, participantId, {
    reason: trimmed,
    ...(options?.stopScheduleId != null ? { stopScheduleId: options.stopScheduleId } : {}),
  })
}
