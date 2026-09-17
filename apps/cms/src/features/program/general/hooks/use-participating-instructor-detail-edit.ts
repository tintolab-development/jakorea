import { useCallback, useEffect, useState } from 'react'
import {
  parseParticipatingInstructorEditDraft,
  rowToParticipatingInstructorEditDraft,
  type ParticipatingInstructorEditDraft,
} from '@/features/program/general/lib/participating-instructor-detail-edit'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import { PROGRAM_API_UNAVAILABLE_SAVE_CONTENT } from '@/features/program/shared/lib/program-api-unavailable'

/**
 * 참여 강사 신청 정보 편집.
 * OpenAPI에 강사 신청 body PATCH 없음 (코멘트만 PATCH) — P2-6. 저장은 미연동 안내.
 */
export interface UseParticipatingInstructorDetailEditParams {
  instructor: ParticipatingInstructorRow
  onSaved: (updatedRow: ParticipatingInstructorRow) => void
}

export function useParticipatingInstructorDetailEdit({
  instructor,
}: UseParticipatingInstructorDetailEditParams) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<ParticipatingInstructorEditDraft | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const resetEditState = useCallback(() => {
    setIsEditing(false)
    setDraft(null)
    setValidationErrors({})
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- instructor 변경 시 편집 draft 초기화 */
  useEffect(() => {
    resetEditState()
  }, [instructor.id, resetEditState])
  /* eslint-enable react-hooks/set-state-in-effect */

  const enterEdit = useCallback(() => {
    setDraft(rowToParticipatingInstructorEditDraft(instructor))
    setValidationErrors({})
    setIsEditing(true)
  }, [instructor])

  const cancelEdit = useCallback(() => {
    resetEditState()
  }, [resetEditState])

  const updateDraft = useCallback((partial: Partial<ParticipatingInstructorEditDraft>) => {
    setDraft(prev => (prev ? { ...prev, ...partial } : prev))
    setValidationErrors({})
  }, [])

  const saveEdit = useCallback((): boolean => {
    if (!draft) return false

    const parsed = parseParticipatingInstructorEditDraft(draft)
    if (!parsed.success) {
      setValidationErrors(parsed.errors)
      return false
    }

    setValidationErrors({ form: PROGRAM_API_UNAVAILABLE_SAVE_CONTENT })
    return false
  }, [draft])

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
