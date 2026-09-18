/**
 * 강사 신청자 상세 편집.
 * OpenAPI에 강사 신청 body PATCH 없음 (코멘트만 PATCH) — P2-6. 저장은 미연동 안내.
 */

import { useCallback, useEffect, useState } from 'react'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import {
  parseApplicantInstructorEditDraft,
  rowToInstructorEditDraft,
  type ApplicantInstructorEditDraft,
} from '@/features/program/general/lib/applicant-instructor-detail-edit'
import { PROGRAM_API_UNAVAILABLE_SAVE_CONTENT } from '@/features/program/shared/lib/program-api-unavailable'

export interface UseApplicantInstructorDetailEditParams {
  instructor: ApplicantInstructorRow | null
  onSaved: (updatedRow: ApplicantInstructorRow) => void
}

export function useApplicantInstructorDetailEdit({
  instructor,
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

  const saveEdit = useCallback((): boolean => {
    if (!instructor || !draft) return false

    const parsed = parseApplicantInstructorEditDraft(draft)
    if (!parsed.success) {
      setValidationErrors(parsed.errors)
      return false
    }

    setValidationErrors({ form: PROGRAM_API_UNAVAILABLE_SAVE_CONTENT })
    return false
  }, [instructor, draft])

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
