import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { parsePortalProgramId } from '@/features/program/api/mappers'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAccessToken } from '@/shared/lib/auth-token'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { platformQueryKeys } from '@/shared/api/query-keys'
import type { EducationInProgressFile, EducationInProgressNotice } from '../../notices/model/types'
import type { EducationScheduleItem } from '../../schedules/model/types'
import type { EducationSettlementItem, EducationSettlementStatus } from '../../settlements/model/types'
import type { EducationSurveyListEntry } from '../../surveys/lib/mock-survey-list'
import {
  fetchApplicationForms,
  fetchApplicationNoticeDetail,
  fetchApplicationNotices,
  fetchApplicationSchedules,
  fetchExpenseReceipts,
  fetchPortalSurveyFormBinding,
  fetchSettlementApplications,
  submitPortalSurveyResponse,
  type PortalEducationSchedule,
  type PortalExpenseReceipt,
  type PortalFormListItem,
  type PortalNoticeDetail,
  type PortalNoticeListItem,
  type PortalSettlementApplication,
  type PortalSurveySubmitBody,
} from './activity-client'
import type { ProgramApplicationType } from './types'

const STALE_MS = 30_000
const GC_MS = 10 * 60_000

function isActivityQueryEnabled(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
): applicationType is ProgramApplicationType {
  return Boolean(
    isRemoteApiConfigured() && getAccessToken() && applicationType && applicationId,
  )
}

function queryOptions() {
  return {
    staleTime: STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  } as const
}

function mapNotice(item: PortalNoticeListItem): EducationInProgressNotice | null {
  if (item.postId == null) return null
  return {
    id: String(item.postId),
    title: item.title?.trim() || '안내',
    content: '',
    authorName: '안내',
    publishedAt: item.createdAt ?? '',
    read: item.unread === false,
    viewCount: 0,
    commentCount: item.commentCount ?? 0,
    reactionCount: 0,
    isAuthor: false,
  }
}

function mapNoticeDetail(detail: PortalNoticeDetail): {
  notice: Partial<EducationInProgressNotice>
  files: EducationInProgressFile[]
} {
  const id = detail.postId == null ? '' : String(detail.postId)
  return {
    notice: {
      title: detail.title,
      content: detail.content ?? '',
      publishedAt: detail.createdAt,
      read: detail.unread === false,
      commentCount: detail.comments?.length ?? detail.commentCount,
    },
    files: (detail.attachments ?? []).flatMap(file => {
      if (file.attachmentId == null) return []
      return [
        {
          id: String(file.attachmentId),
          fileName: file.originalFileName?.trim() || '첨부파일',
          uploadedAt: file.createdAt ?? detail.createdAt ?? '',
          fileSizeBytes: file.fileSize ?? 0,
          postId: id,
        },
      ]
    }),
  }
}

function mapAttendance(
  value: string | undefined,
): EducationScheduleItem['attendanceStatus'] {
  switch ((value ?? '').toUpperCase()) {
    case 'PRESENT':
    case 'ATTENDED':
      return 'present'
    case 'LATE':
      return 'late'
    case 'ABSENT':
      return 'absent'
    case 'EXCUSED':
      return 'excused'
    default:
      return null
  }
}

function mapSchedule(item: PortalEducationSchedule, index: number): EducationScheduleItem | null {
  if (item.scheduleId == null || !item.startAt) return null
  return {
    id: String(item.scheduleId),
    sessionNumber: item.sessionNo ?? index + 1,
    heldAt: item.startAt,
    title: item.title?.trim() || item.locationName?.trim() || `${index + 1}회차`,
    attendanceStatus: mapAttendance(item.attendanceStatus),
  }
}

function mapForm(item: PortalFormListItem): EducationSurveyListEntry | null {
  const bindingId = item.bindingId ?? item.formBindingId ?? item.id
  if (bindingId == null) return null
  const status = (item.status ?? '').toUpperCase()
  const submitted = ['SUBMITTED', 'COMPLETED', 'DONE'].includes(status)
  return {
    id: String(bindingId),
    title: item.title?.trim() || '설문',
    status: submitted ? 'submitted' : 'in_progress',
    startAt: item.submissionStartAt?.slice(0, 10),
    endAt: item.submissionEndAt?.slice(0, 10),
    createdAt: item.submissionStartAt,
    templateVersionId: item.templateVersionId,
    form: item.form,
    formResponseId: item.formResponseId,
    answers: item.answers,
    draftAnswers: item.draftAnswers,
  }
}

function mapReceiptStatus(value: string | undefined): EducationSettlementStatus {
  switch ((value ?? '').toUpperCase()) {
    case 'REJECTED':
      return 'rejected'
    case 'PAID':
      return 'paid'
    case 'APPROVED':
    case 'CONFIRMED':
      return 'confirmed'
    case 'RESUBMITTED':
      return 'reapplied'
    case 'OVERDUE':
      return 'overdue'
    default:
      return 'waiting_confirm'
  }
}

function mapReceipt(item: PortalExpenseReceipt, index: number): EducationSettlementItem | null {
  if (item.receiptId == null) return null
  const heldAt = item.expenseDate ?? item.submittedAt ?? ''
  return {
    id: `receipt-${item.receiptId}`,
    sessionNumber: index + 1,
    heldAt,
    sessionMeta: item.description?.trim() || item.expenseType?.trim() || '영수증',
    progress: heldAt && new Date(heldAt).getTime() < Date.now() ? 'completed' : 'upcoming',
    status: mapReceiptStatus(item.receiptStatus),
    amount: item.amount,
    rejectReason: item.rejectReason,
  }
}

function mapSettlement(item: PortalSettlementApplication, index: number): EducationSettlementItem | null {
  if (item.applicationId == null) return null
  const heldAt = item.submittedAt ?? item.createdAt ?? ''
  return {
    id: `settlement-${item.applicationId}`,
    sessionNumber: index + 1,
    heldAt,
    sessionMeta: '정산 신청',
    progress: 'completed',
    status: mapReceiptStatus(item.status),
    amount: item.netPaymentAmount ?? item.grossAmount,
  }
}

export function useApplicationNoticesQuery(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
) {
  const enabled = isActivityQueryEnabled(applicationType, applicationId)
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.notices(
      applicationType ?? '',
      applicationId ?? '',
    ),
    queryFn: ({ signal }) => fetchApplicationNotices(applicationType!, applicationId!, signal),
    enabled,
    ...queryOptions(),
  })
  return {
    enabled,
    isLoading: enabled && query.isPending,
    isError: enabled && query.isError,
    items: (query.data?.items ?? []).flatMap(item => {
      const mapped = mapNotice(item)
      return mapped ? [mapped] : []
    }),
  }
}

export function useApplicationNoticeDetailQuery(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
  postId: string | null,
) {
  const enabled = isActivityQueryEnabled(applicationType, applicationId) && Boolean(postId)
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.noticeDetail(
      applicationType ?? '',
      applicationId ?? '',
      postId ?? '',
    ),
    queryFn: ({ signal }) =>
      fetchApplicationNoticeDetail(applicationType!, applicationId!, postId!, signal),
    enabled,
    ...queryOptions(),
  })
  return {
    enabled,
    detail: query.data ? mapNoticeDetail(query.data) : undefined,
  }
}

export function useApplicationSchedulesQuery(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
) {
  const enabled = isActivityQueryEnabled(applicationType, applicationId)
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.schedules(
      applicationType ?? '',
      applicationId ?? '',
    ),
    queryFn: ({ signal }) => fetchApplicationSchedules(applicationType!, applicationId!, signal),
    enabled,
    ...queryOptions(),
  })
  return {
    enabled,
    isLoading: enabled && query.isPending,
    isError: enabled && query.isError,
    items: (query.data ?? []).flatMap((item, index) => {
      const mapped = mapSchedule(item, index)
      return mapped ? [mapped] : []
    }),
  }
}

export function useApplicationFormsQuery(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
  formType: 'SURVEY' | 'SATISFACTION',
) {
  const enabled = isActivityQueryEnabled(applicationType, applicationId)
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.forms(
      applicationType ?? '',
      applicationId ?? '',
      formType,
    ),
    queryFn: ({ signal }) => fetchApplicationForms(applicationType!, applicationId!, formType, signal),
    enabled,
    ...queryOptions(),
  })
  const items = useMemo(
    () =>
      (query.data ?? []).flatMap(item => {
        const mapped = mapForm(item)
        return mapped ? [mapped] : []
      }),
    [query.data],
  )
  return {
    enabled,
    isLoading: enabled && query.isPending,
    isError: enabled && query.isError,
    items,
  }
}

export function useApplicationSettlementsQuery(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
  programId: string | null | undefined,
) {
  const enabled = isActivityQueryEnabled(applicationType, applicationId)
  const receipts = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.expenseReceipts(
      applicationType ?? '',
      applicationId ?? '',
    ),
    queryFn: ({ signal }) => fetchExpenseReceipts(applicationType!, applicationId!, signal),
    enabled,
    ...queryOptions(),
  })
  const settlements = useQuery({
    queryKey: platformQueryKeys.mypage.settlementApplications(),
    queryFn: ({ signal }) => fetchSettlementApplications(signal),
    enabled,
    ...queryOptions(),
  })
  const receiptItems = (receipts.data ?? []).flatMap((item, index) => {
    const mapped = mapReceipt(item, index)
    return mapped ? [mapped] : []
  })
  const settlementItems = (settlements.data ?? [])
    .filter(item => programId == null || String(item.programId ?? '') === programId)
    .flatMap((item, index) => {
      const mapped = mapSettlement(item, receiptItems.length + index)
      return mapped ? [mapped] : []
    })
  return {
    enabled,
    isLoading: enabled && (receipts.isPending || settlements.isPending),
    isError: enabled && (receipts.isError || settlements.isError),
    items: [...receiptItems, ...settlementItems],
  }
}

export function useApplicationSurveyFormQuery(
  programId: string | null | undefined,
  bindingId: string | null | undefined,
  applicationType: ProgramApplicationType | null | undefined,
  recruitmentId?: number | null,
) {
  const numericProgramId = parsePortalProgramId(programId)
  const numericBindingId = parsePortalProgramId(bindingId)
  const enabled =
    isRemoteApiConfigured() &&
    Boolean(getAccessToken()) &&
    numericProgramId != null &&
    numericBindingId != null
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.formBinding({
      programId: String(numericProgramId ?? ''),
      bindingId: numericBindingId ?? 0,
      recruitmentId: recruitmentId ?? null,
      applicationType: applicationType ?? '',
    }),
    queryFn: ({ signal }) =>
      fetchPortalSurveyFormBinding(
        numericProgramId!,
        numericBindingId!,
        {
          applicationType: applicationType ?? undefined,
          recruitmentId: recruitmentId ?? undefined,
        },
        signal,
      ),
    enabled,
    staleTime: 60_000,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })
  return {
    enabled,
    isLoading: enabled && query.isPending,
    isError: enabled && query.isError,
    document: query.data ?? null,
  }
}

export function useSubmitEducationSurveyMutation(
  programId: string | null | undefined,
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
) {
  const queryClient = useQueryClient()
  const numericProgramId = parsePortalProgramId(programId)
  return useMutation({
    mutationFn: (input: { bindingId: number } & PortalSurveySubmitBody) => {
      if (numericProgramId == null) {
        throw new Error('programId is required')
      }
      return submitPortalSurveyResponse(numericProgramId, input.bindingId, {
        answers: input.answers,
        templateVersionId: input.templateVersionId,
      })
    },
    onSuccess: () => {
      if (!applicationType || !applicationId) return
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.forms(
          applicationType,
          applicationId,
          'SURVEY',
        ),
      })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.forms(
          applicationType,
          applicationId,
          'SATISFACTION',
        ),
      })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.all(),
      })
    },
  })
}
