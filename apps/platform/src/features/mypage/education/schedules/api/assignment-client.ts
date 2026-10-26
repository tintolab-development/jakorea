import { axiosClient } from '@/shared/api/axios-instance'

export type PortalAssignmentFormBindingRender = {
  programId?: number
  formBindingId?: number
  templateVersionId?: number
  form: Record<string, unknown>
}

export function hasRenderableAssignmentFormSchema(form: Record<string, unknown> | null | undefined): boolean {
  if (!form) return false
  if (form.schemaJson != null && form.schemaJson !== '') return true
  if (Array.isArray(form.questions) && form.questions.length > 0) return true
  if (Array.isArray(form.sections) && form.sections.length > 0) return true
  if (Array.isArray(form.paragraphs) && form.paragraphs.length > 0) return true
  return false
}

export type PortalAssignmentFormResponseFile = {
  formSubmissionFileId: number
  questionKey: string | null
  fileObjectId: number
  originalFileName: string
  contentType: string | null
  fileSize: number | null
  downloadable: boolean
  retentionExpiresAt: string | null
}

export type PortalAssignmentFormResponseDetail = {
  formResponseId: number
  answers: Record<string, unknown>
  files: PortalAssignmentFormResponseFile[]
  form: Record<string, unknown> | null
  canResubmit: boolean
}

export type PortalAssignmentSubmitBody = {
  templateVersionId: number
  programId: number
  programFormBindingId: number
  programScheduleId: number
  contextType: 'PROGRAM_SCHEDULE'
  contextId: number
  answers: Record<string, unknown>
  fileObjectIdsByQuestion?: Record<string, number[]>
}

export type PortalAssignmentRevisionBody = {
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
  return typeof value === 'string' && value.trim() ? value : null
}

function parseAnswers(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

function parseFiles(value: unknown): PortalAssignmentFormResponseFile[] {
  if (!Array.isArray(value)) return []
  return value.flatMap(raw => {
    if (!isRecord(raw)) return []
    const fileObjectId = optionalNumber(raw.fileObjectId)
    if (fileObjectId == null || fileObjectId <= 0) return []
    return [
      {
        formSubmissionFileId: optionalNumber(raw.formSubmissionFileId) ?? 0,
        questionKey: optionalString(raw.questionKey),
        fileObjectId,
        originalFileName: optionalString(raw.originalFileName) ?? `첨부_${fileObjectId}`,
        contentType: optionalString(raw.contentType),
        fileSize: optionalNumber(raw.fileSize),
        downloadable: raw.downloadable === true,
        retentionExpiresAt: optionalString(raw.retentionExpiresAt),
      },
    ]
  })
}

export async function fetchPortalAssignmentFormBinding(
  programId: number,
  bindingId: number,
  signal?: AbortSignal,
): Promise<PortalAssignmentFormBindingRender> {
  const { data } = await axiosClient.get<unknown>(
    `/api/portal/me/programs/${programId}/form-bindings/${bindingId}/render`,
    { signal },
  )
  const rendered = unwrapEnvelope<Record<string, unknown>>(data)
  return {
    programId: optionalNumber(rendered.programId) ?? programId,
    formBindingId: bindingId,
    templateVersionId: optionalNumber(rendered.templateVersionId) ?? undefined,
    form: rendered,
  }
}

export async function fetchPortalAssignmentFormResponse(
  formResponseId: number,
  signal?: AbortSignal,
): Promise<PortalAssignmentFormResponseDetail> {
  const { data } = await axiosClient.get<unknown>(
    `/api/portal/me/form-responses/${formResponseId}`,
    { signal },
  )
  const detail = unwrapEnvelope<unknown>(data)
  const root = isRecord(detail) ? detail : {}
  return {
    formResponseId: optionalNumber(root.formResponseId) ?? formResponseId,
    answers: parseAnswers(root.answers),
    files: parseFiles(root.files),
    form: isRecord(root.form) ? root.form : null,
    canResubmit: root.canResubmit === true,
  }
}

export async function submitPortalAssignmentResponse(
  programId: number,
  bindingId: number,
  body: PortalAssignmentSubmitBody,
): Promise<unknown> {
  const { data } = await axiosClient.post<unknown>(
    `/api/portal/me/programs/${programId}/form-bindings/${bindingId}/responses`,
    body,
  )
  return unwrapEnvelope(data)
}

export async function revisePortalAssignmentResponse(
  formResponseId: number,
  body: PortalAssignmentRevisionBody,
): Promise<unknown> {
  const { data } = await axiosClient.post<unknown>(
    `/api/portal/me/form-responses/${formResponseId}/revisions`,
    body,
  )
  return unwrapEnvelope(data)
}
