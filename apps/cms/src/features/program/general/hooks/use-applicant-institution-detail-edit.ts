import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { Program } from '@/types/domain'
import {
  isCombinedClassProgramEligible,
  resolveCombinedClassApplyRadioDisabled,
} from '@/features/program/general/lib/combined-class-edit-policy'
import {
  buildCombinedClassLeadTeacherCandidatesFromApplicants,
  type CombinedClassLeadTeacherCandidate,
} from '@/features/program/general/lib/combined-class-lead-teacher'
import {
  draftToSavePayload,
  hasApplicantInstitutionCombinedClassDraftChanges,
  hasApplicantInstitutionNonCombinedClassDraftChanges,
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
import { useProgramTextbookCatalog } from '@/features/textbook/hooks/use-program-textbook-catalog'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import { updateOrganizationApplicationRemote } from '@/features/program/general/api/applications-api-client'
import { mapOrganizationApplicationDetailToApplicantSchoolRow } from '@/features/program/general/api/adapters/general-applications-adapters'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'

/**
 * 기관 신청자 상세 편집 — 합반은 organization-merge-groups remote만 저장.
 * 그 외 필드(주소·교재·교사 등)는 상세 PATCH API 부재 → mock 금지, API 연동 안내.
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
  /** 합반 「신청」 저장 후 담당 교사 지정 모달용 */
  onCombinedClassApplied?: (params: {
    memberRowIds: string[]
    candidates: CombinedClassLeadTeacherCandidate[]
  }) => void
}

export function useApplicantInstitutionDetailEdit({
  institution,
  program,
  institutionList,
  onSaved,
  onSaveCombinedClass,
  combinedClassReadOnly = false,
  onCombinedClassApplied,
}: UseApplicantInstitutionDetailEditParams) {
  const queryClient = useQueryClient()
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

  const isCombinedClassApplyRadioDisabled =
    resolveCombinedClassApplyRadioDisabled(sameSchoolGradeOptions)

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
          value: row.teacherMemberId != null ? String(row.teacherMemberId) : row.id,
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

    const savePayload = draftToSavePayload(normalizedDraft, institution, {
      showEducationFormatField,
    })
    if (!savePayload) {
      setValidationErrors({ form: '저장할 수 없습니다. 입력값을 확인해 주세요.' })
      return false
    }
    const baselineDraft = rowToEditDraft(institution)
    const unsupportedKeys = [
      'adminComment',
      'applicationReason',
      'otherRequests',
      'computerInRoom',
      'waitingRoomAvailable',
      'waitingRoomLocation',
      'mealProvided',
      'mealNotice',
      'parkingInfo',
    ] as const
    if (
      unsupportedKeys.some(
        key => String(normalizedDraft[key] ?? '') !== String(baselineDraft[key] ?? '')
      )
    ) {
      notifyProgramApiUnavailable(
        'general-org-application-detail-unsupported-patch',
        '일반 프로그램 · 기관 신청 안내 정보 수정'
      )
      return false
    }

    setIsSaving(true)
    try {
      const partnersChanged = hasApplicantInstitutionCombinedClassDraftChanges(
        institution,
        normalizedDraft
      )
      const nonMergeChanged = hasApplicantInstitutionNonCombinedClassDraftChanges(
        institution,
        normalizedDraft
      )

      let savedCombinedClass = false
      let remotelyUpdatedInstitution = institution
      if (
        partnersChanged &&
        onSaveCombinedClass &&
        isCombinedClassProgramEligibleFlag &&
        !combinedClassReadOnly
      ) {
        await onSaveCombinedClass({
          combinedClassApplication: normalizedDraft.combinedClassApplication,
          combinedClassPartnerApplicantIds: normalizedDraft.combinedClassPartnerApplicantIds,
        })
        savedCombinedClass = true
      } else if (partnersChanged && !onSaveCombinedClass) {
        notifyProgramApiUnavailable('general-org-merge-groups', '일반 프로그램 · 기관 합반 신청')
        return false
      }

      if (nonMergeChanged) {
        const selectedTeacher = teacherOptions.find(
          option => option.label === normalizedDraft.teacherName
        )
        const teacherMemberId = selectedTeacher ? Number(selectedTeacher.value) : undefined
        const textbookId = Number(normalizedDraft.textbookId)
        const response = await updateOrganizationApplicationRemote(institution.id, {
          requestedGrade: normalizedDraft.educationGrade,
          organizationAddressDetail: normalizedDraft.addressDetail.trim() || undefined,
          requestedClassCount: savePayload.classCount,
          requestedStudentCount: savePayload.studentCount,
          requestedEducationFormat: showEducationFormatField
            ? normalizedDraft.educationFormat.trim() || undefined
            : undefined,
          teacherMemberId:
            teacherMemberId != null && Number.isFinite(teacherMemberId)
              ? teacherMemberId
              : institution.teacherMemberId,
          teacherPhone:
            normalizedDraft.teacherMobile.trim() ||
            normalizedDraft.teacherPhone.trim() ||
            undefined,
          teacherEmail: normalizedDraft.teacherEmail.trim() || undefined,
          textbookId: Number.isFinite(textbookId) ? textbookId : undefined,
        })
        remotelyUpdatedInstitution = mapOrganizationApplicationDetailToApplicantSchoolRow(
          response,
          institution
        )
        queryClient.setQueryData(
          generalApplicationsQueryKeys.organizationDetail(institution.id),
          response
        )
        void queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.organizationList(String(program?.id ?? '')),
        })
      }

      if (!savedCombinedClass && !nonMergeChanged) {
        resetEditState()
        return true
      }

      const updatedRows = institutionList.map(row => {
        if (row.id !== institution.id) {
          if (
            !normalizedDraft.combinedClassPartnerApplicantIds.includes(row.id) ||
            normalizedDraft.combinedClassApplication !== '신청'
          ) {
            return row
          }
          return {
            ...row,
            detail: {
              ...row.detail,
              combinedClassApplication: '신청' as const,
              combinedClassPartnerApplicantIds: [
                institution.id,
                ...normalizedDraft.combinedClassPartnerApplicantIds.filter(id => id !== row.id),
              ],
            },
          }
        }
        return {
          ...remotelyUpdatedInstitution,
          detail: {
            ...remotelyUpdatedInstitution.detail,
            combinedClassApplication: normalizedDraft.combinedClassApplication,
            combinedClassPartnerApplicantIds:
              normalizedDraft.combinedClassApplication === '신청'
                ? normalizedDraft.combinedClassPartnerApplicantIds
                : [],
          },
        }
      })

      onSaved(updatedRows)
      resetEditState()

      if (
        savedCombinedClass &&
        normalizedDraft.combinedClassApplication === '신청' &&
        normalizedDraft.combinedClassPartnerApplicantIds.length > 0 &&
        !combinedClassReadOnly
      ) {
        const partnerRows = updatedRows.filter(row =>
          normalizedDraft.combinedClassPartnerApplicantIds.includes(row.id)
        )
        const leadRow = updatedRows.find(row => row.id === institution.id) ?? institution
        const candidates = buildCombinedClassLeadTeacherCandidatesFromApplicants(
          leadRow,
          partnerRows
        )
        if (candidates.length > 0) {
          onCombinedClassApplied?.({
            memberRowIds: [institution.id, ...normalizedDraft.combinedClassPartnerApplicantIds],
            candidates,
          })
        }
      }

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
    institutionList,
    isCombinedClassProgramEligibleFlag,
    onCombinedClassApplied,
    onSaveCombinedClass,
    onSaved,
    program?.id,
    queryClient,
    resetEditState,
    showEducationFormatField,
    teacherOptions,
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
    isTeacherOptionsLoading:
      canFetchAffiliatedTeachers && isEditing && affiliatedTeachersQuery.isLoading,
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
