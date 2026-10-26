import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  uploadMemberPortalFile,
  validateMemberPortalFile,
} from '@/features/mypage/instructor-apply/api/member-file-upload'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { validateUploadBatch } from '@/shared/lib/file-upload-policy'
import type { ProgramApplicationType } from '../../applications/api/types'
import {
  PORTAL_ASSIGNMENT_FILE_PURPOSE,
  PORTAL_ASSIGNMENT_MAX_FILE_BYTES,
  PORTAL_ASSIGNMENT_MAX_FILE_COUNT,
  PORTAL_ASSIGNMENT_MAX_SUBMISSION_ITEMS,
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
  /** 제출할 URL — 파일 개수·파일 용량 계산에는 포함하지 않는다. */
  urls: string[]
}

export class AssignmentFileCountExceededError extends Error {
  constructor() {
    super(`과제 파일은 최대 ${PORTAL_ASSIGNMENT_MAX_FILE_COUNT}개까지 제출할 수 있습니다.`)
    this.name = 'AssignmentFileCountExceededError'
  }
}

/** 파일 개수·파일당 용량·전체 용량 업로드 정책 위반 */
export class AssignmentUploadPolicyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AssignmentUploadPolicyError'
  }
}

export class AssignmentSubmissionRequiredError extends Error {
  constructor() {
    super('과제 파일 또는 링크를 1개 이상 첨부해 제출해 주세요.')
    this.name = 'AssignmentSubmissionRequiredError'
  }
}

export class AssignmentSubmissionLimitExceededError extends Error {
  constructor() {
    super('과제 파일과 링크를 합쳐 최대 20개까지 제출할 수 있어요.')
    this.name = 'AssignmentSubmissionLimitExceededError'
  }
}

const ASSIGNMENT_FILE_POLICY = { maxBytes: PORTAL_ASSIGNMENT_MAX_FILE_BYTES }

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

      const urls = [...new Set(input.urls.map(url => url.trim()).filter(Boolean))]
      const finalFileCount = input.keepFileObjectIds.length + input.newFiles.length
      if (finalFileCount + urls.length === 0) {
        throw new AssignmentSubmissionRequiredError()
      }
      if (finalFileCount + urls.length > PORTAL_ASSIGNMENT_MAX_SUBMISSION_ITEMS) {
        throw new AssignmentSubmissionLimitExceededError()
      }
      if (finalFileCount > PORTAL_ASSIGNMENT_MAX_FILE_COUNT) {
        throw new AssignmentFileCountExceededError()
      }
      input.newFiles.forEach(file => validateMemberPortalFile(file, ASSIGNMENT_FILE_POLICY))
      const batchError = validateUploadBatch({
        currentCount: input.keepFileObjectIds.length,
        currentTotalBytes: 0,
        incoming: input.newFiles,
      })
      if (batchError) throw new AssignmentUploadPolicyError(batchError)
      const uploadedIds = await Promise.all(
        input.newFiles.map(file =>
          uploadMemberPortalFile({ file, filePurpose: PORTAL_ASSIGNMENT_FILE_PURPOSE }),
        ),
      )
      const fileObjectIds = [...input.keepFileObjectIds, ...uploadedIds]
      const body = {
        ...(fileObjectIds.length > 0 ? { fileObjectIds } : {}),
        ...(urls.length > 0 ? { urls } : {}),
      }
      return input.mode === 'revise'
        ? revisePortalScheduleAssignment(applicationType, applicationId, input.scheduleId, body)
        : submitPortalScheduleAssignment(applicationType, applicationId, input.scheduleId, body)
    },
    // 409(이미 제출·미제출·수정 불가) 이후에도 canSubmit/canResubmit 을 서버 값으로 맞춘다.
    onSettled: () => {
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
