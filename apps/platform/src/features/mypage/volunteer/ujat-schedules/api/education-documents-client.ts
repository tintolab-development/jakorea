import { axiosClient } from '@/shared/api/axios-instance'
import type { ProgramApplicationType } from '@/features/mypage/education/applications/api/types'
import {
  parseUjatEducationDocumentsResponse,
  type UjatEducationDocumentsResponse,
} from '../lib/documents'

export type {
  UjatEducationDayDocuments,
  UjatEducationDocumentKind,
  UjatEducationDocumentSlot,
  UjatEducationDocumentStatus,
  UjatEducationDocumentTemplateSetup,
  UjatEducationDocumentUnavailableReason,
  UjatEducationDocumentsResponse,
} from '../lib/documents'

export type UjatEducationFormBindingRender = {
  programId?: number
  formBindingId?: number
  templateVersionId?: number
  form: Record<string, unknown>
}

export type UjatEducationFormResponseFile = {
  questionKey: string
  fileObjectId: number
  originalFileName: string
}

export type UjatEducationFormResponseDetail = {
  formResponseId: number
  answers: Record<string, unknown>
  files: UjatEducationFormResponseFile[]
}

export type UjatEducationDocumentSubmitBody = {
  templateVersionId: number
  programId: number
  programFormBindingId: number
  programScheduleId: number
  contextType: 'PROGRAM_SCHEDULE'
  contextId: number
  answers: Record<string, unknown>
  fileObjectIdsByQuestion?: Record<string, number[]>
}

export type UjatEducationDocumentRevisionBody = {
  answers: Record<string, unknown>
  fileObjectIdsByQuestion?: Record<string, number[]>
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

function applicationPath(applicationType: ProgramApplicationType, applicationId: string): string {
  return `/api/portal/me/program-applications/${applicationType}/${applicationId}`
}

export async function fetchUjatEducationDocuments(
  applicationType: ProgramApplicationType,
  applicationId: string,
  signal?: AbortSignal,
): Promise<UjatEducationDocumentsResponse> {
  const { data } = await axiosClient.get<unknown>(
    `${applicationPath(applicationType, applicationId)}/education-documents`,
    { signal },
  )
  return parseUjatEducationDocumentsResponse(unwrapEnvelope(data))
}

export async function fetchUjatEducationDocumentsForSchedule(
  applicationType: ProgramApplicationType,
  applicationId: string,
  scheduleId: number,
  signal?: AbortSignal,
): Promise<UjatEducationDocumentsResponse> {
  const { data } = await axiosClient.get<unknown>(
    `${applicationPath(applicationType, applicationId)}/schedules/${scheduleId}/education-documents`,
    { signal },
  )
  return parseUjatEducationDocumentsResponse(unwrapEnvelope(data))
}

export async function fetchUjatEducationFormBindingRender(
  programId: number,
  bindingId: number,
  signal?: AbortSignal,
): Promise<UjatEducationFormBindingRender> {
  const { data } = await axiosClient.get<unknown>(
    `/api/portal/me/programs/${programId}/form-bindings/${bindingId}/render`,
    { signal },
  )
  const rendered = unwrapEnvelope<Record<string, unknown>>(data)
  return {
    programId: typeof rendered.programId === 'number' ? rendered.programId : programId,
    formBindingId:
      typeof rendered.programFormBindingId === 'number' ? rendered.programFormBindingId : bindingId,
    templateVersionId:
      typeof rendered.templateVersionId === 'number' ? rendered.templateVersionId : undefined,
    form: rendered,
  }
}

export async function fetchUjatEducationFormResponse(
  formResponseId: number,
  signal?: AbortSignal,
): Promise<UjatEducationFormResponseDetail> {
  const { data } = await axiosClient.get<unknown>(
    `/api/portal/me/form-responses/${formResponseId}`,
    { signal },
  )
  const detail = unwrapEnvelope<Record<string, unknown>>(data)
  const answers =
    detail.answers && typeof detail.answers === 'object' && !Array.isArray(detail.answers)
      ? (detail.answers as Record<string, unknown>)
      : {}
  const files: UjatEducationFormResponseFile[] = []
  const rawFiles = Array.isArray(detail.files) ? detail.files : []
  for (const item of rawFiles) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const questionKey = typeof row.questionKey === 'string' ? row.questionKey.trim() : ''
    const fileObjectId =
      typeof row.fileObjectId === 'number' ? row.fileObjectId : Number(row.fileObjectId)
    const originalFileName =
      typeof row.originalFileName === 'string' ? row.originalFileName.trim() : ''
    if (!questionKey || !Number.isFinite(fileObjectId) || fileObjectId <= 0) continue
    files.push({
      questionKey,
      fileObjectId,
      originalFileName: originalFileName || `첨부_${fileObjectId}`,
    })
  }
  const parsedId =
    typeof detail.formResponseId === 'number' ? detail.formResponseId : formResponseId
  return { formResponseId: parsedId, answers, files }
}

export async function submitUjatEducationDocument(
  programId: number,
  bindingId: number,
  body: UjatEducationDocumentSubmitBody,
): Promise<unknown> {
  const { data } = await axiosClient.post<unknown>(
    `/api/portal/me/programs/${programId}/form-bindings/${bindingId}/responses`,
    body,
  )
  return unwrapEnvelope(data)
}

export async function reviseUjatEducationDocument(
  formResponseId: number,
  body: UjatEducationDocumentRevisionBody,
): Promise<unknown> {
  const { data } = await axiosClient.post<unknown>(
    `/api/portal/me/form-responses/${formResponseId}/revisions`,
    body,
  )
  return unwrapEnvelope(data)
}

