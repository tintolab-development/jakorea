import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchGeneralProgramPosts,
  fetchGeneralProgramSurveys,
} from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import type { ProgramPost } from '@/types/domain'
import type { ProgramPostListItemResponse } from '@/shared/api/generated/dashboard/schemas/programPostListItemResponse'
import type { ProgramSurveyResponse } from '@/shared/api/generated/dashboard/schemas/programSurveyResponse'
import type { RegisteredSurvey } from '@/features/program/shared/lib/survey-management/survey-management-types'

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
    loading: remoteEnabled ? query.isFetching : false,
    isRemoteDataSource: remoteEnabled && !query.isError,
  }
}
