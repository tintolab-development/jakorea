import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useMemo } from 'react'
import { shouldUseTrainedTeacherProgramsRemoteApi } from './capabilities'
import { trainedTeacherQueryKeys } from './query-keys'
import {
  bulkDownloadTrainedTeacherEducationJournals,
  createTrainedTeacherEducationJournalZipJob,
  downloadTrainedTeacherEducationJournal,
  getTrainedTeacherEducationJournalZipJob,
  listTrainedTeacherEducationJournals,
  listTrainedTeacherParticipatingInstitutions,
} from './education-journals-service'
import type { EducationJournalGeneratedFileJobResponse } from '@/shared/api/generated/dashboard/schemas/educationJournalGeneratedFileJobResponse'
import { isEducationJournalZipJobPending } from './education-journals-job'
import type { TrainedTeachersEducationJournalEntry } from '@/features/program/trained-teachers/model/institution-detail'
import {
  buildTrainedTeacherParticipatingInstitutionsListQuery,
  serializeTrainedTeacherOrganizationApplicationsListQuery,
  type TrainedTeacherOrganizationApplicationUiFilters,
} from './organization-applications-list-query'

const EMPTY_TT_LIST_FILTERS: TrainedTeacherOrganizationApplicationUiFilters = Object.freeze({})

export function useTrainedTeacherEducationJournals(
  programId: string | undefined,
  organizationApplicationId: string | undefined,
  enabled = true
) {
  const remoteEnabled = shouldUseTrainedTeacherProgramsRemoteApi()
  return useQuery({
    queryKey: trainedTeacherQueryKeys.educationJournals(
      programId ?? '',
      organizationApplicationId ?? ''
    ),
    queryFn: () =>
      listTrainedTeacherEducationJournals(programId!, organizationApplicationId!),
    enabled: enabled && Boolean(programId && organizationApplicationId),
    staleTime: remoteEnabled ? 30_000 : Number.POSITIVE_INFINITY,
    retry: false,
  })
}

export function useTrainedTeacherParticipatingInstitutions(
  programId: string | undefined,
  enabled = true,
  listFilters: TrainedTeacherOrganizationApplicationUiFilters = EMPTY_TT_LIST_FILTERS
) {
  const remoteEnabled = shouldUseTrainedTeacherProgramsRemoteApi()
  const listQuery = useMemo(
    () => buildTrainedTeacherParticipatingInstitutionsListQuery(listFilters),
    [listFilters]
  )
  const filtersKey = useMemo(
    () => serializeTrainedTeacherOrganizationApplicationsListQuery(listQuery),
    [listQuery]
  )

  return useQuery({
    queryKey: trainedTeacherQueryKeys.participatingInstitutions(programId ?? '', filtersKey),
    queryFn: () => listTrainedTeacherParticipatingInstitutions(programId!, listQuery),
    enabled: enabled && Boolean(programId),
    staleTime: remoteEnabled ? 30_000 : Number.POSITIVE_INFINITY,
    retry: false,
  })
}

export function useDownloadTrainedTeacherEducationJournal(programId: string | undefined) {
  return useMutation({
    mutationFn: (entry: TrainedTeachersEducationJournalEntry) =>
      downloadTrainedTeacherEducationJournal(programId!, entry),
    retry: false,
  })
}

export function useBulkDownloadTrainedTeacherEducationJournals(
  programId: string | undefined,
  organizationApplicationId: string | undefined
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entries: TrainedTeachersEducationJournalEntry[]) =>
      bulkDownloadTrainedTeacherEducationJournals(
        programId!,
        organizationApplicationId!,
        entries
      ),
    retry: false,
    onSuccess: () => {
      if (!programId || !organizationApplicationId) return
      void queryClient.invalidateQueries({
        queryKey: trainedTeacherQueryKeys.educationJournals(
          programId,
          organizationApplicationId
        ),
      })
    },
  })
}

export function useCreateTrainedTeacherEducationJournalZipJob(
  programId: string | undefined,
  organizationApplicationId: string | undefined
) {
  return useMutation<EducationJournalGeneratedFileJobResponse, Error, TrainedTeachersEducationJournalEntry[]>({
    mutationFn: entries =>
      createTrainedTeacherEducationJournalZipJob(
        programId!,
        organizationApplicationId!,
        entries
      ),
    retry: false,
  })
}

export function useTrainedTeacherEducationJournalZipJob(
  programId: string | undefined,
  organizationApplicationId: string | undefined,
  jobId: number | null
) {
  const remoteEnabled = shouldUseTrainedTeacherProgramsRemoteApi()
  return useQuery({
    queryKey: trainedTeacherQueryKeys.educationJournalZipJob(
      programId ?? '',
      organizationApplicationId ?? '',
      jobId ?? 0
    ),
    queryFn: () => getTrainedTeacherEducationJournalZipJob(jobId!),
    enabled: remoteEnabled && Boolean(programId && organizationApplicationId && jobId),
    staleTime: 0,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: false,
    refetchInterval: query => {
      if (query.state.error) return false
      return query.state.data && isEducationJournalZipJobPending(query.state.data)
        ? 1_500
        : false
    },
    refetchIntervalInBackground: false,
  })
}
