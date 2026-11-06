import { useMemo } from 'react'
import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { parsePortalProgramId } from '@/features/program/api/mappers'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAccessToken } from '@/shared/lib/auth-token'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { platformQueryKeys } from '@/shared/api/query-keys'
import {
  mapPortalNoticeAuthorFields,
  portalEducationNoticeActorLabel,
} from '../../notices/lib/author-label'
import type {
  EducationInProgressFile,
  EducationInProgressNotice,
  EducationNoticeComment,
  EducationNoticeReactionSummary,
  EducationNoticeReactionUser,
} from '../../notices/model/types'
import { mapPortalEducationSchedule } from '../../schedules/lib/map-from-portal'
import { filterEducationSchedulesForMemberAssignment } from '../../schedules/lib/scope-status'
import {
  getEducationSchedulesQueryErrorCode,
  getEducationSchedulesQueryTraceId,
} from '../../schedules/lib/schedules-query-error'
import { buildAssignedSettlementItems } from '../../settlements/lib/assigned-settlement-items'
import { getAllLectureReportAssignments } from '../../schedules/api/lecture-report-client'
import { asAssignmentDisplayText } from '../../schedules/lib/instructor-assignment-support'
import { mapPortalFormListItem } from '../../surveys/lib/map-portal-form-list-item'
import {
  isPortalSatisfactionFormType,
  isPortalSurveyFormType,
  mapAvailableProgramFormToListItem,
} from '../lib/portal-form-list'
import {
  createApplicationNotice,
  createApplicationNoticeComment,
  putApplicationNoticeAttachments,
  putApplicationNoticeInlineImages,
  deleteApplicationNoticeComment,
  deleteApplicationNoticeReaction,
  fetchApplicationForms,
  fetchAvailableProgramForms,
  fetchApplicationNoticeAttachments,
  fetchApplicationNoticeDetail,
  fetchApplicationNoticeReactions,
  fetchApplicationNotices,
  updateApplicationNotice,
  updateApplicationNoticeComment,
  upsertApplicationNoticeReaction,
  fetchApplicationSchedules,
  fetchApplicationScheduleAttendance,
  fetchApplicationScheduleAttendanceParticipants,
  submitApplicationAbsenceReason,
  submitApplicationScheduleCheckIn,
  fetchExpenseReceipts,
  fetchIndividualSettlementDetail,
  fetchIndividualSettlementSchedules,
  fetchPortalSurveyFormBinding,
  fetchSettlementApplications,
  resubmitIndividualSettlement,
  submitIndividualSettlement,
  submitPortalSurveyResponse,
  type PortalNoticeAttachmentListItem,
  type PortalNoticeComment,
  type PortalNoticeDetail,
  type PortalNoticeInlineImage,
  type PortalNoticeListItem,
  type PortalNoticeReactionState,
  type PortalAbsenceReasonSubmissionInput,
  type PortalIndividualSettlementResubmitRequest,
  type PortalIndividualSettlementSubmitRequest,
  type PortalSurveySubmitBody,
} from './activity-client'
import type { ProgramApplicationType } from './types'
import { uploadMemberPortalFile } from '@/features/mypage/instructor-apply/api/member-file-upload'
import { PORTAL_PROGRAM_POST_ATTACHMENT_FILE_PURPOSE } from '../../notices/lib/notice-attach-policy'
import {
  INDIVIDUAL_SETTLEMENT_DISABLED_CODE,
  INDIVIDUAL_SETTLEMENT_NOT_FOUND_CODE,
  readIndividualSettlementErrorCode,
  shouldUseIndividualSettlementSchedulesApi,
} from '../../settlements/lib/individual-settlement-contract'

const STALE_MS = 30_000
const GC_MS = 10 * 60_000

function isActivityQueryEnabled(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined
): applicationType is ProgramApplicationType {
  return Boolean(isRemoteApiConfigured() && getAccessToken() && applicationType && applicationId)
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
  const author = mapPortalNoticeAuthorFields(item)
  return {
    id: String(item.postId),
    title: item.title?.trim() || '안내사항',
    content: '',
    authorName: author.authorName,
    authorIsStaff: author.authorIsStaff,
    publishedAt: item.createdAt ?? '',
    read: item.unread === false,
    viewCount: item.readCount ?? 0,
    commentCount: item.commentCount ?? 0,
    reactionCount: item.reactionCount ?? 0,
    isAuthor: author.isAuthor,
    attachmentCount: item.attachmentCount ?? 0,
  }
}

function mapNoticeAttachmentListItem(
  item: PortalNoticeAttachmentListItem
): EducationInProgressFile | null {
  if (item.attachmentId == null || item.postId == null) return null
  return {
    id: String(item.attachmentId),
    fileObjectId: item.fileObjectId,
    fileName: item.originalFileName?.trim() || '첨부파일',
    uploadedAt: item.createdAt ?? '',
    fileSizeBytes: item.fileSize ?? 0,
    postId: String(item.postId),
    downloadPath: item.downloadPath?.trim() || undefined,
  }
}

function noticeCommentAuthorLabel(comment: PortalNoticeComment): string {
  return portalEducationNoticeActorLabel(
    comment.authorDisplayName,
    comment.authorType,
    comment.mine
  )
}

function mapNoticeDetail(detail: PortalNoticeDetail): {
  notice: Partial<EducationInProgressNotice>
  files: EducationInProgressFile[]
  comments: EducationNoticeComment[]
} {
  const id = detail.postId == null ? '' : String(detail.postId)
  const author = mapPortalNoticeAuthorFields(detail)
  return {
    notice: {
      title: detail.title,
      content: detail.content ?? '',
      visibilityType: detail.visibilityType,
      inlineImages: mapNoticeInlineImages(detail.inlineImages),
      authorName: author.authorName,
      authorIsStaff: author.authorIsStaff,
      isAuthor: author.isAuthor,
      publishedAt: detail.createdAt,
      read: detail.unread === false,
      viewCount: detail.readCount ?? 0,
      reactionCount: detail.reactionCount ?? 0,
      commentCount: detail.comments?.length ?? detail.commentCount,
    },
    files: (detail.attachments ?? []).flatMap(file => {
      if (file.attachmentId == null) return []
      return [
        {
          id: String(file.attachmentId),
          fileObjectId: file.fileObjectId,
          fileName: file.originalFileName?.trim() || '첨부파일',
          uploadedAt: file.createdAt ?? detail.createdAt ?? '',
          fileSizeBytes: file.fileSize ?? 0,
          postId: id,
          downloadPath: file.downloadPath?.trim() || undefined,
        },
      ]
    }),
    comments: (detail.comments ?? []).flatMap(comment => {
      if (comment.commentId == null) return []
      return [
        {
          id: String(comment.commentId),
          noticeId: id,
          authorName: noticeCommentAuthorLabel(comment),
          content: comment.content ?? '',
          createdAt: comment.createdAt ?? '',
          mine: comment.mine === true,
        },
      ]
    }),
  }
}

function mapNoticeInlineImages(
  images: PortalNoticeInlineImage[] | undefined
): EducationInProgressNotice['inlineImages'] {
  return (images ?? []).flatMap(image => {
    if (image.fileObjectId == null) return []
    return [
      {
        fileObjectId: image.fileObjectId,
        referenceToken: image.referenceToken ?? `file-object:${image.fileObjectId}`,
        contentPath: image.contentPath,
      },
    ]
  })
}

function mapNoticeReactions(
  state: PortalNoticeReactionState | undefined,
  postId: string
): {
  summary: EducationNoticeReactionSummary[]
  myReactionTypes: string[]
  total: number
  /** BE `reactors` 를 줄 때만 채운다 — 없으면 null (화면이 내 반응만 대신 보여 준다) */
  users: EducationNoticeReactionUser[] | null
} {
  const summary = (state?.summary ?? []).flatMap(row => {
    const emojiType = row.reactionType?.trim()
    const count = row.count ?? 0
    return emojiType && count > 0 ? [{ emojiType, count }] : []
  })
  const users = state?.reactors
    ? state.reactors.flatMap((row, index) => {
        const emojiType = row.reactionType?.trim()
        if (!emojiType) return []
        return [
          {
            id: `${postId}-${row.actorType ?? 'actor'}-${row.actorId ?? index}-${emojiType}`,
            noticeId: postId,
            authorName: portalEducationNoticeActorLabel(
              row.actorDisplayName,
              row.actorType,
              row.mine
            ),
            emojiType,
            reactedAt: row.reactedAt ?? '',
          },
        ]
      })
    : null
  return {
    summary,
    myReactionTypes: (state?.myReactions ?? []).filter(Boolean),
    total: summary.reduce((sum, row) => sum + row.count, 0),
    users,
  }
}

export function useApplicationNoticesQuery(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined
) {
  const enabled = isActivityQueryEnabled(applicationType, applicationId)
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.notices(
      applicationType ?? '',
      applicationId ?? ''
    ),
    queryFn: ({ signal }) => fetchApplicationNotices(applicationType!, applicationId!, signal),
    enabled,
    ...queryOptions(),
  })
  const items = useMemo(
    () =>
      (query.data?.items ?? []).flatMap(item => {
        const mapped = mapNotice(item)
        return mapped ? [mapped] : []
      }),
    [query.data]
  )
  return {
    enabled,
    isLoading: enabled && query.isPending,
    isError: enabled && query.isError,
    items,
  }
}

export function useApplicationNoticeDetailQuery(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
  postId: string | null
) {
  const queryClient = useQueryClient()
  const enabled = isActivityQueryEnabled(applicationType, applicationId) && Boolean(postId)
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.noticeDetail(
      applicationType ?? '',
      applicationId ?? '',
      postId ?? ''
    ),
    queryFn: async ({ signal }) => {
      const detail = await fetchApplicationNoticeDetail(
        applicationType!,
        applicationId!,
        postId!,
        signal
      )
      // 상세 GET 이 읽음·조회수를 반영하므로 목록을 다시 받는다. 첨부 목록은 읽음과 무관하다.
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.notices(
          applicationType!,
          applicationId!
        ),
        exact: true,
      })
      return detail
    },
    enabled,
    ...queryOptions(),
  })
  const detail = useMemo(() => (query.data ? mapNoticeDetail(query.data) : undefined), [query.data])
  return {
    enabled,
    isError: enabled && query.isError,
    detail,
  }
}

/**
 * 우측 첨부 목록. `GET .../notices/attachments` 에 파일명 keyword 를 넘긴다.
 * 그 API 가 없거나 실패하면 이미 열어 본(캐시된) 상세들의 첨부를 모은다.
 * 상세 GET 은 읽음 처리라 첨부를 얻으려고 미리 호출하지 않는다.
 */
export function useApplicationNoticeFiles(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
  notices: readonly EducationInProgressNotice[],
  keyword = ''
) {
  const enabled = isActivityQueryEnabled(applicationType, applicationId)
  const trimmedKeyword = keyword.trim()
  const listQuery = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.noticeAttachments(
      applicationType ?? '',
      applicationId ?? '',
      trimmedKeyword
    ),
    queryFn: ({ signal }) =>
      fetchApplicationNoticeAttachments(applicationType!, applicationId!, trimmedKeyword, signal),
    enabled,
    ...queryOptions(),
    placeholderData: keepPreviousData,
    retry: false,
  })

  const fallbackPostIds = useMemo(
    () => notices.filter(notice => (notice.attachmentCount ?? 0) > 0).map(notice => notice.id),
    [notices]
  )
  const cachedDetails = useQueries({
    queries: fallbackPostIds.map(postId => ({
      queryKey: platformQueryKeys.mypage.programApplications.noticeDetail(
        applicationType ?? '',
        applicationId ?? '',
        postId
      ),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchApplicationNoticeDetail(applicationType!, applicationId!, postId, signal),
      enabled: false,
      ...queryOptions(),
    })),
  })
  const cachedDetailData = cachedDetails.map(query => query.data)
  const cachedDetailKey = cachedDetails.map(query => query.dataUpdatedAt).join(',')

  const listData = listQuery.data
  const files = useMemo(() => {
    if (listData) {
      return listData.flatMap(item => {
        const mapped = mapNoticeAttachmentListItem(item)
        return mapped ? [mapped] : []
      })
    }
    return cachedDetailData.flatMap(data => (data ? mapNoticeDetail(data).files : []))
    // cachedDetailData 는 렌더마다 새 배열 — 내용 변화는 cachedDetailKey 로 감지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listData, cachedDetailKey])

  return { enabled, isFullList: Boolean(listData), files }
}

export function useApplicationNoticeReactionsQuery(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
  postId: string | null
) {
  const enabled = isActivityQueryEnabled(applicationType, applicationId) && Boolean(postId)
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.noticeReactions(
      applicationType ?? '',
      applicationId ?? '',
      postId ?? ''
    ),
    queryFn: ({ signal }) =>
      fetchApplicationNoticeReactions(applicationType!, applicationId!, postId!, signal),
    enabled,
    ...queryOptions(),
    staleTime: 0,
  })
  const reactions = useMemo(
    () => mapNoticeReactions(query.data, postId ?? ''),
    [postId, query.data]
  )
  return { enabled, ...reactions }
}

export type CreateApplicationNoticeInput = {
  /** 생략·공백 시 BE는 "" 처리 */
  title?: string
  content: string
  visibilityType: string
  organizationApplicationId?: number
  attachmentFiles?: File[]
  inlineImageFileObjectIds?: number[]
}

export function useCreateApplicationNoticeMutation(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateApplicationNoticeInput) => {
      if (!applicationType || !applicationId) {
        throw new Error('application scope is required')
      }
      const files = input.attachmentFiles ?? []
      const fileObjectIds =
        files.length > 0
          ? await Promise.all(
              files.map(file =>
                uploadMemberPortalFile({
                  file,
                  filePurpose: PORTAL_PROGRAM_POST_ATTACHMENT_FILE_PURPOSE,
                })
              )
            )
          : []

      const created = await createApplicationNotice(applicationType, applicationId, {
        title: input.title?.trim() ?? '',
        content: input.content,
        visibilityType: input.visibilityType,
        organizationApplicationId: input.organizationApplicationId,
      })
      const postId = created.postId
      if (postId == null) {
        throw new Error('PORTAL_NOTICE_CREATE_MISSING_POST_ID')
      }
      if (input.inlineImageFileObjectIds) {
        await putApplicationNoticeInlineImages(
          applicationType,
          applicationId,
          String(postId),
          input.inlineImageFileObjectIds
        )
      }
      if (fileObjectIds.length > 0) {
        await putApplicationNoticeAttachments(
          applicationType,
          applicationId,
          String(postId),
          fileObjectIds
        )
      }
      return String(postId)
    },
    onSuccess: () => {
      if (!applicationType || !applicationId) return
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.notices(
          applicationType,
          applicationId
        ),
        exact: true,
      })
      void queryClient.invalidateQueries({
        queryKey: [
          ...platformQueryKeys.mypage.programApplications.all(),
          'notice-attachments',
          applicationType,
          applicationId,
        ],
      })
    },
  })
}

export type UpdateApplicationNoticeInput = {
  postId: string
  content: string
  inlineImageFileObjectIds: number[]
  attachmentFileObjectIds: number[]
  attachmentFiles?: File[]
}

export function useUpdateApplicationNoticeMutation(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateApplicationNoticeInput) => {
      if (!applicationType || !applicationId) {
        throw new Error('application scope is required')
      }
      const files = input.attachmentFiles ?? []
      const newAttachmentFileObjectIds =
        files.length > 0
          ? await Promise.all(
              files.map(file =>
                uploadMemberPortalFile({
                  file,
                  filePurpose: PORTAL_PROGRAM_POST_ATTACHMENT_FILE_PURPOSE,
                })
              )
            )
          : []
      const updated = await updateApplicationNotice(applicationType, applicationId, input.postId, {
        title: null,
        content: input.content,
        visibilityType: null,
      })
      await putApplicationNoticeInlineImages(
        applicationType,
        applicationId,
        input.postId,
        input.inlineImageFileObjectIds
      )
      await putApplicationNoticeAttachments(applicationType, applicationId, input.postId, [
        ...input.attachmentFileObjectIds,
        ...newAttachmentFileObjectIds,
      ])
      return updated
    },
    onSuccess: (_data, input) => {
      if (!applicationType || !applicationId) return
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.noticeDetail(
          applicationType,
          applicationId,
          input.postId
        ),
      })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.notices(
          applicationType,
          applicationId
        ),
        exact: true,
      })
      void queryClient.invalidateQueries({
        queryKey: [
          ...platformQueryKeys.mypage.programApplications.all(),
          'notice-attachments',
          applicationType,
          applicationId,
        ],
      })
    },
  })
}

/** 댓글 등록·수정·삭제 후 상세(댓글)와 목록(댓글 수)을 다시 받는다. */
export function useApplicationNoticeCommentMutations(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined
) {
  const queryClient = useQueryClient()
  const invalidate = (postId: string) => {
    if (!applicationType || !applicationId) return
    void queryClient.invalidateQueries({
      queryKey: platformQueryKeys.mypage.programApplications.noticeDetail(
        applicationType,
        applicationId,
        postId
      ),
    })
    void queryClient.invalidateQueries({
      queryKey: platformQueryKeys.mypage.programApplications.notices(
        applicationType,
        applicationId
      ),
      exact: true,
    })
  }
  const requireScope = () => {
    if (!applicationType || !applicationId) throw new Error('application scope is required')
    return { applicationType, applicationId }
  }

  const create = useMutation({
    mutationFn: (input: { postId: string; content: string }) => {
      const scope = requireScope()
      return createApplicationNoticeComment(
        scope.applicationType,
        scope.applicationId,
        input.postId,
        input.content
      )
    },
    onSuccess: (_data, input) => invalidate(input.postId),
  })
  const update = useMutation({
    mutationFn: (input: { postId: string; commentId: string; content: string }) => {
      const scope = requireScope()
      return updateApplicationNoticeComment(
        scope.applicationType,
        scope.applicationId,
        input.postId,
        input.commentId,
        input.content
      )
    },
    onSuccess: (_data, input) => invalidate(input.postId),
  })
  const remove = useMutation({
    mutationFn: (input: { postId: string; commentId: string }) => {
      const scope = requireScope()
      return deleteApplicationNoticeComment(
        scope.applicationType,
        scope.applicationId,
        input.postId,
        input.commentId
      )
    },
    onSuccess: (_data, input) => invalidate(input.postId),
  })
  return { create, update, remove }
}

/**
 * 반응은 1인 1개 — 같은 반응을 다시 누르면 취소, 다른 반응이면 새로 등록하고 이전 반응을 지운다.
 * 응답의 summary/myReactions 가 최신 상태라 캐시에 바로 쓴다.
 */
export function useToggleApplicationNoticeReactionMutation(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      postId: string
      reactionType: string
      myReactionTypes: readonly string[]
    }): Promise<PortalNoticeReactionState> => {
      if (!applicationType || !applicationId) throw new Error('application scope is required')
      const target = input.reactionType.toUpperCase()
      const mine = input.myReactionTypes.map(type => type.toUpperCase())
      if (mine.includes(target)) {
        return deleteApplicationNoticeReaction(applicationType, applicationId, input.postId, target)
      }
      let state = await upsertApplicationNoticeReaction(
        applicationType,
        applicationId,
        input.postId,
        target
      )
      for (const previous of (state.myReactions ?? []).filter(
        type => type.toUpperCase() !== target
      )) {
        state = await deleteApplicationNoticeReaction(
          applicationType,
          applicationId,
          input.postId,
          previous
        )
      }
      return state
    },
    onSuccess: (state, input) => {
      if (!applicationType || !applicationId) return
      queryClient.setQueryData(
        platformQueryKeys.mypage.programApplications.noticeReactions(
          applicationType,
          applicationId,
          input.postId
        ),
        state
      )
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.notices(
          applicationType,
          applicationId
        ),
        exact: true,
      })
    },
    retry: false,
  })
}

export function useApplicationSchedulesQuery(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
  options?: { programType?: string | null },
) {
  const enabled = isActivityQueryEnabled(applicationType, applicationId)
  const programType = options?.programType
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.schedules(
      applicationType ?? '',
      applicationId ?? ''
    ),
    queryFn: ({ signal }) => fetchApplicationSchedules(applicationType!, applicationId!, signal),
    enabled,
    ...queryOptions(),
  })
  const items = useMemo(
    () =>
      filterEducationSchedulesForMemberAssignment(
        (query.data?.items ?? []).map((item, index) =>
          mapPortalEducationSchedule(item, index, {
            educationStructure: query.data?.educationStructure,
            sessionRound: query.data?.sessionRound,
            applicationType,
            programType,
          }),
        ),
      ),
    [
      applicationType,
      programType,
      query.data?.educationStructure,
      query.data?.items,
      query.data?.sessionRound,
    ],
  )
  return {
    enabled,
    isLoading: enabled && query.isPending,
    isError: enabled && query.isError,
    isRefetching: enabled && query.isFetching && !query.isPending,
    items,
    scopeStatus: query.data?.scopeStatus ?? null,
    refetch: query.refetch,
    errorCode: query.isError ? getEducationSchedulesQueryErrorCode(query.error) : null,
    traceId: query.isError ? getEducationSchedulesQueryTraceId(query.error) : null,
  }
}

export function useApplicationScheduleAttendanceQuery(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
  scheduleId: number | null | undefined,
  options?: { enabled?: boolean }
) {
  const canView = options?.enabled !== false
  const enabled =
    isActivityQueryEnabled(applicationType, applicationId) &&
    scheduleId != null &&
    Number.isSafeInteger(scheduleId) &&
    scheduleId > 0 &&
    canView
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.scheduleAttendance(
      applicationType ?? '',
      applicationId ?? '',
      scheduleId ?? 0
    ),
    queryFn: ({ signal }) =>
      fetchApplicationScheduleAttendance(applicationType!, applicationId!, scheduleId!, signal),
    enabled,
    staleTime: STALE_MS,
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
    error: enabled ? query.error : null,
    data: query.data ?? null,
    refetch: query.refetch,
  }
}

export function useApplicationScheduleAttendanceParticipantsQuery(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
  scheduleId: number | null | undefined,
  options?: { enabled?: boolean },
) {
  const canView = options?.enabled !== false
  const enabled =
    isActivityQueryEnabled(applicationType, applicationId) &&
    scheduleId != null &&
    Number.isSafeInteger(scheduleId) &&
    scheduleId > 0 &&
    canView
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.scheduleAttendanceParticipants(
      applicationType ?? '',
      applicationId ?? '',
      scheduleId ?? 0,
    ),
    queryFn: ({ signal }) =>
      fetchApplicationScheduleAttendanceParticipants(
        applicationType!,
        applicationId!,
        scheduleId!,
        signal,
      ),
    enabled,
    staleTime: STALE_MS,
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
    error: enabled ? query.error : null,
    data: query.data ?? null,
    refetch: query.refetch,
  }
}

function invalidateApplicationAttendanceQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  applicationType: ProgramApplicationType,
  applicationId: string,
) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: platformQueryKeys.mypage.programApplications.listPrefix(),
    }),
    queryClient.invalidateQueries({
      queryKey: platformQueryKeys.mypage.programApplications.detail(applicationType, applicationId),
      exact: true,
    }),
    queryClient.invalidateQueries({
      queryKey: platformQueryKeys.mypage.programApplications.schedules(
        applicationType,
        applicationId,
      ),
      exact: true,
    }),
    queryClient.invalidateQueries({
      queryKey: [
        ...platformQueryKeys.mypage.programApplications.schedules(applicationType, applicationId),
        'attendance',
      ],
    }),
    queryClient.invalidateQueries({
      queryKey: platformQueryKeys.mypage.certificates.all(),
    }),
    queryClient.invalidateQueries({
      queryKey: [
        ...platformQueryKeys.mypage.programApplications.all(),
        'certificate-availability',
      ],
    }),
  ])
}

export function useSubmitApplicationScheduleCheckIn(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (scheduleId: number) => {
      if (!applicationType || !applicationId) {
        throw new Error('출석 처리 범위가 올바르지 않습니다.')
      }
      return submitApplicationScheduleCheckIn(applicationType, applicationId, scheduleId)
    },
    onSuccess: async () => {
      if (!applicationType || !applicationId) return
      await invalidateApplicationAttendanceQueries(queryClient, applicationType, applicationId)
    },
    retry: false,
  })
}

export function useSubmitApplicationAbsenceReason(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      input: Omit<PortalAbsenceReasonSubmissionInput, 'applicationType' | 'applicationId'>
    ) => {
      if (!applicationType || !applicationId) {
        throw new Error('결석 사유 제출 범위가 올바르지 않습니다.')
      }
      return submitApplicationAbsenceReason({
        ...input,
        applicationType,
        applicationId,
      })
    },
    onSuccess: async () => {
      if (!applicationType || !applicationId) return
      await invalidateApplicationAttendanceQueries(queryClient, applicationType, applicationId)
    },
    retry: false,
  })
}

export function useApplicationFormsQuery(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
  formType: 'ASSIGNMENT' | 'HOMEWORK' | 'SURVEY' | 'SATISFACTION'
) {
  const enabled = isActivityQueryEnabled(applicationType, applicationId)
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.forms(
      applicationType ?? '',
      applicationId ?? '',
      formType
    ),
    queryFn: ({ signal }) =>
      fetchApplicationForms(applicationType!, applicationId!, formType, signal),
    enabled,
    ...queryOptions(),
  })
  const items = useMemo(
    () =>
      (query.data ?? []).flatMap(item => {
        if (formType === 'SURVEY' && !isPortalSurveyFormType(item.formType)) return []
        if (formType === 'SATISFACTION' && !isPortalSatisfactionFormType(item.formType)) return []
        const mapped = mapPortalFormListItem(item)
        return mapped ? [mapped] : []
      }),
    [formType, query.data]
  )
  return {
    enabled,
    isLoading: enabled && query.isPending,
    isError: enabled && query.isError,
    isSuccess: enabled && query.isSuccess,
    items,
    rawItems: query.data ?? [],
  }
}

export function useAvailableProgramFormsQuery(
  programId: string | null | undefined,
  formTypes: readonly string[]
) {
  const numericProgramId = parsePortalProgramId(programId)
  const enabled =
    isRemoteApiConfigured() && Boolean(getAccessToken()) && numericProgramId != null
  const query = useQuery({
    queryKey: platformQueryKeys.program.availableForms(String(numericProgramId ?? '')),
    queryFn: ({ signal }) => fetchAvailableProgramForms(numericProgramId!, signal),
    enabled,
    ...queryOptions(),
  })
  const normalizedFormTypeKey = formTypes
    .map(value => value.trim().toUpperCase())
    .join(',')
  const items = useMemo(
    () => {
      const normalizedTypes = normalizedFormTypeKey.split(',')
      return (query.data ?? []).flatMap(item => {
        if (!normalizedTypes.includes((item.formType ?? '').trim().toUpperCase())) return []
        const mapped = mapPortalFormListItem(mapAvailableProgramFormToListItem(item))
        return mapped ? [mapped] : []
      })
    },
    [normalizedFormTypeKey, query.data]
  )
  return {
    enabled,
    isLoading: enabled && query.isPending,
    isError: enabled && query.isError,
    isSuccess: enabled && query.isSuccess,
    items,
    rawItems: query.data ?? [],
  }
}

export function useIndividualSettlementSchedulesQuery(
  applicationId: string | null | undefined,
  extraEnabled = true
) {
  const enabled =
    isRemoteApiConfigured() &&
    Boolean(getAccessToken()) &&
    Boolean(applicationId) &&
    extraEnabled
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.individualSettlementSchedules(applicationId ?? ''),
    queryFn: ({ signal }) => fetchIndividualSettlementSchedules(applicationId!, signal),
    enabled,
    ...queryOptions(),
  })
  const errorCode = query.isError ? readIndividualSettlementErrorCode(query.error) : null
  if (
    import.meta.env.DEV &&
    query.isError &&
    errorCode === INDIVIDUAL_SETTLEMENT_NOT_FOUND_CODE &&
    applicationId
  ) {
    console.warn(
      '[individual-settlements] SETTLEMENT_NOT_FOUND — applicationId가 program_individual_application.id인지, programType이 GENERAL_INDIVIDUAL인지 확인하세요.',
      { applicationId },
    )
  }
  return {
    enabled,
    isLoading: enabled && query.isPending,
    isError: enabled && query.isError,
    isSuccess: query.isSuccess,
    isDisabled: errorCode === INDIVIDUAL_SETTLEMENT_DISABLED_CODE,
    errorCode,
    schedules: query.isError ? [] : (query.data ?? []),
    refetch: query.refetch,
  }
}

export function useApplicationSettlementsQuery(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
  programId: string | null | undefined,
  options?: { operationEndAt?: string | null; programType?: string | null; enabled?: boolean }
) {
  const schedules = useApplicationSchedulesQuery(applicationType, applicationId, {
    programType: options?.programType,
  })
  const enabled = schedules.enabled && options?.enabled !== false
  const individualAudience = shouldUseIndividualSettlementSchedulesApi(
    applicationType,
    options?.programType,
  )
  const instructorAudience = applicationType === 'INSTRUCTOR'
  const receipts = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.expenseReceipts(
      applicationType ?? '',
      applicationId ?? ''
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
  const individual = useIndividualSettlementSchedulesQuery(
    applicationId,
    enabled && individualAudience,
  )
  const lectureReports = useQuery({
    queryKey: platformQueryKeys.mypage.lectureReportAssignments(programId ?? ''),
    queryFn: ({ signal }) => getAllLectureReportAssignments(Number(programId), signal),
    enabled:
      enabled &&
      instructorAudience &&
      Boolean(programId) &&
      Number.isFinite(Number(programId)) &&
      Number(programId) > 0,
    ...queryOptions(),
  })
  const joinReady =
    !enabled ||
    ((receipts.isSuccess || receipts.isError) &&
      (settlements.isSuccess || settlements.isError) &&
      (!individualAudience || individual.isSuccess || individual.isError) &&
      (!instructorAudience || lectureReports.isSuccess || lectureReports.isError))
  const items = useMemo(
    () =>
      buildAssignedSettlementItems({
        schedules: schedules.items,
        scopeStatus: schedules.scopeStatus,
        receipts: receipts.isError ? [] : (receipts.data ?? []),
        settlements: settlements.isError ? [] : (settlements.data ?? []),
        individualSchedules:
          !individualAudience || individual.isError || individual.isDisabled
            ? undefined
            : individual.schedules,
        lectureReports:
          !instructorAudience || lectureReports.isError
            ? undefined
            : (lectureReports.data ?? []).map(row => ({
                scheduleId: row.scheduleId,
                assignmentId: row.assignmentId,
                reportStatus: row.reportStatus,
                lectureStatus: row.lectureStatus,
                institutionName: row.institutionName,
                grade: asAssignmentDisplayText(row.grade) || null,
                startAt: row.startAt,
                endAt: row.endAt,
                sessionNo: row.sessionNo,
                lectureFeePreview: row.lectureFeePreview ?? null,
                instructorTransportPreview: row.instructorTransportPreview ?? null,
              })),
        programId,
        operationEndAt: options?.operationEndAt,
        deadlinePolicy: applicationType === 'INSTRUCTOR' ? 'payment_statement' : 'receipt',
        preferIndividualSchedules:
          individualAudience && individual.isSuccess && !individual.isDisabled,
      }),
    [
      applicationType,
      individual.schedules,
      individual.isError,
      individual.isSuccess,
      individual.isDisabled,
      instructorAudience,
      lectureReports.data,
      lectureReports.isError,
      options?.operationEndAt,
      programId,
      individualAudience,
      receipts.data,
      receipts.isError,
      schedules.items,
      schedules.scopeStatus,
      settlements.data,
      settlements.isError,
    ]
  )
  return {
    enabled,
    isLoading: enabled && (schedules.isLoading || (!schedules.isError && !joinReady)),
    isError: enabled && schedules.isError,
    isRefetching: schedules.isRefetching,
    items,
    scopeStatus: schedules.scopeStatus,
    refetch: () => {
      void schedules.refetch()
      void receipts.refetch()
      void settlements.refetch()
      if (individualAudience) void individual.refetch()
      if (instructorAudience) void lectureReports.refetch()
    },
    errorCode: schedules.errorCode,
    traceId: schedules.traceId,
    individualDisabled: individualAudience && individual.isDisabled,
    individualErrorCode: individualAudience ? individual.errorCode : null,
    individualEmpty:
      individualAudience && individual.isSuccess && individual.schedules.length === 0,
  }
}

export function useIndividualSettlementDetailQuery(settlementApplicationId: number | null | undefined) {
  const enabled =
    isRemoteApiConfigured() &&
    Boolean(getAccessToken()) &&
    settlementApplicationId != null &&
    settlementApplicationId > 0
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.individualSettlementDetail(settlementApplicationId ?? 0),
    queryFn: ({ signal }) => fetchIndividualSettlementDetail(settlementApplicationId!, signal),
    enabled,
    ...queryOptions(),
  })
  return {
    enabled,
    isLoading: enabled && query.isPending,
    isError: enabled && query.isError,
    detail: query.data ?? null,
  }
}

export function useSubmitIndividualSettlementMutation(applicationId: string | null | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      settlementApplicationId?: number
      submit?: PortalIndividualSettlementSubmitRequest
      resubmit?: PortalIndividualSettlementResubmitRequest
    }) => {
      if (!applicationId) throw new Error('applicationId is required')
      if (input.resubmit && input.settlementApplicationId != null) {
        return resubmitIndividualSettlement(input.settlementApplicationId, input.resubmit)
      }
      if (input.submit) {
        return submitIndividualSettlement(applicationId, input.submit)
      }
      throw new Error('SETTLEMENT_SUBMIT_BODY_REQUIRED')
    },
    onSuccess: detail => {
      if (!applicationId) return
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.individualSettlementSchedules(applicationId),
      })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.settlementApplications(),
      })
      if (detail.settlementApplicationId != null) {
        void queryClient.invalidateQueries({
          queryKey: platformQueryKeys.mypage.individualSettlementDetail(detail.settlementApplicationId),
        })
      }
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.all(),
      })
      void queryClient.invalidateQueries({
        queryKey: [...platformQueryKeys.mypage.all(), 'lecture-report-assignments'],
      })
    },
  })
}

export function useApplicationSurveyFormQuery(
  programId: string | null | undefined,
  bindingId: string | null | undefined,
  templateVersionId?: number
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
      templateVersionId,
    }),
    queryFn: ({ signal }) =>
      fetchPortalSurveyFormBinding(numericProgramId!, numericBindingId!, signal),
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
    error: enabled ? query.error : null,
    document: query.data ?? null,
  }
}

export function useSubmitEducationSurveyMutation(
  programId: string | null | undefined,
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined
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
        ...(input.contextType ? { contextType: input.contextType } : {}),
        ...(input.contextId != null ? { contextId: input.contextId } : {}),
      })
    },
    onSuccess: () => {
      if (!applicationType || !applicationId) return
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.forms(
          applicationType,
          applicationId,
          'SURVEY'
        ),
      })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.forms(
          applicationType,
          applicationId,
          'SATISFACTION'
        ),
      })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.detail(
          applicationType,
          applicationId,
        ),
        exact: true,
      })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.all(),
      })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.program.availableForms(String(numericProgramId ?? '')),
      })
      void queryClient.invalidateQueries({
        queryKey: [...platformQueryKeys.mypage.programApplications.all(), 'form-binding'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...platformQueryKeys.mypage.programApplications.all(), 'form-binding-render'],
      })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.listPrefix(),
      })
    },
  })
}
