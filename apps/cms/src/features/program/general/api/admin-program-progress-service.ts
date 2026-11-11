import {
  mapParticipantToParticipatingIndividualRow,
  mapParticipantToParticipatingInstructorRow,
  mapParticipantToParticipatingSchoolRow,
  mapParticipantToParticipatingVolunteerRow,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import { shouldUseProgramProgressHttpRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import {
  fetchProgramAssignmentSubmissionsRemote,
  fetchProgramParticipantsRemote,
  fetchAttendancesByScheduleIdsRemote,
  fetchProgramSchedulesViaDashboardRemote,
  fetchScheduleAttendancesRemote,
  giveUpProgramParticipantRemote,
  createProgramInstructorParticipantRemote,
  createProgramParticipantRemote,
  patchParticipantTextbookDeliveryRemote,
  putParticipantAssignedOrganizationsRemote,
  fetchVolunteerAssignmentsRemote,
  type VolunteerAssignedOrganizationsRequest,
  changeParticipantSchedulesRemote,
  putScheduleAttendancesRemote,
  fetchParticipantEducationScopeRemote,
  putParticipantEducationScopeRemote,
  fetchParticipantSubmissionTeamRemote,
  putParticipantSubmissionTeamRemote,
  fetchProgramSubmissionTeamsRemote,
  createProgramSubmissionTeamRemote,
  type ProgramParticipantsListQuery,
} from '@/features/program/general/api/program-progress-api-client'
import { fetchAdminProgramLectureReportContentRemote } from '@/features/program/general/api/programs-api-client'
import type { LectureReportPreviewContent } from '@/features/program/general/lib/build-lecture-report-issuance-preview'
import type { ParticipatingInstructorLectureReportRow } from '@/features/program/general/api/adapters/lecture-reports-adapters'
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
  /** 희망 일정은 participants `requestedSchedules[]`로 함께 내려온다 — 신청 목록 순회·행별 조회 없음 */
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
  attendances: import('@/features/program/general/api/adapters/progress-attendance-adapters').AttendanceItemWriteRequest[]
) {
  assertProgramProgressRemoteReady()
  await putScheduleAttendancesRemote(scheduleId, { attendances })
}

export async function fetchAllProgramProgressParticipants(programId: string) {
  const firstParticipantsPage = await fetchProgramParticipantsRemote(programId, {
    page: 0,
    size: GENERAL_PROGRAM_PROGRESS_PAGE_SIZE,
  })
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
  return participantItems
}

/**
 * 365일 이하 구간별로 순서대로 조회해 이어 붙인다(구간 경계 일정은 처음 나온 것만).
 * 구간이 없으면 BE 기본 범위 1회. 각 구간은 서버 순서(start_at, id) 그대로.
 */
async function fetchProgramSchedulesInDateRanges(
  programId: string,
  ranges: readonly import('@/features/program/general/api/program-progress-api-client').ProgramScheduleDateRange[] | null | undefined
) {
  if (!ranges || ranges.length === 0) return fetchProgramSchedulesViaDashboardRemote(programId)
  const merged: Awaited<ReturnType<typeof fetchProgramSchedulesViaDashboardRemote>> = []
  const seen = new Set<string>()
  for (const range of ranges) {
    const items = await fetchProgramSchedulesViaDashboardRemote(programId, range)
    for (const item of items) {
      const key = item.scheduleId != null ? String(item.scheduleId) : null
      if (key != null) {
        if (seen.has(key)) continue
        seen.add(key)
      }
      merged.push(item)
    }
  }
  return merged
}

/**
 * dashboard program-schedules + schedule attendances + participants.
 * mock/null 폴백 없음.
 */
export async function fetchGeneralProgressAttendanceBundle(
  programId: string,
  scheduleDateRanges?: readonly import('@/features/program/general/api/program-progress-api-client').ProgramScheduleDateRange[] | null
): Promise<{
  schedules: import('@/shared/api/generated/dashboard/schemas/dashboardProgramScheduleResponse').DashboardProgramScheduleResponse[]
  participants: import('@/shared/api/generated/dashboard/schemas/participantListItemResponse').ParticipantListItemResponse[]
  attendancesByScheduleId: Record<
    string,
    import('@/shared/api/generated/dashboard/schemas/attendanceItemResponse').AttendanceItemResponse[]
  >
}> {
  assertProgramProgressRemoteReady()
  const [schedules, participantItems] = await Promise.all([
    fetchProgramSchedulesInDateRanges(programId, scheduleDateRanges),
    fetchAllProgramProgressParticipants(programId),
  ])
  const scheduleIdList = schedules
    .map(s => s.scheduleId)
    .filter((id): id is number => id != null && Number.isFinite(Number(id)) && Number(id) > 0)
    .map(id => Number(id))

  const attendancesByScheduleId = await fetchAttendancesByScheduleIdsRemote(
    programId,
    scheduleIdList
  )
  return {
    schedules,
    participants: participantItems,
    attendancesByScheduleId,
  }
}

/** 일반 개인 진행 현황 · 과제 관리. mock/null 폴백 없음. items[].scheduleId 정본만 사용. */
export async function fetchGeneralProgressAssignmentBundle(programId: string) {
  assertProgramProgressRemoteReady()
  const [submissions, giveUpParticipants] = await Promise.all([
    fetchProgramAssignmentSubmissionsRemote(programId),
    fetchAllProgramProgressParticipants(programId),
  ])
  return { ...submissions, giveUpParticipants }
}

export async function fetchGeneralProgramLectureReports(programId: string): Promise<unknown[]> {
  return (await fetchGeneralProgramLectureReportsPage(programId)).rows
}

export async function fetchGeneralProgramLectureReportsPage(
  programId: string,
  pageParam = 0,
  options?: { instructorMemberId?: number }
): Promise<GeneralProgramProgressListPage<unknown>> {
  assertProgramProgressRemoteReady()
  const { fetchProgramLectureReportsRemote } =
    await import('@/features/program/general/api/program-progress-api-client')
  const page = await fetchProgramLectureReportsRemote(programId, {
    page: pageParam,
    size: GENERAL_PROGRAM_PROGRESS_PAGE_SIZE,
    instructorMemberId: options?.instructorMemberId,
  })
  return resolveProgressListPage(page.items ?? [], page, pageParam)
}

/** 관리자 강의보고서 답변·양식·첨부 API를 미리보기 데이터로 변환한다. */
export async function fetchGeneralProgramLectureReportPreviewContent(
  _programId: string,
  row: ParticipatingInstructorLectureReportRow
): Promise<LectureReportPreviewContent> {
  assertProgramProgressRemoteReady()
  if (row.reportId == null || row.reportId <= 0) {
    throw new Error('강의보고서 ID가 목록 응답에 없습니다.')
  }

  const detail = await fetchAdminProgramLectureReportContentRemote(row.reportId)

  return {
    formResponseId: detail.formResponseId,
    templateVersionId: detail.templateVersionId,
    form: detail.form,
    answers: detail.answers,
    files: (detail.files ?? [])
      .filter(file => typeof file.fileObjectId === 'number' && Number.isFinite(file.fileObjectId))
      .map(file => ({
        fileObjectId: file.fileObjectId!,
        originalFileName: file.originalFileName,
      })),
    submittedAt: typeof detail.submittedAt === 'string' ? detail.submittedAt : null,
  }
}

/** 프로그램(또는 강사 스코프) 강의보고서 ZIP 다운로드 */
export async function downloadGeneralProgramLectureReports(
  programId: string,
  options?: { instructorMemberId?: number }
): Promise<void> {
  assertProgramProgressRemoteReady()
  const { downloadProgramLectureReportsRemote } =
    await import('@/features/program/general/api/program-progress-api-client')
  const { saveLectureReportBulkDownloadJob } = await import(
    '@/shared/lib/lecture-report-bulk-download'
  )

  const job = await downloadProgramLectureReportsRemote(programId, {
    instructorMemberId: options?.instructorMemberId,
  })
  await saveLectureReportBulkDownloadJob(job, '강의보고서_일괄')
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
  const { downloadAdminFile } = await import('@/shared/lib/admin-file-upload')
  const { generateFilename } = await import('@/shared/utils/file-download')

  for (const [index, fileObjectId] of ids.entries()) {
    const prefix = ids.length > 1 ? `${filenamePrefix}_${index + 1}` : filenamePrefix
    await downloadAdminFile({
      fileObjectId,
      fileName: generateFilename(prefix, 'pdf'),
    })
  }
}

/** 참여 기관 실제 교육 일정 변경. `PATCH …/participants/{id}/schedules` — `{ fromDate, toDate }`. */
export async function changeGeneralParticipatingInstitutionSchedules(
  programId: string,
  participantId: string,
  payload: {
    fromDate: string
    toDate: string
  }
): Promise<void> {
  assertProgramProgressRemoteReady()
  await changeParticipantSchedulesRemote(programId, participantId, {
    fromDate: payload.fromDate,
    toDate: payload.toDate,
  })
}

/**
 * 참여 기관(ORGANIZATION participant) 활동 포기.
 * `organization-applications/{id}/give-up` 가 아님 — participantId 필수.
 */
export async function createGeneralProgramInstructorParticipant(
  programId: string,
  memberId: number
) {
  assertProgramProgressRemoteReady()
  return createProgramInstructorParticipantRemote(programId, {
    participantType: 'INSTRUCTOR',
    memberId,
  })
}

/** @deprecated 진행 현황 봉사자 추가 등록 — `registerGeneralVolunteerParticipant` 사용 */
export async function createGeneralProgramVolunteerParticipant(
  programId: string,
  memberId: number,
  volunteerKind: 'GENERAL' | 'EMPLOYEE' = 'GENERAL'
) {
  assertProgramProgressRemoteReady()
  return createProgramParticipantRemote(programId, {
    participantType: 'VOLUNTEER',
    memberId,
    volunteerKind,
  })
}

export async function registerGeneralVolunteerParticipant(
  programId: string,
  payload: import('@/features/program/general/api/program-progress-api-client').VolunteerParticipantRegisterRequest
) {
  assertProgramProgressRemoteReady()
  const { registerVolunteerParticipantRemote } =
    await import('@/features/program/general/api/program-progress-api-client')
  return registerVolunteerParticipantRemote(programId, payload)
}

export async function fetchGeneralEmployeeVolunteerCounts(
  programId: string,
  organizationApplicationId?: number
) {
  assertProgramProgressRemoteReady()
  const { fetchEmployeeVolunteerCountsRemote } =
    await import('@/features/program/general/api/program-progress-api-client')
  return fetchEmployeeVolunteerCountsRemote(programId, organizationApplicationId)
}

export async function saveGeneralEmployeeVolunteerCounts(
  programId: string,
  payload: import('@/shared/api/generated/program-progress/schemas/employeeVolunteerCountReplaceRequest').EmployeeVolunteerCountReplaceRequest
) {
  assertProgramProgressRemoteReady()
  const { putEmployeeVolunteerCountsRemote } =
    await import('@/features/program/general/api/program-progress-api-client')
  return putEmployeeVolunteerCountsRemote(programId, payload)
}

export async function updateGeneralParticipatingInstitutionTextbookDelivery(
  programId: string,
  participantId: string,
  textbookDeliveryStatus: import('@/features/program/general/api/program-progress-api-client').TextbookDeliveryStatus
) {
  assertProgramProgressRemoteReady()
  return patchParticipantTextbookDeliveryRemote(programId, participantId, {
    textbookDeliveryStatus,
  })
}

export async function saveGeneralVolunteerAssignedOrganizations(
  programId: string,
  participantId: string,
  payload: VolunteerAssignedOrganizationsRequest
) {
  assertProgramProgressRemoteReady()
  return putParticipantAssignedOrganizationsRemote(programId, participantId, payload)
}

/** 기관형 봉사자 배정 회차 행(기관별 배정 알림 상태 포함) */
export async function fetchGeneralVolunteerAssignments(
  programId: string,
  volunteerParticipantId: string,
  signal?: AbortSignal
) {
  assertProgramProgressRemoteReady()
  return fetchVolunteerAssignmentsRemote(programId, { volunteerParticipantId }, signal)
}

export async function giveUpGeneralParticipatingInstitution(
  programId: string,
  participantId: string,
  payload: import('@/shared/api/generated/dashboard/schemas/applicationGiveUpRequest').ApplicationGiveUpRequest
): Promise<void> {
  assertProgramProgressRemoteReady()
  const trimmed = payload.reason.trim()
  if (!trimmed) {
    throw new Error('활동 포기 사유가 필요합니다.')
  }
  await giveUpProgramParticipantRemote(programId, participantId, {
    reason: trimmed,
    ...(payload.stopScheduleId != null ? { stopScheduleId: payload.stopScheduleId } : {}),
    ...(payload.faultParty ? { faultParty: payload.faultParty } : {}),
  })
}

export async function fetchGeneralParticipantEducationScope(
  programId: string,
  participantId: string
) {
  assertProgramProgressRemoteReady()
  return fetchParticipantEducationScopeRemote(programId, participantId)
}

export async function saveGeneralParticipantEducationScope(
  programId: string,
  participantId: string,
  payload: import('@/features/program/general/api/program-progress-api-client').ParticipantEducationScopeUpdateRequest
) {
  assertProgramProgressRemoteReady()
  return putParticipantEducationScopeRemote(programId, participantId, payload)
}

export async function fetchGeneralParticipantSubmissionTeam(
  programId: string,
  participantId: string
) {
  assertProgramProgressRemoteReady()
  return fetchParticipantSubmissionTeamRemote(programId, participantId)
}

export async function saveGeneralParticipantSubmissionTeam(
  programId: string,
  participantId: string,
  payload: import('@/features/program/general/api/program-progress-api-client').ParticipantSubmissionTeamUpdateRequest
) {
  assertProgramProgressRemoteReady()
  return putParticipantSubmissionTeamRemote(programId, participantId, payload)
}

export async function fetchGeneralProgramSubmissionTeams(programId: string) {
  assertProgramProgressRemoteReady()
  return fetchProgramSubmissionTeamsRemote(programId)
}

export async function createGeneralProgramSubmissionTeam(programId: string, teamName: string) {
  assertProgramProgressRemoteReady()
  return createProgramSubmissionTeamRemote(programId, { teamName })
}
