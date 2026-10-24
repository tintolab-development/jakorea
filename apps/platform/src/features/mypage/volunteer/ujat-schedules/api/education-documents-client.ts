import { axiosClient } from '@/shared/api/axios-instance'
import { fetchPortalSignedDownloadBlob } from '@/shared/lib/portal-signed-download-fetch'
import type { ProgramApplicationType } from '@/features/mypage/education/applications/api/types'
import {
  parseUjatEducationDocumentsResponse,
  type UjatEducationDocumentFile,
  type UjatEducationDocumentsResponse,
} from '../lib/documents'

export type {
  UjatEducationDayDocuments,
  UjatEducationDocumentKind,
  UjatEducationDocumentSlot,
  UjatEducationDocumentStatus,
  UjatEducationDocumentTemplateSetup,
  UjatEducationDocumentUnavailableReason,
  UjatEducationDocumentFile,
  UjatEducationDocumentsResponse,
} from '../lib/documents'

export type UjatEducationFormBindingRender = {
  programId?: number
  formBindingId?: number
  templateVersionId?: number
  form: Record<string, unknown>
}

export type UjatEducationFormResponseFile = UjatEducationDocumentFile

export type UjatEducationFormResponseDetail = {
  formResponseId: number
  originalResponseId: number | null
  revisionNo: number | null
  latestRevision: boolean
  bindingId: number | null
  programId: number | null
  formType: string | null
  title: string | null
  responseStatus: string | null
  submittedAt: string | null
  answers: Record<string, unknown>
  files: UjatEducationFormResponseFile[]
  form: Record<string, unknown> | null
  retentionExpiresAt: string | null
  retentionExpired: boolean
  canResubmit: boolean
}

export type UjatEducationDocumentFileDownload = {
  fileObjectId: number
  downloadUrl: string
  expiresAt: string | null
  requiredHeaders: Record<string, string>
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function optionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function optionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function optionalBoolean(value: unknown): boolean {
  return value === true
}

function parseAnswers(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

function parseRequiredHeaders(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {}
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0,
    ),
  )
}

function parseResponseFiles(value: unknown): UjatEducationFormResponseFile[] {
  if (!Array.isArray(value)) return []
  return value.flatMap(item => {
    if (!isRecord(item)) return []
    const fileObjectId = optionalNumber(item.fileObjectId)
    if (fileObjectId == null || fileObjectId <= 0) return []
    return [
      {
        formSubmissionFileId: optionalNumber(item.formSubmissionFileId) ?? 0,
        questionKey: optionalString(item.questionKey),
        fileObjectId,
        originalFileName:
          typeof item.originalFileName === 'string' && item.originalFileName.length > 0
            ? item.originalFileName
            : `첨부_${fileObjectId}`,
        contentType: optionalString(item.contentType),
        fileSize: optionalNumber(item.fileSize),
        downloadable: optionalBoolean(item.downloadable),
        retentionExpiresAt: optionalString(item.retentionExpiresAt),
      },
    ]
  })
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
  const detailPayload = unwrapEnvelope<unknown>(data)
  const detail = isRecord(detailPayload) ? detailPayload : {}
  const answers = parseAnswers(detail.answers)
  const parsedId =
    optionalNumber(detail.formResponseId) ?? formResponseId
  const form =
    detail.form && typeof detail.form === 'object' && !Array.isArray(detail.form)
      ? (detail.form as Record<string, unknown>)
      : null
  return {
    formResponseId: parsedId,
    originalResponseId: optionalNumber(detail.originalResponseId),
    revisionNo: optionalNumber(detail.revisionNo),
    latestRevision: optionalBoolean(detail.latestRevision),
    bindingId: optionalNumber(detail.bindingId),
    programId: optionalNumber(detail.programId),
    formType: optionalString(detail.formType),
    title: optionalString(detail.title),
    responseStatus: optionalString(detail.responseStatus),
    submittedAt: optionalString(detail.submittedAt),
    answers,
    files: parseResponseFiles(detail.files),
    form,
    retentionExpiresAt: optionalString(detail.retentionExpiresAt),
    retentionExpired: optionalBoolean(detail.retentionExpired),
    canResubmit: optionalBoolean(detail.canResubmit),
  }
}

export async function requestUjatEducationDocumentFileDownload(
  fileObjectId: number,
): Promise<UjatEducationDocumentFileDownload> {
  if (!Number.isInteger(fileObjectId) || fileObjectId <= 0) {
    throw new Error('invalid file object id')
  }
  const { data } = await axiosClient.post<unknown>(
    `/api/portal/me/files/${encodeURIComponent(String(fileObjectId))}/download-requests`,
    { purpose: 'education-document-view' },
  )
  const resolvedPayload = unwrapEnvelope<unknown>(data)
  const resolved = isRecord(resolvedPayload) ? resolvedPayload : {}
  const downloadUrl = optionalString(resolved.downloadUrl)
  if (!downloadUrl) throw new Error('첨부파일 다운로드 주소를 받지 못했습니다.')
  return {
    fileObjectId,
    downloadUrl,
    expiresAt: optionalString(resolved.expiresAt),
    requiredHeaders: parseRequiredHeaders(resolved.requiredHeaders),
  }
}

function saveDownloadedBlob(fileName: string, blob: Blob): void {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName || '첨부파일'
  anchor.click()
  URL.revokeObjectURL(objectUrl)
}

export async function downloadUjatEducationDocumentFile(input: {
  fileObjectId: number
  originalFileName: string
  downloadable: boolean
}): Promise<void> {
  if (input.downloadable !== true) return
  const resolved = await requestUjatEducationDocumentFileDownload(input.fileObjectId)
  const blob = await fetchPortalSignedDownloadBlob(
    resolved.downloadUrl,
    resolved.requiredHeaders,
    { acceptAnyContent: true },
  )
  if (blob.size < 1 || /\bjson\b/i.test(blob.type)) {
    throw new Error('첨부파일을 받지 못했습니다.')
  }
  saveDownloadedBlob(input.originalFileName, blob)
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
