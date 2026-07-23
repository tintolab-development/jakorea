import { useCallback, useEffect, useState } from 'react'
import { patchApplicantInstructorDetail } from '@/data/mock/applicant-instructors'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import {
  draftToInstructorSavePayload,
  parseApplicantInstructorEditDraft,
  rowToInstructorEditDraft,
  type ApplicantInstructorEditDraft,
} from '@/features/program/general/lib/applicant-instructor-detail-edit'

/**
 * 강사 신청자 상세 편집 — mock patch 유지 (admin application detail PATCH 계약 없음 · P2-6).
 */

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

  const saveEdit = useCallback((): boolean => {
    if (!instructor || !draft) return false

    const parsed = parseApplicantInstructorEditDraft(draft)
    if (!parsed.success) {
      setValidationErrors(parsed.errors)
      return false
    }

    const updated = patchApplicantInstructorDetail(
      instructor.id,
      draftToInstructorSavePayload(draft)
    )
    if (!updated) {
      setValidationErrors({ form: '저장에 실패했습니다.' })
      return false
    }

    onSaved(updated)
    resetEditState()
    return true
  }, [instructor, draft, onSaved, resetEditState])

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
