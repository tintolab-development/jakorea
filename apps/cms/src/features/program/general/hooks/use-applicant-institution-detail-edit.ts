import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import { patchApplicantInstitutionDetailWithCombinedClass } from '@/data/mock/applicant-institutions'
import type { Program } from '@/types/domain'
import {
  draftToSavePayload,
  parseApplicantInstitutionEditDraft,
  rowToEditDraft,
  type ApplicantInstitutionEditDraft,
} from '@/features/program/general/lib/applicant-institution-detail-edit'
import {
  filterTextbooksForApplicant,
  resolveTextbookOptionLabel,
} from '@/features/program/general/lib/filter-textbooks-for-applicant'
import { getSameSchoolApplicantGrades } from '@/features/program/general/lib/get-same-school-applicant-grades'

export interface TextbookSelectOption {
  value: string
  label: string
  textbookName: string
}

export interface SameSchoolGradeOption {
  value: string
  label: string
  educationGrade: string
}

export interface UseApplicantInstitutionDetailEditParams {
  institution: ApplicantSchoolRow | null
  program: Program | null | undefined
  institutionList: ApplicantSchoolRow[]
  onSaved: (updatedRows: ApplicantSchoolRow[]) => void
}

export function useApplicantInstitutionDetailEdit({
  institution,
  program,
  institutionList,
  onSaved,
}: UseApplicantInstitutionDetailEditParams) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<ApplicantInstitutionEditDraft | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const resetEditState = useCallback(() => {
    setIsEditing(false)
    setDraft(null)
    setValidationErrors({})
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- institution 변경 시 편집 draft 초기화 */
  useEffect(() => {
    resetEditState()
  }, [institution?.id, resetEditState])
  /* eslint-enable react-hooks/set-state-in-effect */

  const enterEdit = useCallback(() => {
    if (!institution) return
    setDraft(rowToEditDraft(institution))
    setValidationErrors({})
    setIsEditing(true)
  }, [institution])

  const cancelEdit = useCallback(() => {
    resetEditState()
  }, [resetEditState])

  const updateDraft = useCallback((partial: Partial<ApplicantInstitutionEditDraft>) => {
    setDraft(prev => (prev ? { ...prev, ...partial } : prev))
    setValidationErrors({})
  }, [])

  const sameSchoolGradeOptions = useMemo((): SameSchoolGradeOption[] => {
    if (!institution || !program?.id) return []
    return getSameSchoolApplicantGrades(
      institutionList,
      program.id,
      institution.schoolName,
      institution.id
    ).map(row => ({
      value: row.id,
      label: row.educationGrade,
      educationGrade: row.educationGrade,
    }))
  }, [institution, institutionList, program])

  const canApplyCombinedClass = sameSchoolGradeOptions.length >= 1

  const textbookOptions = useMemo((): TextbookSelectOption[] => {
    if (!program || !institution?.educationGrade) return []
    return filterTextbooksForApplicant(program, institution.educationGrade).map(row => ({
      value: row.id,
      label: resolveTextbookOptionLabel(row),
      textbookName: row.textbookName,
    }))
  }, [institution?.educationGrade, program])

  const saveEdit = useCallback((): boolean => {
    if (!institution || !draft) return false

    const normalizedDraft: ApplicantInstitutionEditDraft = {
      ...draft,
      combinedClassApplication:
        canApplyCombinedClass ? draft.combinedClassApplication : '미신청',
      combinedClassPartnerApplicantIds:
        canApplyCombinedClass && draft.combinedClassApplication === '신청'
          ? draft.combinedClassPartnerApplicantIds
          : [],
    }

    const parsed = parseApplicantInstitutionEditDraft(normalizedDraft)
    if (!parsed.success) {
      setValidationErrors(parsed.errors)
      return false
    }

    const payload = draftToSavePayload(normalizedDraft, institution)
    if (!payload) {
      setValidationErrors({ form: '저장할 수 없습니다. 입력값을 확인해 주세요.' })
      return false
    }

    const updatedRows = patchApplicantInstitutionDetailWithCombinedClass(institution.id, payload)
    if (updatedRows.length === 0) {
      setValidationErrors({ form: '저장에 실패했습니다.' })
      return false
    }

    onSaved(updatedRows)
    resetEditState()
    return true
  }, [canApplyCombinedClass, draft, institution, onSaved, resetEditState])

  return {
    isEditing,
    draft,
    validationErrors,
    textbookOptions,
    sameSchoolGradeOptions,
    canApplyCombinedClass,
    isCombinedClassApplyDisabled: !canApplyCombinedClass,
    enterEdit,
    cancelEdit,
    saveEdit,
    updateDraft,
  }
}
