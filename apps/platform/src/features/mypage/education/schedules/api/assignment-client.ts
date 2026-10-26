import { axiosClient } from '@/shared/api/axios-instance'
import type { ProgramApplicationType } from '../../applications/api/types'

/** 과제 첨부 업로드 `filePurpose` — 회원 파일 API로 올린 뒤 fileObjectId 만 제출한다. */
export const PORTAL_ASSIGNMENT_FILE_PURPOSE = 'ASSIGNMENT_ATTACHMENT'

/** 서버 `MemberPortalAssignmentSubmissionService` 제한과 같아야 한다. */
export const PORTAL_ASSIGNMENT_MAX_FILE_COUNT = 20
export const PORTAL_ASSIGNMENT_MAX_FILE_BYTES = 50 * 1024 * 1024

export type PortalScheduleAssignmentSubmissionBody = {
  /** 제출(또는 수정 후 최종) 파일 집합. 1개 이상. */
  fileObjectIds: number[]
}

function assignmentSubmissionsPath(
  applicationType: ProgramApplicationType,
  applicationId: string,
  scheduleId: number,
): string {
  return `/api/portal/me/program-applications/${applicationType}/${applicationId}/schedules/${encodeURIComponent(String(scheduleId))}/assignment-submissions`
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

/** POST …/schedules/{scheduleId}/assignment-submissions — 최초 제출 */
export async function submitPortalScheduleAssignment(
  applicationType: ProgramApplicationType,
  applicationId: string,
  scheduleId: number,
  body: PortalScheduleAssignmentSubmissionBody,
): Promise<unknown> {
  const { data } = await axiosClient.post<unknown>(
    assignmentSubmissionsPath(applicationType, applicationId, scheduleId),
    body,
  )
  return unwrapEnvelope(data)
}

/** PUT …/schedules/{scheduleId}/assignment-submissions — 수정 제출(최종 파일 집합으로 교체) */
export async function revisePortalScheduleAssignment(
  applicationType: ProgramApplicationType,
  applicationId: string,
  scheduleId: number,
  body: PortalScheduleAssignmentSubmissionBody,
): Promise<unknown> {
  const { data } = await axiosClient.put<unknown>(
    assignmentSubmissionsPath(applicationType, applicationId, scheduleId),
    body,
  )
  return unwrapEnvelope(data)
}
