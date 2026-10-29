import { useCallback, useEffect, useRef, useState } from 'react'
import {
  draftToParticipatingInstructorSavePayload,
  parseParticipatingInstructorEditDraft,
  rowToParticipatingInstructorEditDraft,
  type ParticipatingInstructorEditDraft,
} from '@/features/program/general/lib/participating-instructor-detail-edit'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import {
  INSTRUCTOR_FEE_POLICY_INVALID_MESSAGE,
  toInstructorApplicationFeePolicy,
} from '@/features/program/general/lib/applicant-instructor-lecture-fee-basis'
import {
  fetchInstructorApplicationDetailRemote,
  updateInstructorApplication,
} from '@/features/program/general/api/applications-api-client'
import { mapInstructorApplicationDetailToParticipatingRow } from '@/features/program/general/lib/participating-instructor-application-detail'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { shouldUseOrganizationApplicationRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { PROGRAM_API_UNAVAILABLE_SAVE_CONTENT } from '@/features/program/shared/lib/program-api-unavailable'
import { showUpdateCompletedAlert, useCmsAlert } from '@/shared/ui'
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
        businessIncomeEarnerStatus: payload.businessIncomeEarnerStatus,
      })
      const refreshed = await fetchInstructorApplicationDetailRemote(applicationId)
      onSaved(mapInstructorApplicationDetailToParticipatingRow(refreshed, instructor, programId))
      resetEditState()
      showUpdateCompletedAlert()
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
  }, [draft, instructor, onSaved, programId, resetEditState, showAlert])

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
