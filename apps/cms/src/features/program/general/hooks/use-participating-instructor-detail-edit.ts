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
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { shouldUseOrganizationApplicationRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { PROGRAM_API_UNAVAILABLE_SAVE_CONTENT } from '@/features/program/shared/lib/program-api-unavailable'
import { cmsAlertModal, showUpdateCompletedAlert, useCmsAlert } from '@/shared/ui'
import { MESSAGES } from '@/shared/constants/messages'

/** 참여 강사 강사비 수정 안내(C1) — 승인 후 수정은 이미 배정된 회차에 반영되지 않는다 */
export const PARTICIPATING_INSTRUCTOR_FEE_CHANGE_NOTICE =
  '이미 배정된 회차에는 적용되지 않아요. 기존 회차는 지급조서 정정으로 처리해 주세요.'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'

/**
 * 참여 강사 신청 정보 편집.
 * PATCH feePolicy + businessIncomeEarnerStatus 후 GET 상세로 폼 복원.
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

    const applicationId = instructor.instructorApplicationId?.trim()
    if (!applicationId) {
      const message =
        '강사 신청 ID가 없어 신청 정보를 저장할 수 없습니다. 관리자 등록 강사는 신청 정보 수정 대상이 아닙니다.'
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
    try {
      await updateInstructorApplication(applicationId, {
        feePolicy,
        ...businessIncomeEarnerStatusPatchField(
          instructor.businessIncomeEarnerStatus,
          payload.businessIncomeEarnerStatus
        ),
      })
      const refreshed = await fetchInstructorApplicationDetailRemote(applicationId)
      void queryClient.invalidateQueries({
        queryKey: generalApplicationsQueryKeys.instructorDetail(applicationId),
      })
      const updatedRow = mapInstructorApplicationDetailToParticipatingRow(
        refreshed,
        instructor,
        programId
      )
      const feeChanged =
        updatedRow.lectureFeeBasisType !== instructor.lectureFeeBasisType ||
        (updatedRow.lectureFeeMeasure ?? '') !== (instructor.lectureFeeMeasure ?? '') ||
        (updatedRow.lectureFeeAmount ?? '') !== (instructor.lectureFeeAmount ?? '')
      onSaved(updatedRow)
      resetEditState()
      if (feeChanged) {
        // 기존 「수정 완료」 알림 안에 C1 안내를 덧붙인다(새 UI 없음)
        cmsAlertModal.show({
          title: '수정 완료',
          content: `${MESSAGES.success.updated} ${PARTICIPATING_INSTRUCTOR_FEE_CHANGE_NOTICE}`,
          confirmLabel: '확인',
        })
      } else {
        showUpdateCompletedAlert()
      }
      return true
    } catch (error) {
      const message = getGeneralProgramApiErrorMessage(
        error,
        '강사 정보를 저장하지 못했습니다. 다시 시도해 주세요.'
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
