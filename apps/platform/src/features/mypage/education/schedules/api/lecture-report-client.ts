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
}
export type LectureReportPage = { items: LectureReportAssignment[]; page: number; size: number; totalElements: number; totalPages: number }
export type LectureReportState = {
  assignmentId: number; instructorApplicationId: number | null; programId: number; programScheduleId: number
  reportId: number | null; submitted: boolean; submittedAt: string | null; formResponseId: number | null
  templateVersionId: number | null; attachmentGroupId: number | null; reportStatus: LectureReportStatus
  scheduleStatus: string; canSubmit: boolean; bindingId: number | null
}
export type LectureReportContent = {
  assignmentId: number; reportId: number; formResponseId: number; programId: number; scheduleId: number
  bindingId: number; templateVersionId: number; formType: 'LECTURE_REPORT'; title: string
  responseStatus: string; submittedAt: string | null; form: Record<string, unknown>
  answers: Record<string, unknown>; files: Array<{ formSubmissionFileId: number; questionKey: string | null; fileObjectId: number; originalFileName: string; contentType: string; fileSize: number | null; downloadable: boolean }>
}
export type { LectureReportContextType, LectureReportFormBinding, LectureReportFormResponseInput }

function unwrap<T>(value: unknown): T {
  if (value && typeof value === 'object' && 'success' in value && (value as { success?: boolean }).success && 'data' in value) return unwrap<T>((value as { data: unknown }).data)
  return value as T
}

export async function getLectureReportAssignments(programId: number, page: number): Promise<LectureReportPage> {
  const { data } = await axiosClient.get(`/api/portal/me/programs/${programId}/lecture-report-assignments`, { params: { page, size: 10 } })
  return unwrap(data)
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
export async function saveLectureReportDraft(input: LectureReportFormResponseInput): Promise<{ formResponseId: number }> {
  const { data } = await axiosClient.post('/api/portal/me/form-responses/draft', buildLectureReportFormResponseBody(input))
  return unwrap(data)
}

export async function submitLectureReportResponse(input: LectureReportFormResponseInput): Promise<{ formResponseId: number }> {
  const { data } = await axiosClient.post('/api/portal/me/form-responses/submit', buildLectureReportFormResponseBody(input))
  return unwrap(data)
}
export async function submitLectureReport(assignmentId: number, input: { templateVersionId: number; formResponseId: number }): Promise<unknown> {
  const { data } = await axiosClient.post(`/api/portal/me/instructor-assignments/${assignmentId}/lecture-report`, input)
  return unwrap(data)
}
export async function getLectureReportContent(assignmentId: number): Promise<LectureReportContent> {
  const { data } = await axiosClient.get(`/api/portal/me/instructor-assignments/${assignmentId}/lecture-report/content`, { headers: { 'Cache-Control': 'no-store' } })
  return unwrap(data)
}

export { getLectureReportApiErrorMessage }
