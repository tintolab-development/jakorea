import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  draftToParticipatingInstructorSavePayload,
  parseParticipatingInstructorEditDraft,
  rowToParticipatingInstructorEditDraft,
  type ParticipatingInstructorEditDraft,
} from '@/features/program/general/lib/participating-instructor-detail-edit'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import {
  INSTRUCTOR_FEE_POLICY_INVALID_MESSAGE,
  businessIncomeEarnerStatusPatchField,
  toInstructorApplicationFeePolicy,
} from '@/features/program/general/lib/applicant-instructor-lecture-fee-basis'
import {
  fetchInstructorApplicationDetailRemote,
  updateInstructorApplication,
} from '@/features/program/general/api/applications-api-client'
import { mapInstructorApplicationDetailToParticipatingRow } from '@/features/program/general/lib/participating-instructor-application-detail'
import { saveGeneralParticipantInstructorFeePolicy } from '@/features/program/general/api/admin-program-progress-service'
import { mapFeePolicyToLectureFeeRowFields } from '@/features/program/general/api/adapters/general-applications-adapters'
import {
  buildInstructorFeePolicySavedNotice,
  getInstructorFeePolicySaveErrorMessage,
} from '@/features/program/general/lib/participating-instructor-fee-policy'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import {
  generalApplicationsQueryKeys,
  generalProgramProgressQueryKeys,
} from '@/features/program/general/api/general-applications-query-keys'
import { shouldUseOrganizationApplicationRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { PROGRAM_API_UNAVAILABLE_SAVE_CONTENT } from '@/features/program/shared/lib/program-api-unavailable'
import { cmsAlertModal, showUpdateCompletedAlert, useCmsAlert } from '@/shared/ui'
import { MESSAGES } from '@/shared/constants/messages'

import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'

/**
 * 참여 강사 신청 정보 편집 (BE 회신 A4).
 * - 강사비: 신청 유무와 관계없이 `PATCH …/participants/{participantId}/instructor-fee-policy` 로 통일
 *   (신청 있는 강사는 신청서 feePolicy도 같이 바뀐다 — 정본 한 곳)
 * - 사업소득자 여부: 신청서 항목이라 강사 신청이 있을 때만 `PATCH instructor-applications` (바뀐 경우만)
 * - 신청 있는 강사는 GET 신청 상세로 폼 복원, 직접 추가 강사는 강사비 응답(서버 정규화 값)으로 복원
 */
export interface UseParticipatingInstructorDetailEditParams {
  instructor: ParticipatingInstructorRow
  programId: string
  onSaved: (updatedRow: ParticipatingInstructorRow) => void
}

export function useParticipatingInstructorDetailEdit({
  instructor,
  programId,
  onSaved,
}: UseParticipatingInstructorDetailEditParams) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState<ParticipatingInstructorEditDraft | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const { showAlert } = useCmsAlert()
  const instructorKey = String(instructor.id ?? '')
  const instructorKeyRef = useRef(instructorKey)
  const savingRef = useRef(false)

  const resetEditState = useCallback(() => {
    savingRef.current = false
    setIsEditing(false)
    setIsSaving(false)
    setDraft(null)
    setValidationErrors({})
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- 다른 강사로 바뀌면 편집 draft 초기화 */
  useEffect(() => {
    if (instructorKeyRef.current === instructorKey) return
    instructorKeyRef.current = instructorKey
    resetEditState()
  }, [instructorKey, resetEditState])
  /* eslint-enable react-hooks/set-state-in-effect */

  const enterEdit = useCallback(() => {
    setIsEditing(true)
    setDraft(prev => prev ?? rowToParticipatingInstructorEditDraft(instructor))
    setValidationErrors({})
  }, [instructor])

  const cancelEdit = useCallback(() => {
    resetEditState()
  }, [resetEditState])

  const updateDraft = useCallback((partial: Partial<ParticipatingInstructorEditDraft>) => {
    setDraft(prev => (prev ? { ...prev, ...partial } : prev))
    setValidationErrors({})
  }, [])

  const saveEdit = useCallback(async (): Promise<boolean> => {
    if (!draft || savingRef.current) return false

    const parsed = parseParticipatingInstructorEditDraft(draft)
    if (!parsed.success) {
      setValidationErrors(parsed.errors)
      void showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return false
    }

    const applicationId = instructor.instructorApplicationId?.trim() || undefined
    const participantId = String(instructor.id ?? '').trim()
    if (!participantId) {
      const message = '참여 강사 ID가 없어 강사비를 저장할 수 없습니다.'
      setValidationErrors({ form: message })
      void showAlert({ title: '안내', content: message })
      return false
    }

    if (!shouldUseOrganizationApplicationRemoteApi()) {
      setValidationErrors({ form: PROGRAM_API_UNAVAILABLE_SAVE_CONTENT })
      void showAlert({ title: '안내', content: PROGRAM_API_UNAVAILABLE_SAVE_CONTENT })
      return false
    }

    const payload = draftToParticipatingInstructorSavePayload(draft)
    const feePolicy = toInstructorApplicationFeePolicy({
      basisType: payload.lectureFeeBasisType,
      measure: payload.lectureFeeMeasure,
      amount: payload.lectureFeeAmount,
      instructorFeeGrade: payload.instructorFeeGradeLabel,
    })
    if (!feePolicy) {
      setValidationErrors({ form: INSTRUCTOR_FEE_POLICY_INVALID_MESSAGE })
      void showAlert({ title: '안내', content: INSTRUCTOR_FEE_POLICY_INVALID_MESSAGE })
      return false
    }

    savingRef.current = true
    setIsSaving(true)
    let feeSaved = false
    try {
      const feeResponse = await saveGeneralParticipantInstructorFeePolicy(
        programId,
        participantId,
        feePolicy
      )
      feeSaved = true

      const businessIncomePatch = applicationId
        ? businessIncomeEarnerStatusPatchField(
            instructor.businessIncomeEarnerStatus,
            payload.businessIncomeEarnerStatus
          )
        : {}
      if (applicationId && Object.keys(businessIncomePatch).length > 0) {
        await updateInstructorApplication(applicationId, businessIncomePatch)
      }

      let updatedRow: ParticipatingInstructorRow
      if (applicationId) {
        const refreshed = await fetchInstructorApplicationDetailRemote(applicationId)
        void queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.instructorDetail(applicationId),
        })
        updatedRow = mapInstructorApplicationDetailToParticipatingRow(refreshed, instructor, programId)
      } else {
        updatedRow = { ...instructor, ...mapFeePolicyToLectureFeeRowFields(feeResponse.feePolicy) }
      }
      // participants 목록의 instructorFeePolicy 정본도 바뀌었다 — 진행 현황 강사 목록만 무효화
      void queryClient.invalidateQueries({
        queryKey: generalProgramProgressQueryKeys.instructors(programId),
      })

      const feeChanged =
        updatedRow.lectureFeeBasisType !== instructor.lectureFeeBasisType ||
        (updatedRow.lectureFeeMeasure ?? '') !== (instructor.lectureFeeMeasure ?? '') ||
        (updatedRow.lectureFeeAmount ?? '') !== (instructor.lectureFeeAmount ?? '')
      onSaved(updatedRow)
      resetEditState()
      if (feeChanged) {
        // 기존 「수정 완료」 알림 안에 정산 반영 안내를 덧붙인다(새 UI 없음)
        cmsAlertModal.show({
          title: '수정 완료',
          content: `${MESSAGES.success.updated} ${buildInstructorFeePolicySavedNotice(feeResponse.updatedAssignmentCount)}`,
          confirmLabel: '확인',
        })
      } else {
        showUpdateCompletedAlert()
      }
      return true
    } catch (error) {
      // 강사비는 저장됐고 사업소득자 여부·재조회만 실패한 경우 — 강사비 저장 성공을 함께 알린다
      const message = feeSaved
        ? `강사비는 저장되었지만 나머지 정보를 저장하지 못했습니다. ${getGeneralProgramApiErrorMessage(
            error,
            '다시 시도해 주세요.'
          )}`
        : getInstructorFeePolicySaveErrorMessage(
            error,
            '강사비를 저장하지 못했습니다. 다시 시도해 주세요.'
          )
      setValidationErrors({ form: message })
      void showAlert({ title: '저장 실패', content: message })
      return false
    } finally {
      savingRef.current = false
      setIsSaving(false)
    }
  }, [draft, instructor, onSaved, programId, queryClient, resetEditState, showAlert])

  return {
    isEditing,
    isSaving,
    draft,
    validationErrors,
    enterEdit,
    cancelEdit,
    saveEdit,
    updateDraft,
  }
}
