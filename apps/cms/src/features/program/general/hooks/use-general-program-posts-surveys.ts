import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createGeneralProgramPost,
  fetchGeneralProgramPosts,
  fetchGeneralProgramSurveyResponses,
  fetchGeneralProgramSurveySummary,
  fetchGeneralProgramSurveys,
} from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import type { ProgramPost } from '@/types/domain'
import type { ProgramPostListItemResponse } from '@/shared/api/generated/dashboard/schemas/programPostListItemResponse'
import type { ProgramSurveyResponse } from '@/shared/api/generated/dashboard/schemas/programSurveyResponse'
import type { RegisteredSurvey } from '@/features/program/shared/lib/survey-management/survey-management-types'
import type { SurveyResponseListItemResponse } from '@/shared/api/generated/dashboard/schemas/surveyResponseListItemResponse'
import type { SurveySummaryResponse } from '@/shared/api/generated/dashboard/schemas/surveySummaryResponse'

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

function mapSurveyItem(dto: ProgramSurveyResponse, index: number): RegisteredSurvey {
  return {
    id: String(dto.templateVersionId ?? dto.templateId ?? index),
    title: dto.templateName?.trim() || dto.versionLabel?.trim() || '설문',
    templateId: String(dto.templateId ?? ''),
    status: 'in_progress',
    responseCount: dto.responseCount ?? 0,
    participantTotal: 0,
  }
}

export function useGeneralProgramPosts(programId: string | undefined) {
  const remoteEnabled = shouldUseGeneralProgramsRemoteApi() && Boolean(programId)
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
    return (query.data ?? []).map(item => mapPostListItem(item, programId))
  }, [programId, query.data, remoteEnabled])

  return {
    posts,
    loading: remoteEnabled ? query.isFetching : false,
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

export function useGeneralProgramSurveys(programId: string | undefined) {
  const remoteEnabled = shouldUseGeneralProgramsRemoteApi() && Boolean(programId)
  const query = useQuery({
    queryKey: generalProgramQueryKeys.surveys(programId ?? ''),
    queryFn: () => fetchGeneralProgramSurveys(programId!),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const registeredSurveys = useMemo(() => {
    if (!remoteEnabled) return null
    return (query.data ?? []).map(mapSurveyItem)
  }, [query.data, remoteEnabled])

  return {
    registeredSurveys,
    rawSurveys: (query.data ?? null) as ProgramSurveyResponse[] | null,
    loading: remoteEnabled ? query.isFetching : false,
    isRemoteDataSource: remoteEnabled && !query.isError,
  }
}

export function useGeneralProgramSurveyResponses(
  programId: string | undefined,
  templateVersionId: string | undefined
) {
  const remoteEnabled =
    shouldUseGeneralProgramsRemoteApi() && Boolean(programId) && Boolean(templateVersionId)
  const query = useQuery({
    queryKey: generalProgramQueryKeys.surveyResponses(programId ?? '', templateVersionId ?? ''),
    queryFn: () => fetchGeneralProgramSurveyResponses(programId!, templateVersionId!),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  return {
    responses: (query.data ?? null) as SurveyResponseListItemResponse[] | null,
    loading: remoteEnabled ? query.isFetching : false,
    isRemoteDataSource: remoteEnabled && !query.isError,
  }
}

export function useGeneralProgramSurveySummary(
  programId: string | undefined,
  templateVersionId: string | undefined
) {
  const remoteEnabled =
    shouldUseGeneralProgramsRemoteApi() && Boolean(programId) && Boolean(templateVersionId)
  const query = useQuery({
    queryKey: generalProgramQueryKeys.surveySummary(programId ?? '', templateVersionId ?? ''),
    queryFn: () => fetchGeneralProgramSurveySummary(programId!, templateVersionId!),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  return {
    summary: (query.data ?? null) as SurveySummaryResponse[] | null,
    loading: remoteEnabled ? query.isFetching : false,
    isRemoteDataSource: remoteEnabled && !query.isError,
  }
}
