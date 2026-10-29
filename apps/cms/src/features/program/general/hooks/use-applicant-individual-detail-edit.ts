/**
 * 신청자 상세 편집 — remote ON 시 `updateIndividualApplication`, OFF 시 stub/안내.
 */

import { useCallback, useEffect, useState } from 'react'
import { patchGeneralIndividualApplicantDetail } from '@/features/program/general/model/individual-applicant'
import type {
  GeneralIndividualApplicantDetailSavePayload,
  GeneralIndividualApplicantRow,
} from '@/features/program/general/model/individual-applicant'
import type { Program } from '@/types/domain'
import { useIndividualApplicantTextbookOptions } from '@/features/textbook/hooks/use-individual-applicant-textbook-options'
import {
  draftToIndividualSavePayload,
  parseApplicantIndividualEditDraft,
  rowToIndividualEditDraft,
  type ApplicantIndividualEditDraft,
} from '@/features/program/general/lib/applicant-individual-detail-edit'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { saveIndividualApplicationDetailRemote } from '@/features/program/general/api/individual-application-update-helpers'
import { showUpdateCompletedAlert } from '@/shared/ui'

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

  const applicantEducationGrade =
    applicant?.educationGrade ?? applicant?.detail?.affiliationGrade ?? ''

  const { options: textbookOptions } = useIndividualApplicantTextbookOptions(
    program,
    applicantEducationGrade
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
    // 승인 전 교재 PATCH는 APPLICATION_STATUS_CONFLICT
    if (applicant.approvalStatus !== 'approved') return
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
    if (applicant.approvalStatus !== 'approved') {
      setValidationErrors({ form: '승인 완료 후에만 교재를 변경할 수 있습니다.' })
      return false
    }

    const parsed = parseApplicantIndividualEditDraft(draft)
    if (!parsed.success) {
      setValidationErrors(parsed.errors)
      return false
    }

    const payload = draftToIndividualSavePayload(draft, program, applicant)
    setIsSaving(true)
    try {
      let updated: GeneralIndividualApplicantRow | null = null
      if (saveApplicant) {
        updated = await saveApplicant(payload)
      } else if (shouldUseGeneralApplicationsRemoteApi()) {
        updated = await saveIndividualApplicationDetailRemote(applicant, payload)
      } else {
        updated = patchGeneralIndividualApplicantDetail(applicant.id, payload)
      }
      if (!updated) {
        setValidationErrors({
          form: shouldUseGeneralApplicationsRemoteApi()
            ? '저장에 실패했습니다.'
            : '해당 기능의 API 연동이 되어 있지 않아 저장할 수 없습니다.',
        })
        return false
      }

      onSaved(updated)
      resetEditState()
      showUpdateCompletedAlert()
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
