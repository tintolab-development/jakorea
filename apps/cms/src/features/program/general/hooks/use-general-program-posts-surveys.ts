/**
 * 일반 프로그램 posts + surveys hybrid hooks
 * Surveys: list / responses(+detail answers) / summary / form-bindings CRUD
 */

import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createGeneralProgramFormBinding,
  createGeneralProgramPost,
  deleteGeneralProgramFormBinding,
  fetchGeneralProgramFormBindings,
  fetchGeneralProgramPosts,
  fetchGeneralProgramSurveyResponseDetail,
  fetchGeneralProgramSurveyResponses,
  fetchGeneralProgramSurveySummary,
  fetchGeneralProgramSurveys,
} from '@/features/program/general/api/admin-general-programs-service'
import {
  classifyProgramFormBindings,
  mapSurveyResponseListItemToPollResponse,
  mergeSurveysWithBindings,
  surveyResponseNeedsDetail,
  type ClassifiedFormBinding,
} from '@/features/program/general/api/adapters/program-survey-adapters'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { useProgramsReadsRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import type { ProgramPost } from '@/types/domain'
import type { ProgramPostListItemResponse } from '@/shared/api/generated/dashboard/schemas/programPostListItemResponse'
import type { ProgramFormBindingRequest } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingRequest'
import type { RegisteredSurvey } from '@/features/program/shared/lib/survey-management/survey-management-types'
import type { SurveyPollRawResponse } from '@/features/program/shared/lib/survey-management/survey-management-types'
import type { SurveySummaryResponse } from '@/shared/api/generated/dashboard/schemas/surveySummaryResponse'
import type { SurveyResponseListItemResponse } from '@/shared/api/generated/dashboard/schemas/surveyResponseListItemResponse'

const DETAIL_FETCH_CONCURRENCY = 4

function mapPostListItem(dto: ProgramPostListItemResponse, programId: string): ProgramPost {
  const createdAt = dto.createdAt ?? new Date().toISOString()
  return {
    id: String(dto.postId ?? ''),
    programId,
    authorName: 'JA KOREA 알림',
    title: dto.title?.trim() || '제목 없음',
    content: '',
    read: (dto.unreadCount ?? 0) === 0,
    viewCount: dto.readCount ?? 0,
    reactionCount: 0,
    commentCount: 0,
    attachmentCount: 0,
    publishedAt: createdAt,
    createdAt,
    updatedAt: dto.updatedAt ?? createdAt,
  }
}

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

  const posts = useMemo(() => {
    if (!remoteEnabled || !programId) return null
    // 로딩 중에는 []가 아니라 null — empty→API 플래시·스피너 스킵 방지
    if (query.data === undefined) return null
    return query.data.map(item => mapPostListItem(item, programId))
  }, [programId, query.data, remoteEnabled])

  return {
    posts,
    loading: remoteEnabled ? query.isFetching && query.data === undefined : false,
    isRemoteDataSource: remoteEnabled && !query.isError,
    invalidatePosts: async () => {
      if (!programId) return
      await queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.posts(programId) })
    },
    createPost: async (payload: { title?: string; content: string; visibilityType?: string }) => {
      if (!programId || !remoteEnabled) return null
      const result = await createGeneralProgramPost(programId, payload)
      await queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.posts(programId) })
      return result
    },
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
