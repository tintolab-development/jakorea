import { useCallback, useEffect, useMemo, useState } from 'react'
import { patchGeneralIndividualApplicantDetail } from '@/data/mock/general-individual-applications-mock'
import type {
  GeneralIndividualApplicantDetailSavePayload,
  GeneralIndividualApplicantRow,
} from '@/data/mock/general-individual-applications-mock'
import type { Program } from '@/types/domain'
import { useProgramTextbookCatalog } from '@/features/textbook/hooks/use-program-textbook-catalog'
import { buildIndividualApplicantTextbookOptions } from '@/features/program/general/lib/individual-applicant-textbook'
import {
  draftToIndividualSavePayload,
  parseApplicantIndividualEditDraft,
  rowToIndividualEditDraft,
  type ApplicantIndividualEditDraft,
} from '@/features/program/general/lib/applicant-individual-detail-edit'

/**
 * 신청자 상세 편집 — mock patch 유지.
 * BE에 admin application detail PATCH body 계약이 없어 remote 전환 제외 (Phase 16 gaps).
 */

export interface UseApplicantIndividualDetailEditParams {
  applicant: GeneralIndividualApplicantRow | null
  program?: Program | null
  onSaved: (updatedRow: GeneralIndividualApplicantRow) => void
  saveApplicant?: (
    payload: GeneralIndividualApplicantDetailSavePayload
  ) => Promise<GeneralIndividualApplicantRow | null>
}

export function useApplicantIndividualDetailEdit({
  applicant,
  program = null,
  onSaved,
  saveApplicant,
}: UseApplicantIndividualDetailEditParams) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState<ApplicantIndividualEditDraft | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const { catalog: textbookCatalog } = useProgramTextbookCatalog(program)

  const textbookOptions = useMemo(
    () =>
      buildIndividualApplicantTextbookOptions(
        program,
        applicant?.educationGrade ?? applicant?.detail?.affiliationGrade ?? '',
        textbookCatalog
      ),
    [applicant?.detail?.affiliationGrade, applicant?.educationGrade, program, textbookCatalog]
  )

  const resetEditState = useCallback(() => {
    setIsEditing(false)
    setDraft(null)
    setValidationErrors({})
  }, [])

  useEffect(() => {
    resetEditState()
  }, [applicant?.id, resetEditState])

  const enterEdit = useCallback(() => {
    if (!applicant) return
    setDraft(rowToIndividualEditDraft(applicant, program))
    setValidationErrors({})
    setIsEditing(true)
  }, [applicant, program])

  const cancelEdit = useCallback(() => {
    resetEditState()
  }, [resetEditState])

  const updateDraft = useCallback((partial: Partial<ApplicantIndividualEditDraft>) => {
    setDraft(prev => (prev ? { ...prev, ...partial } : prev))
    setValidationErrors({})
  }, [])

  const saveEdit = useCallback(async (): Promise<boolean> => {
    if (!applicant || !draft) return false

    const parsed = parseApplicantIndividualEditDraft(draft)
    if (!parsed.success) {
      setValidationErrors(parsed.errors)
      return false
    }

    const payload = draftToIndividualSavePayload(draft, program, applicant)
    setIsSaving(true)
    try {
      const updated = saveApplicant
        ? await saveApplicant(payload)
        : patchGeneralIndividualApplicantDetail(applicant.id, payload)
      if (!updated) {
        setValidationErrors({ form: '저장에 실패했습니다.' })
        return false
      }

      onSaved(updated)
      resetEditState()
      return true
    } catch {
      setValidationErrors({ form: '저장에 실패했습니다. 다시 시도해 주세요.' })
      return false
    } finally {
      setIsSaving(false)
    }
  }, [applicant, draft, onSaved, program, resetEditState, saveApplicant])

  return {
    isEditing,
    isSaving,
    draft,
    validationErrors,
    textbookOptions,
    enterEdit,
    cancelEdit,
    saveEdit,
    updateDraft,
  }
}
