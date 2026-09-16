import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { Program } from '@/types/domain'
import {
  isCombinedClassProgramEligible,
  resolveCombinedClassApplyRadioDisabled,
} from '@/features/program/general/lib/combined-class-edit-policy'
import {
  parseApplicantInstitutionEditDraft,
  rowToEditDraft,
  type ApplicantInstitutionEditDraft,
} from '@/features/program/general/lib/applicant-institution-detail-edit'
import {
  formatInstitutionApplicationGradeDisplay,
  getInstitutionAffiliatedTeacherOptions,
  mergeInstitutionAffiliatedTeacherOptions,
  shouldShowInstitutionApplicationEducationFormatField,
  type InstitutionAffiliatedTeacherOption,
} from '@/features/program/general/lib/institution-application-detail-edit-policy'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { useAffiliatedTeachersQuery } from '@/features/user/api/hooks/use-member-detail-subresource-queries'
import { isSchoolAffiliatedTeacherRowSelectable } from '@/features/user/detail/lib/school-teacher-employment-status'
import {
  buildApplicantInstitutionTextbookOptions,
  resolveApplicantInstitutionTextbookDisplayLabel,
} from '@/features/program/general/lib/applicant-institution-textbook'
import { getSameSchoolApplicantGrades } from '@/features/program/general/lib/get-same-school-applicant-grades'
import {
  buildInstitutionClassCountOptions,
  resolveProgramParticipantMaxClassCount,
} from '@/features/template/lib/participant-recruitment-institution-limits'
import { PROGRAM_API_UNAVAILABLE_SAVE_CONTENT } from '@/features/program/shared/lib/program-api-unavailable'
import { useProgramTextbookCatalog } from '@/features/textbook/hooks/use-program-textbook-catalog'

/**
 * 기관 신청자 상세 편집.
 * - 합반: organization-merge-groups remote (`onSaveCombinedClass`)
 * - 그 외 신청 body PATCH: OpenAPI 없음(P2-6) → 미연동 안내 (mock 성공 UX 없음)
 */

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
  onSaveCombinedClass?: (params: {
    combinedClassApplication: '신청' | '미신청'
    combinedClassPartnerApplicantIds: string[]
  }) => Promise<void>
  combinedClassReadOnly?: boolean
}

export function useApplicantInstitutionDetailEdit({
  institution,
  program,
  institutionList,
  onSaved,
  onSaveCombinedClass,
  combinedClassReadOnly = false,
}: UseApplicantInstitutionDetailEditParams) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState<ApplicantInstitutionEditDraft | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const applicantEducationGrade = useMemo(() => {
    if (isEditing && draft?.educationGrade) {
      return formatInstitutionApplicationGradeDisplay(draft.educationGrade)
    }
    return institution?.educationGrade?.trim()
      ? formatInstitutionApplicationGradeDisplay(institution.educationGrade)
      : undefined
  }, [draft?.educationGrade, institution?.educationGrade, isEditing])

  const { catalog: textbookCatalog, isLoading: isTextbookCatalogLoading } =
    useProgramTextbookCatalog(program, applicantEducationGrade)

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

  const canFetchAffiliatedTeachers = Boolean(
    isMembersRemoteEnabled() && institution?.organizationId != null
  )

  const affiliatedTeachersQuery = useAffiliatedTeachersQuery(
    institution?.teacherMemberId,
    canFetchAffiliatedTeachers && isEditing,
    institution?.organizationId
  )

  const teacherOptions = useMemo((): InstitutionAffiliatedTeacherOption[] => {
    if (!institution) return []
    const currentName = isEditing ? draft?.teacherName : institution.teacherName

    if (canFetchAffiliatedTeachers && isEditing && affiliatedTeachersQuery.data) {
      const apiOptions = affiliatedTeachersQuery.data
        .filter(row => isSchoolAffiliatedTeacherRowSelectable(row.employmentStatus))
        .map(row => ({
          value:
            row.teacherMemberId != null ? String(row.teacherMemberId) : row.id,
          label: row.name === '-' ? '' : row.name,
          mobile: row.phone === '-' ? '' : row.phone,
          email: row.email === '-' ? '' : row.email,
        }))
        .filter(option => option.label.trim())

      return mergeInstitutionAffiliatedTeacherOptions(apiOptions, currentName)
    }

    return getInstitutionAffiliatedTeacherOptions(institution.schoolName, currentName)
  }, [
    affiliatedTeachersQuery.data,
    canFetchAffiliatedTeachers,
    draft?.teacherName,
    institution,
    isEditing,
  ])

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
    if (!program || !applicantEducationGrade) return []
    return buildApplicantInstitutionTextbookOptions(
      program,
      applicantEducationGrade,
      textbookCatalog
    )
  }, [applicantEducationGrade, program, textbookCatalog])

  const textbookDisplayLabel = useMemo(() => {
    if (!institution) return undefined
    return resolveApplicantInstitutionTextbookDisplayLabel({
      program,
      institution,
      catalog: textbookCatalog,
    })
  }, [institution, program, textbookCatalog])

  const saveEdit = useCallback(async (): Promise<boolean> => {
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

    const canSaveCombined =
      Boolean(onSaveCombinedClass) &&
      isCombinedClassProgramEligibleFlag &&
      !combinedClassReadOnly

    const initialDraft = rowToEditDraft(institution)
    const combinedClassChanged =
      normalizedDraft.combinedClassApplication !== initialDraft.combinedClassApplication ||
      normalizedDraft.combinedClassPartnerApplicantIds.join('|') !==
        initialDraft.combinedClassPartnerApplicantIds.join('|')
    const otherFieldsChanged =
      normalizedDraft.educationGrade !== initialDraft.educationGrade ||
      normalizedDraft.classCount !== initialDraft.classCount ||
      normalizedDraft.studentCount !== initialDraft.studentCount ||
      normalizedDraft.teacherName !== initialDraft.teacherName ||
      normalizedDraft.textbookId !== initialDraft.textbookId ||
      normalizedDraft.educationFormat !== initialDraft.educationFormat ||
      normalizedDraft.addressDetail !== initialDraft.addressDetail

    // Body PATCH는 BE gap — 교재·담당교사 등 mock 성공 금지. 합반만 remote.
    if (otherFieldsChanged) {
      setValidationErrors({ form: PROGRAM_API_UNAVAILABLE_SAVE_CONTENT })
      return false
    }

    if (!combinedClassChanged) {
      resetEditState()
      return true
    }

    if (!canSaveCombined || !onSaveCombinedClass) {
      setValidationErrors({ form: PROGRAM_API_UNAVAILABLE_SAVE_CONTENT })
      return false
    }

    setIsSaving(true)
    try {
      await onSaveCombinedClass({
        combinedClassApplication: normalizedDraft.combinedClassApplication,
        combinedClassPartnerApplicantIds: normalizedDraft.combinedClassPartnerApplicantIds,
      })
      onSaved([institution])
      resetEditState()
      return true
    } catch {
      setValidationErrors({ form: '저장에 실패했습니다. 다시 시도해 주세요.' })
      return false
    } finally {
      setIsSaving(false)
    }
  }, [
    combinedClassReadOnly,
    draft,
    institution,
    isCombinedClassProgramEligibleFlag,
    onSaveCombinedClass,
    onSaved,
    resetEditState,
    showEducationFormatField,
  ])

  return {
    isEditing,
    isSaving,
    combinedClassReadOnly,
    draft,
    validationErrors,
    textbookOptions,
    textbookDisplayLabel,
    isTextbookCatalogLoading,
    sameSchoolGradeOptions,
    classCountOptions,
    teacherOptions,
    isTeacherOptionsLoading: canFetchAffiliatedTeachers && isEditing && affiliatedTeachersQuery.isLoading,
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
