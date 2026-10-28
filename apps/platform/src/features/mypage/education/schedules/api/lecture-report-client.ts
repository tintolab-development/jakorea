import { axiosClient } from '@/shared/api/axios-instance'
import {
  buildLectureReportFormResponseBody,
  getLectureReportApiErrorMessage,
  type LectureReportContextType,
  type LectureReportFormBinding,
  type LectureReportFormResponseInput,
} from '../lib/lecture-report-contract'

export type LectureReportStatus = 'UPCOMING' | 'AVAILABLE' | 'OVERDUE' | 'BUSINESS_ENDED' | 'SUBMITTED'
export type LectureReportAssignment = {
  assignmentId: number; instructorApplicationId: number | null; programId: number; scheduleId: number
  startAt: string | null; endAt: string | null; scheduleName: string | null; sessionNo: number | null
  institutionName: string | null; grade: string | null; lectureStatus: string; reportStatus: string | null
  submitDueAt: string | null; canSubmit: boolean; reportId: number | null
  instructorRole?: string | null
  institutionAddress?: string | null
  distanceFromHome?: string | null
}
export type LectureReportPage = { items: LectureReportAssignment[]; page: number; size: number; totalElements: number; totalPages: number }
export type LectureReportState = {
  assignmentId: number; instructorApplicationId: number | null; programId: number; programScheduleId: number
  reportId: number | null; submitted: boolean; submittedAt: string | null; formResponseId: number | null
  templateVersionId: number | null; attachmentGroupId: number | null; reportStatus: LectureReportStatus
  scheduleStatus: string; submitDueAt: string | null; canSubmit: boolean; bindingId: number | null
}
export type LectureReportContent = {
  assignmentId: number; reportId: number; formResponseId: number; programId: number; scheduleId: number
  bindingId: number; templateVersionId: number; formType: string; title: string | null
  responseStatus: string; submittedAt: string | null; form: Record<string, unknown>
  answers: Record<string, unknown>; files: Array<{ formSubmissionFileId: number; questionKey: string | null; fileObjectId: number; originalFileName: string | null; contentType: string | null; fileSize: number | null; downloadable: boolean }>
}
export type { LectureReportContextType, LectureReportFormBinding, LectureReportFormResponseInput }

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
  return value as unknown as LectureReportPage
}

export async function getLectureReportAssignments(
  programId: number,
  page = 0,
  signal?: AbortSignal,
  size = 10,
): Promise<LectureReportPage> {
  const { data } = await axiosClient.get(`/api/portal/me/programs/${programId}/lecture-report-assignments`, {
    params: { page, size },
    signal,
  })
  return unwrapPage(unwrap(data))
}

export async function getAllLectureReportAssignments(
  programId: number,
  signal?: AbortSignal,
): Promise<LectureReportAssignment[]> {
  const first = await getLectureReportAssignments(programId, 0, signal, 50)
  const items = [...(first.items ?? [])]
  const totalPages = Math.max(1, first.totalPages ?? 1)
  for (let page = 1; page < totalPages && page < 20; page += 1) {
    const next = await getLectureReportAssignments(programId, page, signal, 50)
    items.push(...(next.items ?? []))
  }
  return items
}
export async function getLectureReportState(assignmentId: number): Promise<LectureReportState> {
  const { data } = await axiosClient.get(`/api/portal/me/instructor-assignments/${assignmentId}/lecture-report`)
  return unwrap(data)
}
export async function getLectureReportBinding(assignmentId: number): Promise<LectureReportFormBinding> {
  const { data } = await axiosClient.get(`/api/portal/me/instructor-assignments/${assignmentId}/lecture-report/form-binding`)
  return unwrap(data)
}
export async function renderLectureReport(programId: number, bindingId: number): Promise<Record<string, unknown>> {
  const { data } = await axiosClient.get(`/api/portal/me/programs/${programId}/form-bindings/${bindingId}/render`)
  return unwrap(data)
}
export async function submitLectureReportResponse(input: LectureReportFormResponseInput): Promise<{ formResponseId: number }> {
  const { data } = await axiosClient.post(
    `/api/portal/me/programs/${input.programId}/form-bindings/${input.programFormBindingId}/responses`,
    buildLectureReportFormResponseBody(input),
  )
  return unwrap(data)
}
export async function submitLectureReport(
  assignmentId: number,
  input: { templateVersionId: number; formResponseId: number },
): Promise<{ reportId: number }> {
  const { data } = await axiosClient.post(`/api/portal/me/instructor-assignments/${assignmentId}/lecture-report`, input)
  return unwrap(data)
}
export async function getLectureReportContent(assignmentId: number): Promise<LectureReportContent> {
  const { data } = await axiosClient.get(`/api/portal/me/instructor-assignments/${assignmentId}/lecture-report/content`, { headers: { 'Cache-Control': 'no-store' } })
  return unwrap(data)
}

export { getLectureReportApiErrorMessage }
