import { axiosClient } from '@/shared/api/axios-instance'
import { fetchBlobOnce, readDownloadUrlFromJsonBlob } from '@/shared/lib/download-attachment'
import {
  PORTAL_ASSIGNMENT_FORM_TYPE_QUERIES,
  dedupePortalFormListItems,
  PORTAL_SATISFACTION_FORM_TYPE_QUERIES,
  PORTAL_SURVEY_FORM_TYPE_QUERIES,
} from '../lib/portal-form-list'
import { fetchAllApiPages } from '@/shared/lib/fetch-all-api-pages'
import { FILE_UPLOAD_MAX_COUNT } from '@/shared/lib/file-upload-policy'
import type { ProgramApplicationType } from './types'
import { buildPortalBoundFormSubmitBody } from '../lib/portal-form-submit'

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

/**
 * Portal `GET …/notices` item — BE `MemberPortalNoticeListItem` (+ 작성자 필드).
 * Platform은 CMS Orval 미사용 · OpenAPI 갱신 시 필드 동기화.
 */
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
  updatedAt?: string
  createdByActorType?: string
  createdByActorId?: number
  createdByDisplayName?: string | null
  mine?: boolean
}

export type PortalNoticeListResponse = {
  items?: PortalNoticeListItem[]
}

export type PortalNoticeAttachment = {
  /** 원글 program_post.id. 없으면 null이며 원글보기만 숨긴다. */
  postId?: number | null
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

export type PortalNoticeInlineImage = {
  fileObjectId?: number
  referenceToken?: string
  contentPath?: string
}

export type PortalNoticeDetail = {
  postId?: number
  title?: string
  content?: string
  visibilityType?: string
  unread?: boolean
  createdAt?: string
  updatedAt?: string
  commentCount?: number
  readCount?: number
  reactionCount?: number
  createdByActorType?: string
  createdByActorId?: number
  createdByDisplayName?: string | null
  mine?: boolean
  attachments?: PortalNoticeAttachment[]
  inlineImages?: PortalNoticeInlineImage[]
  comments?: PortalNoticeComment[]
}

export type PortalNoticeReactionSummary = {
  reactionType?: string
  count?: number
}

/** 반응한 사람 1행 — BE `reactors[]` (이름 규칙은 댓글 `authorDisplayName` 과 같다) */
export type PortalNoticeReactor = {
  reactionType?: string
  actorType?: string
  actorId?: number
  actorDisplayName?: string | null
  mine?: boolean
  reactedAt?: string
}

export type PortalNoticeReactionState = {
  postId?: number
  summary?: PortalNoticeReactionSummary[]
  myReactions?: string[]
  reactors?: PortalNoticeReactor[]
}

type PortalFileDownloadResolve = {
  downloadUrl?: string
}

export type PortalEducationStructure = 'CURRICULUM' | 'SCHEDULE'
export type PortalSessionRound = 'SINGLE' | 'MULTI'
export type PortalScheduleBlockKind = 'PRE_EDUCATION' | 'SUB' | 'EVENT'
export type PortalAssignmentStatus =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'FEEDBACK'
  | 'REVISION_SUBMITTED'
export type PortalAssignmentSubmissionKind = 'FILE' | 'URL'

export type PortalEducationScheduleAssignmentSubmission = {
  id?: number | string
  kind?: PortalAssignmentSubmissionKind | string
  fileName?: string
  url?: string
  /** FILE 제출물 — 수정 제출 시 유지·제외 판단에 쓴다 */
  fileObjectId?: number | null
}

export type PortalEducationScheduleAssignment = {
  enabled?: boolean
  submitStartAt?: string | null
  submitEndAt?: string | null
  periodLabel?: string
  status?: PortalAssignmentStatus | string
  /**
   * 최초 제출 가능. 팀/개인 동일·역할 무관.
   * 기간 내·미제출·본인 참여면 MEMBER도 true.
   */
  canSubmit?: boolean
  /** 수정 제출 가능. 팀 역할 무관, 본인 제출만 true. */
  canResubmit?: boolean
  /** form_response.response_status — 미제출이면 null/생략 */
  responseStatus?: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | null
  formResponseId?: number
  submissions?: PortalEducationScheduleAssignmentSubmission[]
}

export type PortalEducationScheduleGroupTime = {
  startTime?: string
  endTime?: string
}

export type PortalEducationCurriculumSession = {
  sessionNo?: number
  sessionLabel?: string | null
  title?: string | null
  content?: string | null
}

export type PortalEducationSchedule = {
  scheduleId?: number | null
  sessionNo?: number
  title?: string
  startAt?: string | null
  endAt?: string | null
  locationName?: string | null
  organizationName?: string | null
  classLabel?: string | null
  attendanceStatus?: string | null
  absenceReason?: string
  sessionLabel?: string
  unitName?: string
  content?: string
  scheduleLabel?: string
  scheduleName?: string
  blockKind?: PortalScheduleBlockKind | string
  progressTimeLabel?: string
  groupTimes?: PortalEducationScheduleGroupTime[]
  assignment?: PortalEducationScheduleAssignment | null
  scheduleStatus?: string
  /** 배정된 운영 일정의 신청 지망 순위 라벨. 행 수를 늘리지 않는다. 없으면 omit. */
  preferenceRank?: number | null
  assignmentStatus?: string | null
  surveyCount?: number
  absenceReasonStatus?: string
  availableActions?: string[]
  /** 팀 프로그램 회차별 역할 LEADER | MEMBER | INDIVIDUAL. 표시용. 제출 권한 판단에 쓰지 않는다. */
  teamRole?: string | null
  /** 팀 프로그램 회차별 팀명. 표시용. 개인 참여면 null */
  teamName?: string | null
  /**
   * 커리큘럼형 단일 회차에서 이 일정(하루)에 진행하는 전 차시.
   * 그 외 구조는 omit/null/[] — FE는 기존 sessionLabel·content fallback.
   */
  curriculumSessions?: PortalEducationCurriculumSession[] | null
}

export type PortalScheduleAttendanceDetail = {
  scheduleId?: number | null
  attendanceStatus?: string | null
  absenceReason?: string | null
  absenceReasonStatus?: string | null
  classLabel?: string | null
  assignmentStatus?: string | null
  assignmentRole?: string | null
  attendanceManager?: boolean
  canCheckIn?: boolean
  locationName?: string | null
  organizationName?: string | null
  partnerName?: string | null
  checkInOpensAt?: string | null
  availableActions?: string[]
}

export type PortalAttendanceParticipant = {
  participantId?: number | null
  memberName?: string | null
  assignmentGroupId?: string | null
  assignmentRole?: string | null
  attendanceManager?: boolean
  organizationApplicationId?: number | null
  organizationName?: string | null
  classLabel?: string | null
  partnerParticipantId?: number | null
  partnerName?: string | null
  attendanceStatus?: string | null
  checkedAt?: string | null
  memberCheckedInAt?: string | null
  arrivalTime?: string | null
}

export type PortalAttendanceParticipantList = {
  programId?: number | null
  scheduleId?: number | null
  educationRegionCode?: string | null
  totalCount?: number | null
  items?: PortalAttendanceParticipant[]
}

export type PortalAttendanceCheckInResult = {
  applicationId?: number | null
  applicationType?: string | null
  programId?: number | null
  scheduleId?: number | null
  participantId?: number | null
  attendanceId?: number | null
  attendanceStatus?: string | null
  recordSource?: string | null
  checkedInAt?: string | null
  checkInOpensAt?: string | null
  attendanceManager?: boolean
  idempotent?: boolean
  availableActions?: string[]
}

export type PortalEducationScheduleScopeStatus =
  | 'ASSIGNMENT_SCOPED'
  | 'RECORDED_ONLY'
  | 'NO_SCOPE_EVIDENCE'
  | 'PROGRAM_SCHEDULE'

export type PortalEducationSchedulesResult = {
  items: PortalEducationSchedule[]
  scopeStatus?: PortalEducationScheduleScopeStatus | null
  educationStructure?: PortalEducationStructure | null
  sessionRound?: PortalSessionRound | null
  applicationId?: number
  applicationType?: string
}

export type PortalEducationScheduleList = {
  applicationId?: number
  applicationType?: string
  educationStructure?: PortalEducationStructure | string | null
  sessionRound?: PortalSessionRound | string | null
  items?: PortalEducationSchedule[]
  scopeStatus?: PortalEducationScheduleScopeStatus | string | null
}

export type PortalAbsenceReasonSubmission = {
  submissionId?: number
  attendanceId?: number
  scheduleId?: number
  revisionNo?: number
  reviewStatus?: string
  reason?: string
  fileObjectIds?: number[]
  submittedAt?: string
}

export type PortalAbsenceReasonSubmissionInput = {
  applicationType: ProgramApplicationType
  applicationId: string
  scheduleId: number
  reason: string
  fileObjectIds?: number[]
}

export const PORTAL_ABSENCE_REASON_MAX_LENGTH = 2_000
/** Platform 업로드 정책(10개). 서버 한도(20개)보다 좁다. */
export const PORTAL_ABSENCE_REASON_MAX_FILE_COUNT = FILE_UPLOAD_MAX_COUNT

function normalizePortalEducationScheduleScopeStatus(
  value: string | null | undefined
): PortalEducationScheduleScopeStatus | null {
  const normalized = value?.trim().toUpperCase()
  switch (normalized) {
    case 'ASSIGNMENT_SCOPED':
    case 'RECORDED_ONLY':
    case 'NO_SCOPE_EVIDENCE':
    case 'PROGRAM_SCHEDULE':
      return normalized
    default:
      return null
  }
}

function normalizePortalEducationStructure(
  value: string | null | undefined
): PortalEducationStructure | null {
  const normalized = value?.trim().toUpperCase()
  if (normalized === 'CURRICULUM' || normalized === 'SCHEDULE') return normalized
  return null
}

function normalizePortalSessionRound(value: string | null | undefined): PortalSessionRound | null {
  const normalized = value?.trim().toUpperCase()
  if (normalized === 'SINGLE' || normalized === 'MULTI') return normalized
  return null
}

/** Portal `.../forms` item.status */
export type PortalFormResponseStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'COMPLETED' | 'DONE'

export type PortalFormListItem = {
  /** Canonical BE `MemberPortalFormListItem.bindingId`. Assignment match/submit uses this only. */
  bindingId?: number
  templateVersionId?: number
  formType?: string
  title?: string
  templateName?: string | null
  targetScope?: string
  targetScopeLabel?: string | null
  scheduleId?: number | null
  sessionNo?: number | null
  preferenceRank?: number | null
  scheduleStartAt?: string | null
  required?: boolean
  submissionStartAt?: string | null
  submissionEndAt?: string | null
  status?: PortalFormResponseStatus | string
  latestFormResponseId?: number | null
  revisionNo?: number
  canSubmit?: boolean
  canResubmit?: boolean
  /** form_response.response_status — SUBMITTED / APPROVED / REJECTED 등 */
  responseStatus?: string | null
  retentionExpiresAt?: string | null
  /** Read-only compatibility aliases. Do not use for new assignment match/submit. */
  programFormBindingId?: number
  formBindingId?: number
  id?: number
  formResponseId?: number
  targetScopeId?: number | null
  form?: Record<string, unknown> | null
  answers?: Record<string, unknown> | null
  draftAnswers?: Record<string, unknown> | null
  /** 바인딩 대상 역할. 없으면 untyped로 제출 가능 */
  targetRole?: string | null
}

export type PortalAvailableProgramForm = {
  bindingId: number
  programId: number
  templateId: number
  templateVersionId: number
  templateName: string
  formType: string
  targetScope: string
  targetScopeId?: number | null
  targetScopeLabel?: string | null
  required: boolean
  submissionStartAt?: string | null
  submissionEndAt?: string | null
  alreadySubmitted: boolean
  targetRole?: string | null
}

export type PortalFormListResponse = {
  items?: PortalFormListItem[]
}

export type PortalExpenseReceipt = {
  receiptId?: number
  originalReceiptId?: number
  revisionNo?: number
  latestRevision?: boolean
  expenseDate?: string
  amount?: number
  description?: string
  expenseType?: string
  receiptStatus?: string
  rejectReason?: string
  submittedAt?: string
  reviewedAt?: string | null
  /** 런타임 전용. OpenAPI 목록 스키마에는 없음. 있으면 일정 연결에 사용 */
  scheduleId?: number
  programScheduleId?: number
  educationScheduleId?: number
  paymentStatus?: string
  availableActions?: string[]
  receiptDeadlineAt?: string
  submitDeadlineAt?: string
}

export type PortalExpenseReceiptList = {
  items?: PortalExpenseReceipt[]
}

export type PortalSettlementApplication = {
  applicationId?: number
  programId?: number
  programScheduleId?: number
  assignmentId?: number
  status?: string
  statementStatus?: string
  paymentStatus?: string
  netPaymentAmount?: number
  grossAmount?: number
  previousNetPaymentAmount?: number
  originalNetPaymentAmount?: number
  submittedAt?: string
  createdAt?: string
  revisionNo?: number
  originalApplicationId?: number
  rejectedReason?: string
  rejectedAt?: string
  availableActions?: string[]
  receiptDeadlineAt?: string
  submitDeadlineAt?: string
  correctionRequestId?: number
  correctionStatus?: string
  supersededBySettlementId?: number
  /** 이 신청에서 만들어진 최신 정산 revision ID. 지급조서 재신청 등 /api/portal/me/settlements/{settlementId}/** 에 쓴다. 정산 전이면 null */
  settlementId?: number | null
  /** 정정 승인으로 만들어진 최신 revision의 지급조서가 DRAFT(강사 재신청 대기)이면 true */
  statementReapplyAvailable?: boolean
}

function applicationPath(applicationType: ProgramApplicationType, applicationId: string): string {
  return `${APPLICATIONS_PATH}/${applicationType}/${applicationId}`
}

export async function fetchApplicationNotices(
  applicationType: ProgramApplicationType,
  applicationId: string,
  signal?: AbortSignal
): Promise<PortalNoticeListResponse> {
  const items = await fetchAllApiPages(async (page, size) => {
    const { data } = await axiosClient.get<unknown>(
      `${applicationPath(applicationType, applicationId)}/notices`,
      {
        signal,
        params: { page, size },
      }
    )
    const unwrapped = unwrapEnvelope<PortalNoticeListResponse | PortalNoticeListItem[]>(data)
    if (Array.isArray(unwrapped)) {
      return { items: unwrapped, totalPages: 1 }
    }
    return {
      items: unwrapped.items ?? [],
      totalPages: (unwrapped as { totalPages?: number }).totalPages,
    }
  })
  return { items }
}

export async function fetchApplicationNoticeDetail(
  applicationType: ProgramApplicationType,
  applicationId: string,
  postId: string,
  signal?: AbortSignal
): Promise<PortalNoticeDetail> {
  const { data } = await axiosClient.get<unknown>(
    `${applicationPath(applicationType, applicationId)}/notices/${postId}`,
    { signal }
  )
  return unwrapEnvelope<PortalNoticeDetail>(data)
}

function noticePath(
  applicationType: ProgramApplicationType,
  applicationId: string,
  postId: string
) {
  return `${applicationPath(applicationType, applicationId)}/notices/${postId}`
}

export type PortalCreateApplicationNoticeRequest = {
  title?: string
  content: string
  visibilityType: string
  organizationApplicationId?: number
}

export type PortalCreateApplicationNoticeResponse = {
  postId?: number
}

export type PortalUpdateApplicationNoticeRequest = {
  title?: string | null
  content: string
  visibilityType?: string | null
}

export type PortalUpdateApplicationNoticeResponse = {
  postId?: number
}

export async function createApplicationNotice(
  applicationType: ProgramApplicationType,
  applicationId: string,
  body: PortalCreateApplicationNoticeRequest
): Promise<PortalCreateApplicationNoticeResponse> {
  const payload: PortalCreateApplicationNoticeRequest = {
    content: body.content,
    visibilityType: body.visibilityType,
    title: body.title?.trim() ?? '',
  }
  if (body.organizationApplicationId != null) {
    payload.organizationApplicationId = body.organizationApplicationId
  }
  const { data } = await axiosClient.post<unknown>(
    `${applicationPath(applicationType, applicationId)}/notices`,
    payload
  )
  // 성공 시 래퍼 없이 { postId } — envelope 있으면 unwrap만 적용
  return unwrapEnvelope<PortalCreateApplicationNoticeResponse>(data)
}

export async function updateApplicationNotice(
  applicationType: ProgramApplicationType,
  applicationId: string,
  postId: string,
  body: PortalUpdateApplicationNoticeRequest
): Promise<PortalUpdateApplicationNoticeResponse> {
  const { data } = await axiosClient.patch<unknown>(
    noticePath(applicationType, applicationId, postId),
    body
  )
  return unwrapEnvelope<PortalUpdateApplicationNoticeResponse>(data)
}

export async function putApplicationNoticeAttachments(
  applicationType: ProgramApplicationType,
  applicationId: string,
  postId: string,
  fileObjectIds: number[]
): Promise<void> {
  await axiosClient.put(`${noticePath(applicationType, applicationId, postId)}/attachments`, {
    fileObjectIds,
  })
}

export async function putApplicationNoticeInlineImages(
  applicationType: ProgramApplicationType,
  applicationId: string,
  postId: string,
  fileObjectIds: number[]
): Promise<PortalNoticeInlineImage[]> {
  const { data } = await axiosClient.put<unknown>(
    `${noticePath(applicationType, applicationId, postId)}/inline-images`,
    { fileObjectIds }
  )
  const unwrapped = unwrapEnvelope<
    PortalNoticeInlineImage[] | { items?: PortalNoticeInlineImage[] }
  >(data)
  return Array.isArray(unwrapped) ? unwrapped : (unwrapped.items ?? [])
}

export async function createApplicationNoticeComment(
  applicationType: ProgramApplicationType,
  applicationId: string,
  postId: string,
  content: string
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
  content: string
): Promise<void> {
  await axiosClient.patch(
    `${noticePath(applicationType, applicationId, postId)}/comments/${commentId}`,
    { content }
  )
}

export async function deleteApplicationNoticeComment(
  applicationType: ProgramApplicationType,
  applicationId: string,
  postId: string,
  commentId: string
): Promise<void> {
  await axiosClient.delete(
    `${noticePath(applicationType, applicationId, postId)}/comments/${commentId}`
  )
}

export async function fetchApplicationNoticeReactions(
  applicationType: ProgramApplicationType,
  applicationId: string,
  postId: string,
  signal?: AbortSignal
): Promise<PortalNoticeReactionState> {
  const { data } = await axiosClient.get<unknown>(
    `${noticePath(applicationType, applicationId, postId)}/reactions`,
    { signal }
  )
  return unwrapEnvelope<PortalNoticeReactionState>(data)
}

export async function upsertApplicationNoticeReaction(
  applicationType: ProgramApplicationType,
  applicationId: string,
  postId: string,
  reactionType: string
): Promise<PortalNoticeReactionState> {
  const { data } = await axiosClient.put<unknown>(
    `${noticePath(applicationType, applicationId, postId)}/reactions`,
    { reactionType }
  )
  return unwrapEnvelope<PortalNoticeReactionState>(data)
}

export async function deleteApplicationNoticeReaction(
  applicationType: ProgramApplicationType,
  applicationId: string,
  postId: string,
  reactionType: string
): Promise<PortalNoticeReactionState> {
  const { data } = await axiosClient.delete<unknown>(
    `${noticePath(applicationType, applicationId, postId)}/reactions/${encodeURIComponent(reactionType)}`
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
  signal?: AbortSignal
): Promise<PortalNoticeAttachmentListItem[]> {
  const trimmedKeyword = keyword?.trim()
  return fetchAllApiPages(async (page, size) => {
    const { data } = await axiosClient.get<unknown>(
      `${applicationPath(applicationType, applicationId)}/notices/attachments`,
      {
        signal,
        params: {
          page,
          size,
          ...(trimmedKeyword ? { keyword: trimmedKeyword } : {}),
        },
      }
    )
    const unwrapped = unwrapEnvelope<
      | { items?: PortalNoticeAttachmentListItem[]; totalPages?: number }
      | PortalNoticeAttachmentListItem[]
    >(data)
    if (Array.isArray(unwrapped)) {
      return { items: unwrapped, totalPages: 1 }
    }
    return { items: unwrapped?.items ?? [], totalPages: unwrapped?.totalPages }
  })
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
  contentPath?: string
): Promise<string> {
  const { data } = await axiosClient.get<Blob>(
    contentPath?.trim() ||
      `${noticePath(applicationType, applicationId, postId)}/inline-images/${fileObjectId}/content`,
    { responseType: 'blob', headers: { Accept: 'image/*,*/*' } }
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
  signal?: AbortSignal
): Promise<PortalEducationSchedulesResult> {
  const { data } = await axiosClient.get<unknown>(
    `${applicationPath(applicationType, applicationId)}/schedules`,
    { signal }
  )
  const unwrapped = unwrapEnvelope<PortalEducationScheduleList | PortalEducationSchedule[]>(data)
  if (Array.isArray(unwrapped)) {
    return { items: unwrapped }
  }
  return {
    items: unwrapped.items ?? [],
    scopeStatus: normalizePortalEducationScheduleScopeStatus(unwrapped.scopeStatus),
    educationStructure: normalizePortalEducationStructure(unwrapped.educationStructure),
    sessionRound: normalizePortalSessionRound(unwrapped.sessionRound),
    applicationId: unwrapped.applicationId,
    applicationType: unwrapped.applicationType,
  }
}

function scheduleAttendancePath(
  applicationType: ProgramApplicationType,
  applicationId: string,
  scheduleId: number
): string {
  return `${applicationPath(applicationType, applicationId)}/schedules/${encodeURIComponent(String(scheduleId))}/attendance`
}

/** GET /api/portal/me/program-applications/{applicationType}/{applicationId}/schedules/{scheduleId}/attendance */
export async function fetchApplicationScheduleAttendance(
  applicationType: ProgramApplicationType,
  applicationId: string,
  scheduleId: number,
  signal?: AbortSignal
): Promise<PortalScheduleAttendanceDetail> {
  const { data } = await axiosClient.get<unknown>(
    scheduleAttendancePath(applicationType, applicationId, scheduleId),
    { signal }
  )
  return unwrapEnvelope<PortalScheduleAttendanceDetail>(data) ?? {}
}

/** GET /api/portal/me/program-applications/{applicationType}/{applicationId}/schedules/{scheduleId}/attendance/participants */
export async function fetchApplicationScheduleAttendanceParticipants(
  applicationType: ProgramApplicationType,
  applicationId: string,
  scheduleId: number,
  signal?: AbortSignal
): Promise<PortalAttendanceParticipantList> {
  const { data } = await axiosClient.get<unknown>(
    `${scheduleAttendancePath(applicationType, applicationId, scheduleId)}/participants`,
    { signal }
  )
  const unwrapped = unwrapEnvelope<PortalAttendanceParticipantList | PortalAttendanceParticipant[]>(
    data
  )
  if (Array.isArray(unwrapped)) {
    return { items: unwrapped, totalCount: unwrapped.length }
  }
  return unwrapped ?? { items: [] }
}

/** POST /api/portal/me/program-applications/{applicationType}/{applicationId}/schedules/{scheduleId}/attendance/check-in */
export async function submitApplicationScheduleCheckIn(
  applicationType: ProgramApplicationType,
  applicationId: string,
  scheduleId: number
): Promise<PortalAttendanceCheckInResult> {
  const { data } = await axiosClient.post<unknown>(
    `${scheduleAttendancePath(applicationType, applicationId, scheduleId)}/check-in`,
    {}
  )
  return unwrapEnvelope<PortalAttendanceCheckInResult>(data) ?? {}
}

/** POST /api/portal/me/program-applications/{applicationType}/{applicationId}/schedules/{scheduleId}/absence-reasons */
export async function submitApplicationAbsenceReason(
  input: PortalAbsenceReasonSubmissionInput
): Promise<PortalAbsenceReasonSubmission> {
  const reason = input.reason.trim()
  if (!reason) throw new Error('불참 사유를 작성해 주세요.')
  if (reason.length > PORTAL_ABSENCE_REASON_MAX_LENGTH) {
    throw new Error(`불참 사유는 ${PORTAL_ABSENCE_REASON_MAX_LENGTH}자 이내로 작성해 주세요.`)
  }
  if (input.fileObjectIds && input.fileObjectIds.length > PORTAL_ABSENCE_REASON_MAX_FILE_COUNT) {
    throw new Error(
      `증빙서류는 최대 ${PORTAL_ABSENCE_REASON_MAX_FILE_COUNT}개까지 첨부할 수 있습니다.`
    )
  }

  const { data } = await axiosClient.post<unknown>(
    `${applicationPath(input.applicationType, input.applicationId)}/schedules/${encodeURIComponent(String(input.scheduleId))}/absence-reasons`,
    {
      reason,
      ...(input.fileObjectIds && input.fileObjectIds.length > 0
        ? { fileObjectIds: input.fileObjectIds }
        : {}),
    }
  )
  return unwrapEnvelope<PortalAbsenceReasonSubmission>(data)
}

async function fetchApplicationFormsOnce(
  applicationType: ProgramApplicationType,
  applicationId: string,
  formType?: string,
  signal?: AbortSignal
): Promise<PortalFormListItem[]> {
  const { data } = await axiosClient.get<unknown>(
    `${applicationPath(applicationType, applicationId)}/forms`,
    {
      signal,
      params: formType ? { formType } : undefined,
    }
  )
  const unwrapped = unwrapEnvelope<PortalFormListResponse | PortalFormListItem[]>(data)
  if (Array.isArray(unwrapped)) return unwrapped
  return unwrapped.items ?? []
}

/**
 * 교육현황 과제·설문·만족도 목록 SSOT (`formType=ASSIGNMENT` | `SURVEY` | `SATISFACTION`).
 * Admin `/programs/{id}/surveys` 는 사용하지 않는다.
 * `items: []` 는 정상 empty(오류 아님). formType 조회가 비면 전체 forms로 다시 채우지 않는다.
 */
export async function fetchApplicationForms(
  applicationType: ProgramApplicationType,
  applicationId: string,
  formType: 'ASSIGNMENT' | 'HOMEWORK' | 'SURVEY' | 'SATISFACTION',
  signal?: AbortSignal
): Promise<PortalFormListItem[]> {
  const queries =
    formType === 'ASSIGNMENT' || formType === 'HOMEWORK'
      ? PORTAL_ASSIGNMENT_FORM_TYPE_QUERIES
      : formType === 'SURVEY'
        ? PORTAL_SURVEY_FORM_TYPE_QUERIES
        : PORTAL_SATISFACTION_FORM_TYPE_QUERIES

  let merged: PortalFormListItem[] = []
  const fetchAllAssignmentTypes = formType === 'ASSIGNMENT' || formType === 'HOMEWORK'
  for (const queryFormType of queries) {
    const batch = await fetchApplicationFormsOnce(
      applicationType,
      applicationId,
      queryFormType,
      signal
    )
    merged = dedupePortalFormListItems([...merged, ...batch])
    // Assignment: always query ASSIGNMENT and HOMEWORK. Other types may stop after the first hit.
    // Never fall back to unfiltered `/forms` when a typed query returns items: [].
    if (!fetchAllAssignmentTypes && merged.length > 0) return merged
  }

  return merged
}

/**
 * 활성 program_form_binding 목록.
 * 서버가 고정한 ARCHIVED 버전도 정상 항목이므로 versionStatus로 필터링하지 않는다.
 */
export async function fetchAvailableProgramForms(
  programId: number,
  signal?: AbortSignal
): Promise<PortalAvailableProgramForm[]> {
  const { data } = await axiosClient.get<unknown>(
    `/api/portal/me/programs/${programId}/available-forms`,
    { signal }
  )
  const unwrapped = unwrapEnvelope<
    PortalAvailableProgramForm[] | { items?: PortalAvailableProgramForm[] }
  >(data)
  return Array.isArray(unwrapped) ? unwrapped : (unwrapped.items ?? [])
}

export type PortalFormVersionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type PortalFormBindingRender = {
  templateVersionId: number
  templateId: number
  templateCode: string
  templateName: string
  formType: string
  category: string
  templateUseYn?: boolean | null
  templateDeletedAt?: string | null
  versionNo?: number | null
  versionLabel?: string | null
  versionStatus: PortalFormVersionStatus
  schemaJson?: string | null
  extensionJson?: string | null
  settingsJson?: string | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
  publishedAt?: string | null
  sections: Record<string, unknown>[]
  questions: Record<string, unknown>[]
  programFormBindingId: number
  programId: number
  targetScope?: string | null
  targetScopeId?: number | null
  submissionStartAt?: string | null
  submissionEndAt?: string | null
}

export type PortalSurveyFormDocument = {
  programId: number
  formBindingId: number
  templateVersionId: number
  versionStatus: PortalFormVersionStatus
  form: PortalFormBindingRender
  draftAnswers?: Record<string, unknown> | null
  answers?: Record<string, unknown> | null
  formResponseId?: number
}

/**
 * GET /api/portal/me/programs/{programId}/form-bindings/{bindingId}/render — 설문·만족도 본문
 *
 * `/api/portal/programs/{programId}/form-bindings/{bindingId}` 는 APPLICATION 바인딩 전용이라
 * 설문 바인딩에 recruitmentId 를 붙이면 RECRUITMENT_FORM_BINDING_MISMATCH 가 난다.
 */
export async function fetchPortalSurveyFormBinding(
  programId: number,
  bindingId: number,
  signal?: AbortSignal
): Promise<PortalSurveyFormDocument> {
  const { data } = await axiosClient.get<unknown>(
    `/api/portal/me/programs/${programId}/form-bindings/${bindingId}/render`,
    { signal }
  )
  const rendered = unwrapEnvelope<PortalFormBindingRender>(data)
  return {
    programId: rendered.programId,
    formBindingId: rendered.programFormBindingId,
    templateVersionId: rendered.templateVersionId,
    versionStatus: rendered.versionStatus,
    form: rendered,
  }
}

export type PortalSurveySubmitBody = {
  answers: Record<string, unknown>
  templateVersionId: number
  contextType?: string
  contextId?: number
  fileObjectIdsByQuestion?: Record<string, number[]>
}

/** POST 설문·만족도 제출 */
export async function submitPortalSurveyResponse(
  programId: number,
  bindingId: number,
  body: PortalSurveySubmitBody
): Promise<unknown> {
  const submitBody = buildPortalBoundFormSubmitBody({
    programId,
    bindingId,
    ...body,
  })
  try {
    const { data } = await axiosClient.post<unknown>(
      `/api/portal/me/programs/${programId}/form-bindings/${bindingId}/responses`,
      submitBody
    )
    return unwrapEnvelope(data)
  } catch (error) {
    const status =
      typeof error === 'object' && error != null && 'response' in error
        ? (error as { response?: { status?: unknown } }).response?.status
        : undefined
    if (status !== 404 && status !== 405) throw error
    const { data } = await axiosClient.post<unknown>(
      '/api/portal/me/form-responses/submit',
      submitBody
    )
    return unwrapEnvelope(data)
  }
}

export async function fetchExpenseReceipts(
  applicationType: ProgramApplicationType,
  applicationId: string,
  signal?: AbortSignal
): Promise<PortalExpenseReceipt[]> {
  const { data } = await axiosClient.get<unknown>(
    `${applicationPath(applicationType, applicationId)}/expense-receipts`,
    { signal }
  )
  const unwrapped = unwrapEnvelope<PortalExpenseReceiptList | PortalExpenseReceipt[]>(data)
  if (Array.isArray(unwrapped)) return unwrapped
  return unwrapped.items ?? []
}

export async function fetchSettlementApplications(
  signal?: AbortSignal
): Promise<PortalSettlementApplication[]> {
  const { data } = await axiosClient.get<unknown>('/api/portal/me/settlement-applications', {
    signal,
  })
  const unwrapped = unwrapEnvelope<
    PortalSettlementApplication[] | { items?: PortalSettlementApplication[] }
  >(data)
  if (Array.isArray(unwrapped)) return unwrapped
  return unwrapped.items ?? []
}

/** GET /api/portal/me/individual-settlements/applications/{applicationId}/schedules */
export type PortalIndividualPayableItem = {
  itemType?: string
  itemName?: string
  evidenceRequired?: boolean | null
  maxLimitWon?: number | null
  maxAmount?: number | null
}

export type PortalIndividualSubmittedItem = {
  itemType?: string
  amount?: number
  evidenceRequired?: boolean | null
}

/**
 * 회차별 학생 교통비 편도 거리 안내 (서버 판단). FE는 거리를 계산하지 않는다.
 * 신청란 노출 스위치는 payableItems — 이 값은 안내 문구용.
 */
export type PortalIndividualTransportPreview = {
  /** 편도 km. 산출 불가면 null — 0으로 렌더링하지 않는다 */
  oneWayDistanceKm?: number | null
  eligible?: boolean
  /** UNDER_MIN_DISTANCE | ADDRESS_MISSING | null */
  ineligibleReason?: string | null
}

export type PortalIndividualScheduleSettlement = {
  scheduleId?: number
  educationScheduleId?: number
  programScheduleId?: number
  scheduleName?: string
  startAt?: string
  endAt?: string
  attendanceStatus?: string | null
  eligible?: boolean
  ineligibleReason?: string | null
  settlementApplicationId?: number | null
  currentRevisionNo?: number | null
  status?: string | null
  canSubmit?: boolean
  canResubmit?: boolean
  businessEndDate?: string
  payableItems?: PortalIndividualPayableItem[]
  submittedItems?: PortalIndividualSubmittedItem[]
  transportPreview?: PortalIndividualTransportPreview | null
}

/** 일정별 정산 신청 유형. 봉사자 경로는 항상 VOLUNTEER */
export type PortalScheduleSettlementApplicationType = 'INDIVIDUAL' | 'VOLUNTEER'

export type PortalIndividualScheduleList = {
  /** INDIVIDUAL: program_individual_application.id · VOLUNTEER: program_volunteer_application.id */
  applicationId?: number
  applicationType?: PortalScheduleSettlementApplicationType
  schedules?: PortalIndividualScheduleSettlement[]
}

export type PortalIndividualSettlementFile = {
  fileObjectId?: number
  fileName?: string
  originalFileName?: string
  contentType?: string
  fileSize?: number | null
}

export type PortalIndividualSettlementExpense = {
  receiptId?: number
  originalReceiptId?: number | null
  revisionNo?: number
  expenseType?: string
  expenseDate?: string
  amount?: number
  description?: string | null
  files?: PortalIndividualSettlementFile[]
}

export type PortalIndividualSettlementItemDetail = {
  itemType?: string
  itemName?: string
  amount?: number
  evidenceRequired?: boolean
  description?: string
  expenses?: PortalIndividualSettlementExpense[]
  /** 제출 시점 편도 km 스냅샷. 기존 건 null — 재계산하지 않는다 */
  oneWayDistanceKm?: number | null
}

export type PortalIndividualSettlementRevision = {
  revisionNo?: number
  status?: string
  rejectionReason?: string
  submittedAt?: string
  reviewedAt?: string
  items?: PortalIndividualSettlementItemDetail[]
}

export type PortalIndividualSettlementDetail = {
  settlementApplicationId?: number
  applicationId?: number
  applicationType?: PortalScheduleSettlementApplicationType
  scheduleId?: number
  scheduleName?: string
  scheduleStartAt?: string
  scheduleEndAt?: string
  status?: string
  currentRevisionNo?: number
  revisions?: PortalIndividualSettlementRevision[]
}

export type PortalIndividualSettlementExpenseInput = {
  receiptId?: number | null
  revisesReceiptId?: number | null
  expenseType: string
  expenseDate: string
  amount: number
  description?: string | null
  fileObjectIds?: number[]
}

/** 학생 교통비 왕복/편도. 서버가 항목 설명(왕복·편도 교통비 실비 지급)을 만든다. null·생략이면 서버 description null */
export type PortalIndividualSettlementTripType = 'ROUND_TRIP' | 'ONE_WAY'

export type PortalIndividualSettlementItemInput = {
  itemType: string
  amount: number
  tripType?: PortalIndividualSettlementTripType | null
  /** 입력 메모(교통 구간·영수증 복원용). 화면 항목 설명 열은 서버 저장 description을 쓴다 */
  description?: string
  expenses?: PortalIndividualSettlementExpenseInput[]
}

export type PortalIndividualSettlementSubmitRequest = {
  idempotencyKey: string
  scheduleId: number
  items: PortalIndividualSettlementItemInput[]
}

export type PortalIndividualSettlementResubmitRequest = {
  idempotencyKey: string
  expectedRevisionNo: number
  items: PortalIndividualSettlementItemInput[]
}

function readScheduleSettlementRows(data: unknown): PortalIndividualScheduleSettlement[] {
  const unwrapped = unwrapEnvelope<unknown>(data)
  if (Array.isArray(unwrapped)) return unwrapped as PortalIndividualScheduleSettlement[]
  if (!unwrapped || typeof unwrapped !== 'object') return []
  const record = unwrapped as Record<string, unknown>
  for (const key of ['schedules', 'items', 'content'] as const) {
    const value = record[key]
    if (Array.isArray(value)) return value as PortalIndividualScheduleSettlement[]
  }
  return []
}

export async function fetchIndividualSettlementSchedules(
  applicationId: string,
  signal?: AbortSignal
): Promise<PortalIndividualScheduleSettlement[]> {
  const { data } = await axiosClient.get<unknown>(
    `/api/portal/me/individual-settlements/applications/${applicationId}/schedules`,
    { signal }
  )
  return readScheduleSettlementRows(data)
}

/**
 * GET /api/portal/me/volunteer-settlements/applications/{volunteerApplicationId}/schedules
 * `volunteerApplicationId` = program_volunteer_application.id. 응답은 개인 정산 일정 조회와 같은 스키마.
 */
export async function fetchVolunteerSettlementSchedules(
  volunteerApplicationId: string,
  signal?: AbortSignal
): Promise<PortalIndividualScheduleSettlement[]> {
  const { data } = await axiosClient.get<unknown>(
    `/api/portal/me/volunteer-settlements/applications/${volunteerApplicationId}/schedules`,
    { signal }
  )
  return readScheduleSettlementRows(data)
}

export async function fetchIndividualSettlementDetail(
  settlementApplicationId: number,
  signal?: AbortSignal
): Promise<PortalIndividualSettlementDetail> {
  const { data } = await axiosClient.get<unknown>(
    `/api/portal/me/individual-settlements/${settlementApplicationId}`,
    { signal }
  )
  return unwrapEnvelope<PortalIndividualSettlementDetail>(data)
}

export async function submitIndividualSettlement(
  applicationId: string,
  body: PortalIndividualSettlementSubmitRequest
): Promise<PortalIndividualSettlementDetail> {
  const { data } = await axiosClient.post<unknown>(
    `/api/portal/me/individual-settlements/applications/${applicationId}`,
    body
  )
  return unwrapEnvelope<PortalIndividualSettlementDetail>(data)
}

/** POST /api/portal/me/volunteer-settlements/applications/{volunteerApplicationId} — 봉사자 최초 제출(요청은 개인 정산과 동일) */
export async function submitVolunteerSettlement(
  volunteerApplicationId: string,
  body: PortalIndividualSettlementSubmitRequest
): Promise<PortalIndividualSettlementDetail> {
  const { data } = await axiosClient.post<unknown>(
    `/api/portal/me/volunteer-settlements/applications/${volunteerApplicationId}`,
    body
  )
  return unwrapEnvelope<PortalIndividualSettlementDetail>(data)
}

export async function resubmitIndividualSettlement(
  settlementApplicationId: number,
  body: PortalIndividualSettlementResubmitRequest
): Promise<PortalIndividualSettlementDetail> {
  const { data } = await axiosClient.post<unknown>(
    `/api/portal/me/individual-settlements/${settlementApplicationId}/revisions`,
    body
  )
  return unwrapEnvelope<PortalIndividualSettlementDetail>(data)
}
