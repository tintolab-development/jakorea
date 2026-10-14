/**
 * 강사 신청자 상세 편집.
 * PATCH feePolicy + businessIncomeEarnerStatus + managerComment 후 GET 상세로 폼 복원.
 */

import { useCallback, useEffect, useState } from 'react'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import {
  draftToInstructorSavePayload,
  parseApplicantInstructorEditDraft,
  rowToInstructorEditDraft,
  type ApplicantInstructorEditDraft,
} from '@/features/program/general/lib/applicant-instructor-detail-edit'
import {
  INSTRUCTOR_FEE_POLICY_INVALID_MESSAGE,
  toInstructorApplicationFeePolicy,
} from '@/features/program/general/lib/applicant-instructor-lecture-fee-basis'
import {
  fetchInstructorApplicationDetailRemote,
  updateInstructorApplication,
} from '@/features/program/general/api/applications-api-client'
import { mapInstructorApplicationDetailToApplicantRow } from '@/features/program/general/api/adapters/general-applications-adapters'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'

export interface UseApplicantInstructorDetailEditParams {
  instructor: ApplicantInstructorRow | null
  onSaved: (updatedRow: ApplicantInstructorRow) => void
}

export function useApplicantInstructorDetailEdit({
  instructor,
  onSaved,
}: UseApplicantInstructorDetailEditParams) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<ApplicantInstructorEditDraft | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const resetEditState = useCallback(() => {
    setIsEditing(false)
    setDraft(null)
    setValidationErrors({})
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- instructor 변경 시 편집 draft 초기화 */
  useEffect(() => {
    resetEditState()
  }, [instructor?.id, resetEditState])
  /* eslint-enable react-hooks/set-state-in-effect */

  const enterEdit = useCallback(() => {
    if (!instructor) return
    setDraft(rowToInstructorEditDraft(instructor))
    setValidationErrors({})
    setIsEditing(true)
  }, [instructor])

  const cancelEdit = useCallback(() => {
    resetEditState()
  }, [resetEditState])

  const updateDraft = useCallback((partial: Partial<ApplicantInstructorEditDraft>) => {
    setDraft(prev => (prev ? { ...prev, ...partial } : prev))
    setValidationErrors({})
  }, [])

  const saveEdit = useCallback(async (): Promise<boolean> => {
    if (!instructor || !draft) return false

    const parsed = parseApplicantInstructorEditDraft(draft)
    if (!parsed.success) {
      setValidationErrors(parsed.errors)
      return false
    }

    const payload = draftToInstructorSavePayload(draft)
    const feePolicy = toInstructorApplicationFeePolicy({
      basisType: payload.lectureFeeBasisType,
      measure: payload.lectureFeeMeasure,
      amount: payload.lectureFeeAmount,
      instructorFeeGrade: payload.instructorFeeGradeLabel,
    })
    if (!feePolicy) {
      setValidationErrors({ form: INSTRUCTOR_FEE_POLICY_INVALID_MESSAGE })
      return false
    }

    try {
      await updateInstructorApplication(instructor.id, {
        managerComment: payload.managerComment ?? null,
        feePolicy,
        businessIncomeEarnerStatus: payload.businessIncomeEarnerStatus,
      })
      const refreshed = await fetchInstructorApplicationDetailRemote(instructor.id)
      onSaved(mapInstructorApplicationDetailToApplicantRow(refreshed, instructor))
      resetEditState()
      return true
    } catch (error) {
      setValidationErrors({
        form: getGeneralProgramApiErrorMessage(
          error,
          '강사 정보를 저장하지 못했습니다. 다시 시도해 주세요.'
        ),
      })
      return false
    }
  }, [draft, instructor, onSaved, resetEditState])

  return {
    isEditing,
    draft,
    validationErrors,
    enterEdit,
    cancelEdit,
    saveEdit,
    updateDraft,
  }
}
