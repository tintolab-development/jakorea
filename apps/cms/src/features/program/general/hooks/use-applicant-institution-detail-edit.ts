import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import { patchApplicantInstitutionDetailWithCombinedClass } from '@/data/mock/applicant-institutions'
import type { Program } from '@/types/domain'
import {
  isCombinedClassProgramEligible,
  resolveCombinedClassApplyRadioDisabled,
} from '@/features/program/general/lib/combined-class-edit-policy'
import {
  draftToSavePayload,
  parseApplicantInstitutionEditDraft,
  rowToEditDraft,
  type ApplicantInstitutionEditDraft,
} from '@/features/program/general/lib/applicant-institution-detail-edit'
import {
  formatInstitutionApplicationGradeDisplay,
  getInstitutionAffiliatedTeacherOptions,
  shouldShowInstitutionApplicationEducationFormatField,
  type InstitutionAffiliatedTeacherOption,
} from '@/features/program/general/lib/institution-application-detail-edit-policy'
import {
  filterTextbooksForApplicant,
  resolveTextbookOptionLabel,
} from '@/features/program/general/lib/filter-textbooks-for-applicant'
import { getSameSchoolApplicantGrades } from '@/features/program/general/lib/get-same-school-applicant-grades'
import {
  buildInstitutionClassCountOptions,
  resolveProgramParticipantMaxClassCount,
} from '@/features/template/lib/participant-recruitment-institution-limits'
import { useProgramTextbookCatalog } from '@/features/textbook/hooks/use-program-textbook-catalog'

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

  const { catalog: textbookCatalog } = useProgramTextbookCatalog(program)

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

  const isCombinedClassProgramEligibleFlag = useMemo(
    () => isCombinedClassProgramEligible(program),
    [program]
  )

  const sameSchoolGradeOptions = useMemo((): SameSchoolGradeOption[] => {
    if (!institution || !program?.id || !isCombinedClassProgramEligibleFlag) return []
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
  }, [institution, institutionList, isCombinedClassProgramEligibleFlag, program?.id])

  const isCombinedClassApplyRadioDisabled = resolveCombinedClassApplyRadioDisabled(
    sameSchoolGradeOptions
  )

  const showEducationFormatField = useMemo(
    () => shouldShowInstitutionApplicationEducationFormatField(program),
    [program]
  )

  const classCountOptions = useMemo(
    () => buildInstitutionClassCountOptions(resolveProgramParticipantMaxClassCount(program)),
    [program]
  )

  const teacherOptions = useMemo((): InstitutionAffiliatedTeacherOption[] => {
    if (!institution) return []
    const currentName = isEditing ? draft?.teacherName : institution.teacherName
    return getInstitutionAffiliatedTeacherOptions(institution.schoolName, currentName)
  }, [draft?.teacherName, institution, isEditing])

  /** @deprecated sameSchoolGradeOptions.length >= 1 && isCombinedClassProgramEligibleFlag */
  const canApplyCombinedClass =
    isCombinedClassProgramEligibleFlag && !isCombinedClassApplyRadioDisabled

  const enterEdit = useCallback(() => {
    if (!institution) return
    let nextDraft = rowToEditDraft(institution)
    if (!isCombinedClassProgramEligibleFlag) {
      nextDraft = {
        ...nextDraft,
        combinedClassApplication: '미신청',
        combinedClassPartnerApplicantIds: [],
      }
    }
    setDraft(nextDraft)
    setValidationErrors({})
    setIsEditing(true)
  }, [institution, isCombinedClassProgramEligibleFlag])

  const cancelEdit = useCallback(() => {
    resetEditState()
  }, [resetEditState])

  const updateDraft = useCallback((partial: Partial<ApplicantInstitutionEditDraft>) => {
    setDraft(prev => (prev ? { ...prev, ...partial } : prev))
    setValidationErrors({})
  }, [])

  const textbookOptions = useMemo((): TextbookSelectOption[] => {
    if (!program) return []
    const gradeSource =
      isEditing && draft?.educationGrade
        ? formatInstitutionApplicationGradeDisplay(draft.educationGrade)
        : institution?.educationGrade
    if (!gradeSource) return []
    return filterTextbooksForApplicant(program, gradeSource, textbookCatalog).map(row => ({
      value: row.id,
      label: resolveTextbookOptionLabel(row),
      textbookName: row.textbookName,
    }))
  }, [draft?.educationGrade, institution?.educationGrade, isEditing, program, textbookCatalog])

  const saveEdit = useCallback((): boolean => {
    if (!institution || !draft) return false

    const normalizedDraft: ApplicantInstitutionEditDraft = {
      ...draft,
      combinedClassApplication: isCombinedClassProgramEligibleFlag
        ? draft.combinedClassApplication
        : '미신청',
      combinedClassPartnerApplicantIds:
        isCombinedClassProgramEligibleFlag && draft.combinedClassApplication === '신청'
          ? draft.combinedClassPartnerApplicantIds
          : [],
    }

    const parsed = parseApplicantInstitutionEditDraft(normalizedDraft, {
      showEducationFormatField,
    })
    if (!parsed.success) {
      setValidationErrors(parsed.errors)
      return false
    }

    const payload = draftToSavePayload(normalizedDraft, institution, {
      showEducationFormatField,
    })
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
  }, [draft, institution, isCombinedClassProgramEligibleFlag, onSaved, resetEditState, showEducationFormatField])

  return {
    isEditing,
    draft,
    validationErrors,
    textbookOptions,
    sameSchoolGradeOptions,
    classCountOptions,
    teacherOptions,
    showEducationFormatField,
    canApplyCombinedClass,
    isCombinedClassProgramEligible: isCombinedClassProgramEligibleFlag,
    isCombinedClassApplyRadioDisabled,
    isCombinedClassApplyDisabled: !canApplyCombinedClass,
    enterEdit,
    cancelEdit,
    saveEdit,
    updateDraft,
  }
}
