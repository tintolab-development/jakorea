import { axiosClient } from '@/shared/api/axios-instance'
import {
  FILE_UPLOAD_MAX_BYTES,
  FILE_UPLOAD_MAX_COUNT,
} from '@/shared/lib/file-upload-policy'
import type { ProgramApplicationType } from '../../applications/api/types'

/** 과제 첨부 업로드 `filePurpose` — 회원 파일 API로 올린 뒤 fileObjectId 만 제출한다. */
export const PORTAL_ASSIGNMENT_FILE_PURPOSE = 'ASSIGNMENT_ATTACHMENT'

/** Platform 업로드 정책(파일 10개·20MB·전체 100MB). 링크는 파일 정책에서 제외한다. */
export const PORTAL_ASSIGNMENT_MAX_FILE_COUNT = FILE_UPLOAD_MAX_COUNT
export const PORTAL_ASSIGNMENT_MAX_FILE_BYTES = FILE_UPLOAD_MAX_BYTES
/** 서버 제출 항목(fileObjectIds + urls) 합계 상한 */
export const PORTAL_ASSIGNMENT_MAX_SUBMISSION_ITEMS = 20

export type PortalScheduleAssignmentSubmissionBody = {
  /** 제출(또는 수정 후 최종) 파일 집합. URL은 포함하지 않는다. */
  fileObjectIds?: number[]
  /** 제출(또는 수정 후 최종) URL 집합. 파일 ID는 포함하지 않는다. */
  urls?: string[]
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
