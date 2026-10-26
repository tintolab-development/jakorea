import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadMemberPortalFile } from '@/features/mypage/instructor-apply/api/member-file-upload'
import { platformQueryKeys } from '@/shared/api/query-keys'
import type { ProgramApplicationType } from '../../applications/api/types'
import {
  PORTAL_ASSIGNMENT_FILE_PURPOSE,
  revisePortalScheduleAssignment,
  submitPortalScheduleAssignment,
} from './assignment-client'

export type ScheduleAssignmentFilesInput = {
  scheduleId: number
  /** submit: 최초 제출, revise: 수정 제출 */
  mode: 'submit' | 'revise'
  /** 유지할 기존 제출 파일 */
  keepFileObjectIds: number[]
  /** 새로 업로드할 파일 */
  newFiles: File[]
}

/** 새 파일 업로드 → 최종 파일 집합으로 제출·수정 제출 → 교육일정 재조회 */
export function useScheduleAssignmentFilesMutation(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ScheduleAssignmentFilesInput) => {
      if (!applicationType || !applicationId) {
        throw new Error('과제 제출 범위가 올바르지 않습니다.')
      }
      const uploadedIds = await Promise.all(
        input.newFiles.map(file =>
          uploadMemberPortalFile({ file, filePurpose: PORTAL_ASSIGNMENT_FILE_PURPOSE }),
        ),
      )
      const body = { fileObjectIds: [...input.keepFileObjectIds, ...uploadedIds] }
      return input.mode === 'revise'
        ? revisePortalScheduleAssignment(applicationType, applicationId, input.scheduleId, body)
        : submitPortalScheduleAssignment(applicationType, applicationId, input.scheduleId, body)
    },
    onSuccess: () => {
      if (!applicationType || !applicationId) return
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.schedules(
          applicationType,
          applicationId,
        ),
        exact: true,
      })
    },
    retry: false,
  })
}
