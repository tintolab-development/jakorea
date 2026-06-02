import { useCallback, useEffect, useState } from 'react'
import { patchGeneralIndividualApplicantDetail } from '@/data/mock/general-individual-applications-mock'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import {
  draftToIndividualSavePayload,
  parseApplicantIndividualEditDraft,
  rowToIndividualEditDraft,
  type ApplicantIndividualEditDraft,
} from '@/features/program/general/lib/applicant-individual-detail-edit'

export interface UseApplicantIndividualDetailEditParams {
  applicant: GeneralIndividualApplicantRow | null
  onSaved: (updatedRow: GeneralIndividualApplicantRow) => void
}

export function useApplicantIndividualDetailEdit({
  applicant,
  onSaved,
}: UseApplicantIndividualDetailEditParams) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<ApplicantIndividualEditDraft | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const resetEditState = useCallback(() => {
    setIsEditing(false)
    setDraft(null)
    setValidationErrors({})
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- applicant 변경 시 편집 draft 초기화 */
  useEffect(() => {
    resetEditState()
  }, [applicant?.id, resetEditState])
  /* eslint-enable react-hooks/set-state-in-effect */

  const enterEdit = useCallback(() => {
    if (!applicant) return
    setDraft(rowToIndividualEditDraft(applicant))
    setValidationErrors({})
    setIsEditing(true)
  }, [applicant])

  const cancelEdit = useCallback(() => {
    resetEditState()
  }, [resetEditState])

  const updateDraft = useCallback((partial: Partial<ApplicantIndividualEditDraft>) => {
    setDraft(prev => (prev ? { ...prev, ...partial } : prev))
    setValidationErrors({})
  }, [])

  const saveEdit = useCallback((): boolean => {
    if (!applicant || !draft) return false

    const parsed = parseApplicantIndividualEditDraft(draft)
    if (!parsed.success) {
      setValidationErrors(parsed.errors)
      return false
    }

    const updated = patchGeneralIndividualApplicantDetail(
      applicant.id,
      draftToIndividualSavePayload(draft)
    )
    if (!updated) {
      setValidationErrors({ form: '저장에 실패했습니다.' })
      return false
    }

    onSaved(updated)
    resetEditState()
    return true
  }, [applicant, draft, onSaved, resetEditState])

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
