import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { shouldUseTrainedTeacherProgramsRemoteApi } from './capabilities'
import { trainedTeacherQueryKeys } from './query-keys'
import {
  bulkDownloadTrainedTeacherEducationJournals,
  downloadTrainedTeacherEducationJournal,
  listTrainedTeacherEducationJournals,
  listTrainedTeacherParticipatingInstitutions,
} from './education-journals-service'
import type { TrainedTeachersEducationJournalEntry } from '@/data/mock/trained-teachers-institution-detail'

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
  enabled = true
) {
  const remoteEnabled = shouldUseTrainedTeacherProgramsRemoteApi()
  return useQuery({
    queryKey: trainedTeacherQueryKeys.participatingInstitutions(programId ?? ''),
    queryFn: () => listTrainedTeacherParticipatingInstitutions(programId!),
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
