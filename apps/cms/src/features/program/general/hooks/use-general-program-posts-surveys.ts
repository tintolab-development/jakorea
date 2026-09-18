/**
 * 일반 프로그램 posts + surveys hybrid hooks
 * Surveys: list / responses(+detail answers) / summary / form-bindings CRUD
 */

import { useCallback, useMemo } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createGeneralProgramFormBinding,
  createGeneralProgramPost,
  createGeneralProgramPostComment,
  createGeneralProgramPostUnreadReminder,
  deleteGeneralProgramFormBinding,
  deleteGeneralProgramPost,
  deleteGeneralProgramPostReaction,
  fetchGeneralProgramFormBindings,
  fetchGeneralProgramPostAttachments,
  fetchGeneralProgramPostComments,
  fetchGeneralProgramPostDetail,
  fetchGeneralProgramPostReactions,
  fetchGeneralProgramPostReads,
  fetchGeneralProgramPosts,
  fetchGeneralProgramSurveyResponseDetail,
  fetchGeneralProgramSurveyResponses,
  fetchGeneralProgramSurveySummary,
  fetchGeneralProgramSurveys,
  putGeneralProgramPostReaction,
  updateGeneralProgramPost,
} from '@/features/program/general/api/admin-general-programs-service'
import {
  classifyProgramFormBindings,
  mapSurveyResponseListItemToPollResponse,
  mergeSurveysWithBindings,
  surveyResponseNeedsDetail,
  type ClassifiedFormBinding,
} from '@/features/program/general/api/adapters/program-survey-adapters'
import {
  mapProgramPostAttachmentToFile,
  mapProgramPostCommentToDomain,
  mapProgramPostListItemToDomain,
  mapProgramPostReactionItemsToUsers,
  mapProgramPostReactionSummariesToDomain,
  mapProgramPostReadsToDomainRows,
  mapProgramPostResponseToDomain,
} from '@/features/program/general/api/adapters/program-post-adapters'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { useProgramsReadsRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import type {
  ProgramFile,
  ProgramPost,
  ProgramPostComment,
  ProgramPostReaction,
  ProgramPostReactionUser,
  ProgramPostReadRow,
} from '@/types/domain'
import type { ProgramFormBindingRequest } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingRequest'
import type { RegisteredSurvey } from '@/features/program/shared/lib/survey-management/survey-management-types'
import type { SurveyPollRawResponse } from '@/features/program/shared/lib/survey-management/survey-management-types'
import type { SurveySummaryResponse } from '@/shared/api/generated/dashboard/schemas/surveySummaryResponse'
import type { SurveyResponseListItemResponse } from '@/shared/api/generated/dashboard/schemas/surveyResponseListItemResponse'

const DETAIL_FETCH_CONCURRENCY = 4

async function mapResponsesWithDetails(
  programId: string,
  templateVersionId: string,
  items: SurveyResponseListItemResponse[]
): Promise<SurveyPollRawResponse[]> {
  const results: SurveyPollRawResponse[] = new Array(items.length)
  let cursor = 0

  async function worker() {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      const item = items[index]!
      if (!surveyResponseNeedsDetail(item) || item.formResponseId == null) {
        results[index] = mapSurveyResponseListItemToPollResponse(item)
        continue
      }
      try {
        const detail = await fetchGeneralProgramSurveyResponseDetail(
          programId,
          templateVersionId,
          String(item.formResponseId)
        )
        results[index] = mapSurveyResponseListItemToPollResponse(item, detail)
      } catch {
        results[index] = mapSurveyResponseListItemToPollResponse(item)
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(DETAIL_FETCH_CONCURRENCY, Math.max(items.length, 1)) },
    () => worker()
  )
  await Promise.all(workers)
  return results
}

export function useGeneralProgramPosts(programId: string | undefined) {
  const remoteEnabled = useProgramsReadsRemoteEnabledForSurface(programId)
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: generalProgramQueryKeys.posts(programId ?? ''),
    queryFn: () => fetchGeneralProgramPosts(programId!),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const postsBase = useMemo(() => {
    if (!remoteEnabled || !programId) return null
    if (query.data === undefined) return null
    return query.data.map(item => mapProgramPostListItemToDomain(item, programId))
  }, [programId, query.data, remoteEnabled])

  const postIds = useMemo(() => (postsBase ?? []).map(post => post.id).filter(Boolean), [postsBase])

  const attachmentQueries = useQueries({
    queries: postIds.map(postId => ({
      queryKey: generalProgramQueryKeys.postAttachments(programId ?? '', postId),
      queryFn: () => fetchGeneralProgramPostAttachments(programId!, postId),
      enabled: remoteEnabled && Boolean(programId) && postIds.length > 0,
      staleTime: 30_000,
      retry: false,
    })),
  })

  const attachmentCountByPostId = useMemo(() => {
    const map = new Map<string, number>()
    postIds.forEach((postId, index) => {
      const items = attachmentQueries[index]?.data
      map.set(postId, Array.isArray(items) ? items.length : 0)
    })
    return map
  }, [attachmentQueries, postIds])

  const posts = useMemo(() => {
    if (!postsBase) return null
    return postsBase.map(post => ({
      ...post,
      attachmentCount: attachmentCountByPostId.get(post.id) ?? post.attachmentCount,
    }))
  }, [attachmentCountByPostId, postsBase])

  const files = useMemo((): ProgramFile[] | null => {
    if (!remoteEnabled || !programId || postsBase == null) return null
    if (postIds.length === 0) return []
    if (attachmentQueries.some(q => q.data === undefined && (q.isFetching || q.isLoading))) {
      return null
    }
    const collected: ProgramFile[] = []
    postIds.forEach((postId, index) => {
      const items = attachmentQueries[index]?.data ?? []
      for (const item of items) {
        const file = mapProgramPostAttachmentToFile(item, programId)
        if (file) collected.push({ ...file, postId: file.postId ?? postId })
      }
    })
    collected.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )
    return collected
  }, [attachmentQueries, postIds, postsBase, programId, remoteEnabled])

  const invalidatePosts = useCallback(async () => {
    if (!programId) return
    await queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.posts(programId) })
    await queryClient.invalidateQueries({
      queryKey: [...generalProgramQueryKeys.posts(programId)],
    })
  }, [programId, queryClient])

  return {
    posts,
    files,
    loading: remoteEnabled ? query.isFetching && query.data === undefined : false,
    isRemoteDataSource: remoteEnabled && !query.isError,
    invalidatePosts,
    createPost: async (payload: { title?: string; content: string; visibilityType?: string }) => {
      if (!programId || !remoteEnabled) return null
      const result = await createGeneralProgramPost(programId, payload)
      await invalidatePosts()
      return result
    },
    updatePost: async (
      postId: string,
      payload: { title?: string; content?: string; visibilityType?: string }
    ) => {
      if (!programId || !remoteEnabled) return null
      const result = await updateGeneralProgramPost(programId, postId, payload)
      await invalidatePosts()
      return result
    },
    deletePost: async (postId: string) => {
      if (!programId || !remoteEnabled) return
      await deleteGeneralProgramPost(programId, postId)
      await invalidatePosts()
    },
  }
}

export function useGeneralProgramPostDetail(
  programId: string | undefined,
  postId: string | undefined,
  enabled = true
) {
  const remoteEnabled = useProgramsReadsRemoteEnabledForSurface(programId)
  const active = remoteEnabled && Boolean(programId) && Boolean(postId) && enabled
  const queryClient = useQueryClient()

  const detailQuery = useQuery({
    queryKey: generalProgramQueryKeys.postDetail(programId ?? '', postId ?? ''),
    queryFn: () => fetchGeneralProgramPostDetail(programId!, postId!),
    enabled: active,
    staleTime: 30_000,
    retry: false,
  })

  const commentsQuery = useQuery({
    queryKey: generalProgramQueryKeys.postComments(programId ?? '', postId ?? ''),
    queryFn: () => fetchGeneralProgramPostComments(programId!, postId!),
    enabled: active,
    staleTime: 15_000,
    retry: false,
  })

  const reactionsQuery = useQuery({
    queryKey: generalProgramQueryKeys.postReactions(programId ?? '', postId ?? ''),
    queryFn: () => fetchGeneralProgramPostReactions(programId!, postId!),
    enabled: active,
    staleTime: 15_000,
    retry: false,
  })

  const attachmentsQuery = useQuery({
    queryKey: generalProgramQueryKeys.postAttachments(programId ?? '', postId ?? ''),
    queryFn: () => fetchGeneralProgramPostAttachments(programId!, postId!),
    enabled: active,
    staleTime: 30_000,
    retry: false,
  })

  const post = useMemo((): ProgramPost | null => {
    if (!active || !programId || !postId) return null
    const dto = detailQuery.data?.post
    if (!dto) return null
    const mapped = mapProgramPostResponseToDomain(dto, programId)
    const attachmentCount = attachmentsQuery.data?.length ?? mapped.attachmentCount
    return { ...mapped, attachmentCount }
  }, [active, attachmentsQuery.data, detailQuery.data, postId, programId])

  const comments = useMemo((): ProgramPostComment[] => {
    if (!postId || !commentsQuery.data) return []
    return commentsQuery.data.map(item => mapProgramPostCommentToDomain(item, postId))
  }, [commentsQuery.data, postId])

  const reactions = useMemo((): ProgramPostReaction[] => {
    if (!postId || !reactionsQuery.data) return []
    return mapProgramPostReactionSummariesToDomain(reactionsQuery.data.summary, postId)
  }, [postId, reactionsQuery.data])

  const reactionUsers = useMemo((): ProgramPostReactionUser[] => {
    if (!postId || !reactionsQuery.data) return []
    return mapProgramPostReactionItemsToUsers(reactionsQuery.data.items, postId)
  }, [postId, reactionsQuery.data])

  const files = useMemo((): ProgramFile[] => {
    if (!programId || !attachmentsQuery.data) return []
    return attachmentsQuery.data
      .map(item => mapProgramPostAttachmentToFile(item, programId))
      .filter((file): file is ProgramFile => file != null)
  }, [attachmentsQuery.data, programId])

  const invalidateDetail = useCallback(async () => {
    if (!programId || !postId) return
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: generalProgramQueryKeys.postDetail(programId, postId),
      }),
      queryClient.invalidateQueries({
        queryKey: generalProgramQueryKeys.postComments(programId, postId),
      }),
      queryClient.invalidateQueries({
        queryKey: generalProgramQueryKeys.postReactions(programId, postId),
      }),
      queryClient.invalidateQueries({
        queryKey: generalProgramQueryKeys.postAttachments(programId, postId),
      }),
      queryClient.invalidateQueries({
        queryKey: generalProgramQueryKeys.postReads(programId, postId),
      }),
      queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.posts(programId) }),
    ])
  }, [postId, programId, queryClient])

  return {
    isRemoteDataSource: active && !detailQuery.isError,
    loading: active && detailQuery.isFetching && detailQuery.data === undefined,
    post,
    comments,
    reactions,
    reactionUsers,
    files,
    reactionTotalCount: reactions.reduce((sum, row) => sum + row.count, 0),
    createComment: async (content: string) => {
      if (!programId || !postId || !remoteEnabled) return null
      const result = await createGeneralProgramPostComment(programId, postId, content)
      await invalidateDetail()
      return result
    },
    putReaction: async (reactionType: string) => {
      if (!programId || !postId || !remoteEnabled) return null
      const result = await putGeneralProgramPostReaction(programId, postId, reactionType)
      await invalidateDetail()
      return result
    },
    removeReaction: async () => {
      if (!programId || !postId || !remoteEnabled) return
      await deleteGeneralProgramPostReaction(programId, postId)
      await invalidateDetail()
    },
    invalidateDetail,
  }
}

/** 게시글 읽음/안읽음 현황 + 미읽음 알림 */
export function useGeneralProgramPostReads(
  programId: string | undefined,
  postId: string | undefined,
  enabled = true
) {
  const remoteEnabled = useProgramsReadsRemoteEnabledForSurface(programId)
  const queryClient = useQueryClient()
  const active = remoteEnabled && enabled && Boolean(programId) && Boolean(postId)

  const query = useQuery({
    queryKey: generalProgramQueryKeys.postReads(programId ?? '', postId ?? ''),
    queryFn: () => fetchGeneralProgramPostReads(programId!, postId!),
    enabled: active,
    staleTime: 15_000,
    retry: false,
  })

  const rows = useMemo((): ProgramPostReadRow[] => {
    if (!active || !postId || !query.data) return []
    return mapProgramPostReadsToDomainRows(query.data, postId)
  }, [active, postId, query.data])

  const readCount = useMemo(() => rows.filter(row => row.hasRead).length, [rows])
  const unreadCount = useMemo(
    () => query.data?.unreadCount ?? rows.filter(row => !row.hasRead).length,
    [query.data?.unreadCount, rows]
  )

  const invalidateReads = useCallback(async () => {
    if (!programId || !postId) return
    await queryClient.invalidateQueries({
      queryKey: generalProgramQueryKeys.postReads(programId, postId),
    })
  }, [postId, programId, queryClient])

  return {
    isRemoteDataSource: active && !query.isError,
    loading: active && query.isFetching && query.data === undefined,
    rows,
    readCount,
    unreadCount,
    sendUnreadReminder: async (memberIds: string[], message?: string) => {
      if (!programId || !postId || !remoteEnabled) return null
      const numericIds = memberIds
        .map(id => Number(id))
        .filter(id => Number.isFinite(id) && id > 0)
      const result = await createGeneralProgramPostUnreadReminder(programId, postId, {
        message: message?.trim() || '게시글을 확인해 주세요.',
        memberIds: numericIds.length > 0 ? numericIds : undefined,
      })
      await invalidateReads()
      return result
    },
    invalidateReads,
  }
}

export function useGeneralProgramFormBindings(programId: string | undefined) {
  const remoteEnabled = useProgramsReadsRemoteEnabledForSurface(programId)
  const query = useQuery({
    queryKey: generalProgramQueryKeys.formBindings(programId ?? ''),
    queryFn: () => fetchGeneralProgramFormBindings(programId!),
    enabled: remoteEnabled && Boolean(programId),
    staleTime: 30_000,
    retry: false,
  })

  const classified = useMemo((): ClassifiedFormBinding[] | null => {
    if (!remoteEnabled) return null
    return classifyProgramFormBindings(query.data ?? [])
  }, [query.data, remoteEnabled])

  return {
    bindings: query.data ?? [],
    classified,
    loading: remoteEnabled ? query.isFetching || query.isLoading : false,
    isRemoteDataSource: remoteEnabled && !query.isError,
  }
}

export function useGeneralProgramSurveys(programId: string | undefined) {
  const remoteEnabled = useProgramsReadsRemoteEnabledForSurface(programId)
  const surveysQuery = useQuery({
    queryKey: generalProgramQueryKeys.surveys(programId ?? ''),
    queryFn: () => fetchGeneralProgramSurveys(programId!),
    enabled: remoteEnabled && Boolean(programId),
    staleTime: 30_000,
    retry: false,
  })
  const bindingsQuery = useQuery({
    queryKey: generalProgramQueryKeys.formBindings(programId ?? ''),
    queryFn: () => fetchGeneralProgramFormBindings(programId!),
    enabled: remoteEnabled && Boolean(programId),
    staleTime: 30_000,
    retry: false,
  })

  const registeredSurveys = useMemo((): RegisteredSurvey[] | null => {
    if (!remoteEnabled) return null
    return mergeSurveysWithBindings(surveysQuery.data ?? [], bindingsQuery.data ?? []).filter(
      survey => {
        // 만족도·강의평가 템플릿은 전용 탭에서 처리 — poll 목록에서 제외
        const classified = classifyProgramFormBindings(bindingsQuery.data ?? [])
        const hit = classified.find(
          c =>
            String(c.binding.templateVersionId ?? '') === survey.id ||
            String(c.binding.templateId ?? '') === survey.templateId
        )
        if (!hit) return true
        return hit.kind === 'poll'
      }
    )
  }, [bindingsQuery.data, remoteEnabled, surveysQuery.data])

  const classifiedBindings = useMemo((): ClassifiedFormBinding[] | null => {
    if (!remoteEnabled) return null
    return classifyProgramFormBindings(bindingsQuery.data ?? [])
  }, [bindingsQuery.data, remoteEnabled])

  return {
    registeredSurveys,
    classifiedBindings,
    rawSurveys: surveysQuery.data ?? null,
    loading: remoteEnabled
      ? surveysQuery.isFetching ||
        surveysQuery.isLoading ||
        bindingsQuery.isFetching ||
        bindingsQuery.isLoading
      : false,
    isRemoteDataSource: remoteEnabled && !surveysQuery.isError,
  }
}

export function useGeneralProgramSurveyResponses(
  programId: string | undefined,
  templateVersionId: string | undefined
) {
  const surfaceRemote = useProgramsReadsRemoteEnabledForSurface(programId)
  const remoteEnabled = surfaceRemote && Boolean(templateVersionId)
  const query = useQuery({
    queryKey: generalProgramQueryKeys.surveyResponses(programId ?? '', templateVersionId ?? ''),
    queryFn: async () => {
      const items = await fetchGeneralProgramSurveyResponses(programId!, templateVersionId!)
      return mapResponsesWithDetails(programId!, templateVersionId!, items)
    },
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  return {
    pollResponses: (query.data ?? null) as SurveyPollRawResponse[] | null,
    /** @deprecated use pollResponses — raw list no longer exposed after adapter */
    responses: (query.data ?? null) as SurveyPollRawResponse[] | null,
    loading: remoteEnabled ? query.isFetching || query.isLoading : false,
    isRemoteDataSource: remoteEnabled && !query.isError,
  }
}

export function useGeneralProgramSurveySummary(
  programId: string | undefined,
  templateVersionId: string | undefined
) {
  const surfaceRemote = useProgramsReadsRemoteEnabledForSurface(programId)
  const remoteEnabled = surfaceRemote && Boolean(templateVersionId)
  const query = useQuery({
    queryKey: generalProgramQueryKeys.surveySummary(programId ?? '', templateVersionId ?? ''),
    queryFn: () => fetchGeneralProgramSurveySummary(programId!, templateVersionId!),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const totalResponseCount = useMemo(() => {
    const rows = query.data ?? []
    if (rows.length === 0) return 0
    return Math.max(...rows.map(r => r.totalResponseCount ?? r.responseCount ?? 0), 0)
  }, [query.data])

  return {
    summary: (query.data ?? null) as SurveySummaryResponse[] | null,
    totalResponseCount,
    loading: remoteEnabled ? query.isFetching || query.isLoading : false,
    isRemoteDataSource: remoteEnabled && !query.isError,
  }
}

export function useGeneralProgramSurveyFormBindingMutations(programId: string | undefined) {
  const remoteEnabled = useProgramsReadsRemoteEnabledForSurface(programId)
  const queryClient = useQueryClient()

  const invalidateSurveyCaches = useCallback(async () => {
    if (!programId) return
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.surveys(programId) }),
      queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.formBindings(programId) }),
      queryClient.invalidateQueries({
        queryKey: [...generalProgramQueryKeys.all, 'survey-responses', programId],
      }),
      queryClient.invalidateQueries({
        queryKey: [...generalProgramQueryKeys.all, 'survey-summary', programId],
      }),
    ])
  }, [programId, queryClient])

  const createMutation = useMutation({
    mutationFn: async (payload: ProgramFormBindingRequest) => {
      if (!programId) throw new Error('programId가 없습니다.')
      return createGeneralProgramFormBinding(programId, payload)
    },
    retry: false,
    onSuccess: async () => {
      await invalidateSurveyCaches()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (bindingId: string) => {
      if (!programId) throw new Error('programId가 없습니다.')
      await deleteGeneralProgramFormBinding(programId, bindingId)
    },
    retry: false,
    onSuccess: async () => {
      await invalidateSurveyCaches()
    },
  })

  return {
    isRemoteDataSource: remoteEnabled,
    isMutating: createMutation.isPending || deleteMutation.isPending,
    createBinding: async (payload: ProgramFormBindingRequest) => {
      if (!programId || !remoteEnabled) {
        return { ok: false as const, message: '원격 API가 비활성 상태입니다.' }
      }
      try {
        const result = await createMutation.mutateAsync(payload)
        return { ok: true as const, binding: result }
      } catch (error) {
        return {
          ok: false as const,
          message: getGeneralProgramApiErrorMessage(
            error,
            '설문 등록에 실패했습니다. 다시 시도해 주세요.'
          ),
        }
      }
    },
    deleteBinding: async (bindingId: string) => {
      if (!programId || !remoteEnabled) {
        return { ok: false as const, message: '원격 API가 비활성 상태입니다.' }
      }
      try {
        await deleteMutation.mutateAsync(bindingId)
        return { ok: true as const }
      } catch (error) {
        return {
          ok: false as const,
          message: getGeneralProgramApiErrorMessage(
            error,
            '설문 삭제에 실패했습니다. 다시 시도해 주세요.'
          ),
        }
      }
    },
    invalidateSurveyCaches,
  }
}
