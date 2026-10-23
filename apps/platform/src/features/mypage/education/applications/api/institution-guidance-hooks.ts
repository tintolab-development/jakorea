import { isAxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ProgramDetailCase } from '@/features/program'
import { platformQueryKeys } from '@/shared/api/query-keys'
import type { ProgramApplicationType } from './types'
import {
  confirmUjatTemporarySchedule,
  savePortalTeacherInstitutionGuidance,
} from './institution-guidance-client'
import type { TeacherInstitutionGuidanceFormState } from '../lib/institution-guidance-from-answers'

export function usePatchOrganizationGuidanceAnswersMutation(
  applicationType: ProgramApplicationType,
  applicationId: string,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      detailCase: ProgramDetailCase | undefined
      state: TeacherInstitutionGuidanceFormState
      existingAnswers?: Record<string, unknown> | null
    }) =>
      savePortalTeacherInstitutionGuidance({
        applicationType,
        applicationId,
        detailCase: input.detailCase,
        state: input.state,
        existingAnswers: input.existingAnswers,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: platformQueryKeys.mypage.programApplications.detail(
            applicationType,
            applicationId,
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: platformQueryKeys.mypage.programApplications.listPrefix(),
        }),
      ])
    },
    onError: async error => {
      if (!isAxiosError(error) || error.response?.status !== 409) return
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: platformQueryKeys.mypage.programApplications.detail(
            applicationType,
            applicationId,
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: platformQueryKeys.mypage.programApplications.listPrefix(),
        }),
      ])
    },
  })
}

export function useConfirmUjatTemporaryScheduleMutation(
  applicationType: ProgramApplicationType,
  applicationId: string,
) {
  const queryClient = useQueryClient()
  const refreshApplicationQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.detail(
          applicationType,
          applicationId,
        ),
      }),
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.listPrefix(),
      }),
    ])
  }

  return useMutation({
    mutationFn: (assignmentRevision: number) =>
      confirmUjatTemporarySchedule(applicationId, { assignmentRevision }),
    onSuccess: refreshApplicationQueries,
    onError: refreshApplicationQueries,
  })
}
