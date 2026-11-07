import { axiosClient } from '@/shared/api/axios-instance'
import {
  parseInstructorTransportPreview,
  type InstructorTransportPreview,
} from '../../settlements/lib/instructor-transport-preview'
import {
  parseLectureFeePreview,
  type LectureFeePreview,
} from '../../settlements/lib/lecture-fee-preview'
import { readInstructorEducationScheduleFields } from '../lib/instructor-education-schedule-display.ts'
import {
  buildLectureReportSubmitBody,
  getLectureReportApiErrorMessage,
  type LectureReportContextType,
  type LectureReportFormBinding,
  type LectureReportSubmitInput,
} from '../lib/lecture-report-contract'

export type { LectureFeePreview }

export type LectureReportStatus =
  | 'UPCOMING'
  | 'AVAILABLE'
  | 'OVERDUE'
  | 'BUSINESS_ENDED'
  | 'SUBMITTED'
export type LectureReportLectureStatus = 'UPCOMING' | 'COMPLETED'
export type LectureReportInstructorRole = 'LEAD' | 'ASSISTANT'

export type LectureReportAssignment = {
  assignmentId: number
  instructorApplicationId: number | null
  programId: number
  scheduleId: number
  startAt: string | null
  endAt: string | null
  scheduleName: string | null
  sessionNo: number | null
  /** GET 원본에 있으면 사용. 없으면 null — 추정하지 않는다. */
  scheduleRole?: string | null
  educationSlotKey?: string | null
  scheduleKind?: string | null
  /** 해당 회차 커리큘럼 차시 수. sessionNo를 넣지 않는다. */
  curriculumSessionCount?: number | null
  institutionName: string | null
  grade: string | null
  lectureStatus: LectureReportLectureStatus | string
  reportStatus: LectureReportStatus | string | null
  submitDueAt: string | null
  canSubmit: boolean
  reportId: number | null
  instructorRole?: LectureReportInstructorRole | string | null
  institutionAddress?: string | null
  /** 서버 숫자 km. 문자열이 아니다. */
  distanceFromHome?: number | null
  /** 지급조서 확인 강사비 산출. 키는 항상 존재. 미리보기 없으면 null */
  lectureFeePreview?: LectureFeePreview | null
  /** GET items[].transportPreview 파싱 결과. 산출 없으면 null */
  instructorTransportPreview?: InstructorTransportPreview | null
}

export type LectureReportPage = {
  items: LectureReportAssignment[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type LectureReportState = {
  assignmentId: number
  instructorApplicationId: number | null
  programId: number
  programScheduleId: number
  reportId: number | null
  submitted: boolean
  submittedAt: string | null
  formResponseId: number | null
  templateVersionId: number | null
  attachmentGroupId: number | null
  reportStatus: LectureReportStatus
  scheduleStatus: string
  submitDueAt: string | null
  canSubmit: boolean
  bindingId: number | null
}

export type LectureReportContent = {
  assignmentId: number
  reportId: number
  formResponseId: number
  programId: number
  scheduleId: number
  bindingId: number
  templateVersionId: number
  formType: string
  title: string | null
  responseStatus: string
  submittedAt: string | null
  form: Record<string, unknown>
  answers: Record<string, unknown>
  files: Array<{
    formSubmissionFileId: number
    questionKey: string | null
    fileObjectId: number
    originalFileName: string | null
    contentType: string | null
    fileSize: number | null
    downloadable: boolean
  }>
}

export type { LectureReportContextType, LectureReportFormBinding, LectureReportSubmitInput }

/** @deprecated LectureReportSubmitInput 사용 */
export type LectureReportFormResponseInput = LectureReportSubmitInput & {
  programId?: number
  programFormBindingId?: number
  programScheduleId?: number
  contextType?: LectureReportContextType
  contextId?: number
}

export class LectureReportApiError extends Error {
  readonly response: { status: number; data: unknown }

  constructor(data: unknown, status = 200) {
    super('강의보고서 API 응답을 처리할 수 없습니다.')
    this.name = 'LectureReportApiError'
    this.response = { status, data }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isSafeNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function emptyToNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeLectureReportAssignment(value: unknown): LectureReportAssignment {
  const row = (isRecord(value) ? value : {}) as LectureReportAssignment
  const scheduleFields = readInstructorEducationScheduleFields(value)
  return {
    ...row,
    institutionName: emptyToNull(row.institutionName),
    grade: emptyToNull(row.grade),
    scheduleRole: scheduleFields.scheduleRole,
    educationSlotKey: scheduleFields.educationSlotKey,
    scheduleKind: scheduleFields.scheduleKind,
    sessionNo: scheduleFields.sessionNo ?? row.sessionNo ?? null,
    scheduleName: scheduleFields.scheduleName ?? emptyToNull(row.scheduleName),
    curriculumSessionCount: scheduleFields.curriculumSessionCount,
    lectureFeePreview: parseLectureFeePreview(isRecord(value) ? value.lectureFeePreview : null),
    instructorTransportPreview: parseInstructorTransportPreview(value),
  }
}

function unwrap<T>(value: unknown): T {
  if (isRecord(value) && 'success' in value) {
    if (value.success !== true || !('data' in value) || value.data == null) {
      throw new LectureReportApiError(value)
    }
    return unwrap<T>(value.data)
  }
  if (value == null) throw new LectureReportApiError(value)
  return value as T
}

const LECTURE_REPORT_ASSIGNMENT_PAGE_SIZE_MAX = 10

function unwrapPage(value: unknown): LectureReportPage {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    !isSafeNonNegativeInteger(value.page) ||
    !isSafeNonNegativeInteger(value.size) ||
    value.size <= 0 ||
    !isSafeNonNegativeInteger(value.totalElements) ||
    !isSafeNonNegativeInteger(value.totalPages)
  ) {
    throw new LectureReportApiError(value)
  }
  return {
    items: value.items.map(normalizeLectureReportAssignment),
    page: value.page,
    size: value.size,
    totalElements: value.totalElements,
    totalPages: value.totalPages,
  }
}

/**
 * GET /api/portal/me/programs/{programId}/lecture-report-assignments
 * page는 0부터, size 최대 10. items 없으면 [].
 */
export async function getLectureReportAssignments(
  programId: number,
  page = 0,
  signal?: AbortSignal,
  size = LECTURE_REPORT_ASSIGNMENT_PAGE_SIZE_MAX
): Promise<LectureReportPage> {
  const safeSize = Math.min(Math.max(1, Math.trunc(size)), LECTURE_REPORT_ASSIGNMENT_PAGE_SIZE_MAX)
  const { data } = await axiosClient.get(
    `/api/portal/me/programs/${programId}/lecture-report-assignments`,
    {
      params: { page, size: safeSize },
      signal,
    }
  )
  return unwrapPage(unwrap(data))
}

export async function getAllLectureReportAssignments(
  programId: number,
  signal?: AbortSignal
): Promise<LectureReportAssignment[]> {
  const first = await getLectureReportAssignments(
    programId,
    0,
    signal,
    LECTURE_REPORT_ASSIGNMENT_PAGE_SIZE_MAX
  )
  const items = [...(first.items ?? [])]
  const totalPages = Math.max(1, first.totalPages ?? 1)
  for (let page = 1; page < totalPages && page < 100; page += 1) {
    const next = await getLectureReportAssignments(
      programId,
      page,
      signal,
      LECTURE_REPORT_ASSIGNMENT_PAGE_SIZE_MAX
    )
    items.push(...(next.items ?? []))
  }
  return items
}

export async function getLectureReportState(assignmentId: number): Promise<LectureReportState> {
  const { data } = await axiosClient.get(
    `/api/portal/me/instructor-assignments/${assignmentId}/lecture-report`
  )
  return unwrap(data)
}

export async function getLectureReportBinding(
  assignmentId: number
): Promise<LectureReportFormBinding> {
  const { data } = await axiosClient.get(
    `/api/portal/me/instructor-assignments/${assignmentId}/lecture-report/form-binding`
  )
  return unwrap(data)
}

/**
 * 강의보고서 바인딩 전용 공통 렌더.
 * APPLICATION 바인딩(신청서)에는 사용하지 않는다 — 403 PERMISSION_DENIED가 정상.
 */
export async function renderLectureReport(
  programId: number,
  bindingId: number
): Promise<Record<string, unknown>> {
  const { data } = await axiosClient.get(
    `/api/portal/me/programs/${programId}/form-bindings/${bindingId}/render`
  )
  return unwrap(data)
}

/**
 * POST /api/portal/me/instructor-assignments/{assignmentId}/lecture-report
 * 신규 inline 제출은 answers·fileObjectIdsByQuestion을 이 body로 전달한다.
 * form-bindings/.../responses 를 거치지 않는다.
 */
export async function submitLectureReport(
  assignmentId: number,
  input: LectureReportSubmitInput
): Promise<{ reportId: number; formResponseId?: number }> {
  const { data } = await axiosClient.post(
    `/api/portal/me/instructor-assignments/${assignmentId}/lecture-report`,
    buildLectureReportSubmitBody(input)
  )
  return unwrap(data)
}

export async function getLectureReportContent(assignmentId: number): Promise<LectureReportContent> {
  const { data } = await axiosClient.get(
    `/api/portal/me/instructor-assignments/${assignmentId}/lecture-report/content`,
    { headers: { 'Cache-Control': 'no-store' } }
  )
  return unwrap(data)
}

export { getLectureReportApiErrorMessage, buildLectureReportSubmitBody }
