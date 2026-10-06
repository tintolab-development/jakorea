import { axiosClient } from '@/shared/api/axios-instance'
import { fetchBlobOnce, readDownloadUrlFromJsonBlob } from '@/shared/lib/download-attachment'
import type { ProgramApplicationType } from './types'

const APPLICATIONS_PATH = '/api/portal/me/program-applications'

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

export type PortalNoticeListItem = {
  postId?: number
  title?: string
  pinned?: boolean
  unread?: boolean
  commentCount?: number
  attachmentCount?: number
  readCount?: number
  reactionCount?: number
  createdAt?: string
}

export type PortalNoticeListResponse = {
  items?: PortalNoticeListItem[]
}

export type PortalNoticeAttachment = {
  attachmentId?: number
  fileObjectId?: number
  originalFileName?: string
  fileSize?: number
  mimeType?: string
  downloadPath?: string
  createdAt?: string
}

export type PortalNoticeComment = {
  commentId?: number
  content?: string
  authorType?: string
  authorId?: number
  /** 회원 실명 또는 마스킹. 관리자·조회 불가는 null */
  authorDisplayName?: string | null
  mine?: boolean
  createdAt?: string
  updatedAt?: string
}

export type PortalNoticeDetail = {
  postId?: number
  title?: string
  content?: string
  unread?: boolean
  createdAt?: string
  commentCount?: number
  readCount?: number
  reactionCount?: number
  attachments?: PortalNoticeAttachment[]
  comments?: PortalNoticeComment[]
}

export type PortalNoticeReactionSummary = {
  reactionType?: string
  count?: number
}

export type PortalNoticeReactionState = {
  postId?: number
  summary?: PortalNoticeReactionSummary[]
  myReactions?: string[]
}

type PortalFileDownloadResolve = {
  downloadUrl?: string
}

export type PortalEducationSchedule = {
  scheduleId?: number
  sessionNo?: number
  title?: string
  startAt?: string
  endAt?: string
  locationName?: string
  scheduleStatus?: string
  attendanceStatus?: string
  surveyCount?: number
}

export type PortalEducationScheduleList = {
  items?: PortalEducationSchedule[]
}

export type PortalFormListItem = {
  bindingId?: number
  id?: number
  formBindingId?: number
  title?: string
  formType?: string
  status?: string
  submissionStartAt?: string
  submissionEndAt?: string
  required?: boolean
  templateVersionId?: number
  form?: Record<string, unknown> | null
  formResponseId?: number
  answers?: Record<string, unknown> | null
  draftAnswers?: Record<string, unknown> | null
}

export type PortalFormListResponse = {
  items?: PortalFormListItem[]
}

export type PortalExpenseReceipt = {
  receiptId?: number
  expenseDate?: string
  amount?: number
  description?: string
  expenseType?: string
  receiptStatus?: string
  rejectReason?: string
  submittedAt?: string
}

export type PortalExpenseReceiptList = {
  items?: PortalExpenseReceipt[]
}

export type PortalSettlementApplication = {
  applicationId?: number
  programId?: number
  status?: string
  netPaymentAmount?: number
  grossAmount?: number
  submittedAt?: string
  createdAt?: string
}

function applicationPath(applicationType: ProgramApplicationType, applicationId: string): string {
  return `${APPLICATIONS_PATH}/${applicationType}/${applicationId}`
}

export async function fetchApplicationNotices(
  applicationType: ProgramApplicationType,
  applicationId: string,
  signal?: AbortSignal,
): Promise<PortalNoticeListResponse> {
  const { data } = await axiosClient.get<unknown>(`${applicationPath(applicationType, applicationId)}/notices`, {
    signal,
    params: { page: 0, size: 100 },
  })
  const unwrapped = unwrapEnvelope<PortalNoticeListResponse | PortalNoticeListItem[]>(data)
  if (Array.isArray(unwrapped)) return { items: unwrapped }
  return { items: unwrapped.items ?? [] }
}

export async function fetchApplicationNoticeDetail(
  applicationType: ProgramApplicationType,
  applicationId: string,
  postId: string,
  signal?: AbortSignal,
): Promise<PortalNoticeDetail> {
  const { data } = await axiosClient.get<unknown>(
    `${applicationPath(applicationType, applicationId)}/notices/${postId}`,
    { signal },
  )
  return unwrapEnvelope<PortalNoticeDetail>(data)
}

function noticePath(applicationType: ProgramApplicationType, applicationId: string, postId: string) {
  return `${applicationPath(applicationType, applicationId)}/notices/${postId}`
}

export async function createApplicationNoticeComment(
  applicationType: ProgramApplicationType,
  applicationId: string,
  postId: string,
  content: string,
): Promise<void> {
  await axiosClient.post(`${noticePath(applicationType, applicationId, postId)}/comments`, {
    content,
  })
}

export async function updateApplicationNoticeComment(
  applicationType: ProgramApplicationType,
  applicationId: string,
  postId: string,
  commentId: string,
  content: string,
): Promise<void> {
  await axiosClient.patch(
    `${noticePath(applicationType, applicationId, postId)}/comments/${commentId}`,
    { content },
  )
}

export async function deleteApplicationNoticeComment(
  applicationType: ProgramApplicationType,
  applicationId: string,
  postId: string,
  commentId: string,
): Promise<void> {
  await axiosClient.delete(
    `${noticePath(applicationType, applicationId, postId)}/comments/${commentId}`,
  )
}

export async function fetchApplicationNoticeReactions(
  applicationType: ProgramApplicationType,
  applicationId: string,
  postId: string,
  signal?: AbortSignal,
): Promise<PortalNoticeReactionState> {
  const { data } = await axiosClient.get<unknown>(
    `${noticePath(applicationType, applicationId, postId)}/reactions`,
    { signal },
  )
  return unwrapEnvelope<PortalNoticeReactionState>(data)
}

export async function upsertApplicationNoticeReaction(
  applicationType: ProgramApplicationType,
  applicationId: string,
  postId: string,
  reactionType: string,
): Promise<PortalNoticeReactionState> {
  const { data } = await axiosClient.put<unknown>(
    `${noticePath(applicationType, applicationId, postId)}/reactions`,
    { reactionType },
  )
  return unwrapEnvelope<PortalNoticeReactionState>(data)
}

export async function deleteApplicationNoticeReaction(
  applicationType: ProgramApplicationType,
  applicationId: string,
  postId: string,
  reactionType: string,
): Promise<PortalNoticeReactionState> {
  const { data } = await axiosClient.delete<unknown>(
    `${noticePath(applicationType, applicationId, postId)}/reactions/${encodeURIComponent(reactionType)}`,
  )
  return unwrapEnvelope<PortalNoticeReactionState>(data)
}

export type PortalNoticeAttachmentListItem = PortalNoticeAttachment & {
  postId?: number
  postTitle?: string
}

/** 신청 단위 첨부 전체 — 상세와 달리 읽음 처리하지 않는다. */
export async function fetchApplicationNoticeAttachments(
  applicationType: ProgramApplicationType,
  applicationId: string,
  keyword?: string,
  signal?: AbortSignal,
): Promise<PortalNoticeAttachmentListItem[]> {
  const trimmedKeyword = keyword?.trim()
  const { data } = await axiosClient.get<unknown>(
    `${applicationPath(applicationType, applicationId)}/notices/attachments`,
    {
      signal,
      params: {
        page: 0,
        size: 100,
        ...(trimmedKeyword ? { keyword: trimmedKeyword } : {}),
      },
    },
  )
  const unwrapped = unwrapEnvelope<
    { items?: PortalNoticeAttachmentListItem[] } | PortalNoticeAttachmentListItem[]
  >(data)
  if (Array.isArray(unwrapped)) return unwrapped
  return unwrapped?.items ?? []
}

/**
 * 안내사항 본문 이미지 — 회원 Bearer 가 필요해 `<img src>` 로는 못 연다.
 * 302 를 따라간 바이트(또는 JSON `downloadUrl`)를 blob URL 로 돌려준다.
 */
export async function fetchApplicationNoticeInlineImageSrc(
  applicationType: ProgramApplicationType,
  applicationId: string,
  postId: string,
  fileObjectId: number,
): Promise<string> {
  const { data } = await axiosClient.get<Blob>(
    `${noticePath(applicationType, applicationId, postId)}/inline-images/${fileObjectId}/content`,
    { responseType: 'blob', headers: { Accept: 'image/*,*/*' } },
  )
  const signedUrl = await readDownloadUrlFromJsonBlob(data)
  const blob = signedUrl ? await fetchBlobOnce(signedUrl) : data
  if (blob.size === 0 || /\bjson\b/i.test(blob.type)) {
    throw new Error('본문 이미지를 열 수 없습니다.')
  }
  return URL.createObjectURL(blob)
}

/** 회원 Bearer 로 서명 URL 을 받는다. 파일 바이트는 서명 URL 로 따로 받는다. */
export async function resolveApplicationNoticeAttachmentUrl(downloadPath: string): Promise<string> {
  const { data } = await axiosClient.get<unknown>(downloadPath)
  const resolved = unwrapEnvelope<PortalFileDownloadResolve>(data)
  const url = resolved?.downloadUrl?.trim()
  if (!url) throw new Error('첨부파일 다운로드 주소를 받지 못했습니다.')
  return url
}

export async function fetchApplicationSchedules(
  applicationType: ProgramApplicationType,
  applicationId: string,
  signal?: AbortSignal,
): Promise<PortalEducationSchedule[]> {
  const { data } = await axiosClient.get<unknown>(
    `${applicationPath(applicationType, applicationId)}/schedules`,
    { signal },
  )
  const unwrapped = unwrapEnvelope<PortalEducationScheduleList | PortalEducationSchedule[]>(data)
  if (Array.isArray(unwrapped)) return unwrapped
  return unwrapped.items ?? []
}

export async function fetchApplicationForms(
  applicationType: ProgramApplicationType,
  applicationId: string,
  formType: string,
  signal?: AbortSignal,
): Promise<PortalFormListItem[]> {
  const { data } = await axiosClient.get<unknown>(`${applicationPath(applicationType, applicationId)}/forms`, {
    signal,
    params: { formType },
  })
  const unwrapped = unwrapEnvelope<PortalFormListResponse | PortalFormListItem[]>(data)
  if (Array.isArray(unwrapped)) return unwrapped
  return unwrapped.items ?? []
}

export type PortalSurveyFormDocument = {
  programId?: number
  formBindingId?: number
  templateVersionId?: number
  form?: Record<string, unknown> | null
  draftAnswers?: Record<string, unknown> | null
  answers?: Record<string, unknown> | null
  formResponseId?: number
}

/** GET /api/portal/programs/{programId}/form-bindings/{bindingId} — 설문·만족도 본문 */
export async function fetchPortalSurveyFormBinding(
  programId: number,
  bindingId: number,
  query: { applicationType?: string; recruitmentId?: number },
  signal?: AbortSignal,
): Promise<PortalSurveyFormDocument> {
  const { data } = await axiosClient.get<unknown>(
    `/api/portal/programs/${programId}/form-bindings/${bindingId}`,
    {
      signal,
      params: {
        ...(query.recruitmentId != null ? { recruitmentId: query.recruitmentId } : {}),
        ...(query.applicationType ? { applicationType: query.applicationType } : {}),
      },
    },
  )
  return unwrapEnvelope<PortalSurveyFormDocument>(data)
}

export type PortalSurveySubmitBody = {
  answers: Record<string, unknown>
  templateVersionId?: number
}

/** POST 설문·만족도 제출 */
export async function submitPortalSurveyResponse(
  programId: number,
  bindingId: number,
  body: PortalSurveySubmitBody,
): Promise<unknown> {
  try {
    const { data } = await axiosClient.post<unknown>(
      `/api/portal/me/programs/${programId}/form-bindings/${bindingId}/responses`,
      { answers: body.answers },
    )
    return unwrapEnvelope(data)
  } catch (error) {
    const status =
      typeof error === 'object' && error != null && 'response' in error
        ? (error as { response?: { status?: unknown } }).response?.status
        : undefined
    if (status !== 404 && status !== 405) throw error
    const { data } = await axiosClient.post<unknown>('/api/portal/me/form-responses/submit', {
      programId,
      templateVersionId: body.templateVersionId,
      contextType: 'PROGRAM',
      contextId: programId,
      answers: body.answers,
    })
    return unwrapEnvelope(data)
  }
}

export async function fetchExpenseReceipts(
  applicationType: ProgramApplicationType,
  applicationId: string,
  signal?: AbortSignal,
): Promise<PortalExpenseReceipt[]> {
  const { data } = await axiosClient.get<unknown>(
    `${applicationPath(applicationType, applicationId)}/expense-receipts`,
    { signal },
  )
  const unwrapped = unwrapEnvelope<PortalExpenseReceiptList | PortalExpenseReceipt[]>(data)
  if (Array.isArray(unwrapped)) return unwrapped
  return unwrapped.items ?? []
}

export async function fetchSettlementApplications(
  signal?: AbortSignal,
): Promise<PortalSettlementApplication[]> {
  const { data } = await axiosClient.get<unknown>('/api/portal/me/settlement-applications', { signal })
  const unwrapped = unwrapEnvelope<
    PortalSettlementApplication[] | { items?: PortalSettlementApplication[] }
  >(data)
  if (Array.isArray(unwrapped)) return unwrapped
  return unwrapped.items ?? []
}
