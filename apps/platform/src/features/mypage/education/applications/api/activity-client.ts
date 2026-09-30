import { axiosClient } from '@/shared/api/axios-instance'
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
  createdAt?: string
}

export type PortalNoticeListResponse = {
  items?: PortalNoticeListItem[]
}

export type PortalNoticeAttachment = {
  attachmentId?: number
  originalFileName?: string
  fileSize?: number
  createdAt?: string
}

export type PortalNoticeDetail = {
  postId?: number
  title?: string
  content?: string
  unread?: boolean
  createdAt?: string
  commentCount?: number
  attachments?: PortalNoticeAttachment[]
  comments?: Array<{ commentId?: number }>
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
  title?: string
  formType?: string
  status?: string
  submissionStartAt?: string
  submissionEndAt?: string
  required?: boolean
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
