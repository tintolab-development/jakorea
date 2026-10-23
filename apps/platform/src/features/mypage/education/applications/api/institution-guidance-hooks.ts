import { isAxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ProgramDetailCase } from '@/features/program'
import { platformQueryKeys } from '@/shared/api/query-keys'
import type { ProgramApplicationType } from './types'
import { savePortalTeacherInstitutionGuidance } from './institution-guidance-client'
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
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.detail(
          applicationType,
          applicationId,
        ),
      })
    },
    onError: async error => {
      if (!isAxiosError(error) || error.response?.status !== 409) return
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.detail(
          applicationType,
          applicationId,
        ),
      })
    },
  })
}
