import { useCallback, useEffect, useState } from 'react'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import { patchParticipatingInstructorDetail } from '@/data/mock/participating-instructors'
import {
  draftToParticipatingInstructorSavePayload,
  parseParticipatingInstructorEditDraft,
  rowToParticipatingInstructorEditDraft,
  type ParticipatingInstructorEditDraft,
} from '@/features/program/general/lib/participating-instructor-detail-edit'

export interface UseParticipatingInstructorDetailEditParams {
  instructor: ParticipatingInstructorRow
  onSaved: (updatedRow: ParticipatingInstructorRow) => void
}

export function useParticipatingInstructorDetailEdit({
  instructor,
  onSaved,
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

    const updated = patchParticipatingInstructorDetail(
      instructor.id,
      draftToParticipatingInstructorSavePayload(draft)
    )
    if (!updated) {
      setValidationErrors({ form: '저장에 실패했습니다.' })
      return false
    }

    onSaved(updated)
    resetEditState()
    return true
  }, [instructor.id, draft, onSaved, resetEditState])

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
