import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { Program } from '@/types/domain'
import {
  isCombinedClassProgramEligible,
  resolveCombinedClassApplyRadioDisabled,
} from '@/features/program/general/lib/combined-class-edit-policy'
import {
  COMBINED_CLASS_GRADE_REQUIRED_SAVE_RESULT,
  type InstitutionInfoSaveResult,
} from '@/features/program/general/lib/combined-class-copy'
import {
  draftToSavePayload,
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
import { TEXTBOOK_NOT_USED_OPTION_VALUE } from '@/features/program/general/lib/individual-applicant-textbook'
import { showUpdateCompletedAlert } from '@/shared/ui'
import { getSameSchoolApplicantGrades } from '@/features/program/general/lib/get-same-school-applicant-grades'
import { resolveOrganizationMergeErrorMessage } from '@/features/program/general/lib/organization-merge-error-message'
import {
  buildInstitutionClassCountOptions,
  resolveProgramParticipantMaxClassCount,
} from '@/features/template/lib/participant-recruitment-institution-limits'
import { useIndividualApplicantTextbookOptions } from '@/features/textbook/hooks/use-individual-applicant-textbook-options'
import {
  fetchOrganizationApplicationDetailRemote,
  unmaskOrganizationApplicationPrivacyRemote,
  updateOrganizationApplicationRemote,
} from '@/features/program/general/api/applications-api-client'
import { buildOrganizationApplicationTeacherContactPatch } from '@/features/program/general/lib/organization-application-teacher-contact-patch'
import {
  mapOrganizationApplicationDetailToApplicantSchoolRow,
  toRequestedEducationFormatApiValue,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import {
  generalApplicationsQueryKeys,
  generalProgramProgressQueryKeys,
  organizationApplicationDetailCacheKeys,
} from '@/features/program/general/api/general-applications-query-keys'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import { trainedTeacherQueryKeys } from '@/features/program/trained-teachers/api/query-keys'

/**
 * 기관 신청자 상세 편집 — 합반은 organization-merge-groups, 그 외는 PATCH organization-applications.
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
  combinedClassReadOnly?: boolean
}

export function useApplicantInstitutionDetailEdit({
  institution,
  program,
  institutionList,
  onSaved,
  combinedClassReadOnly = false,
}: UseApplicantInstitutionDetailEditParams) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState<ApplicantInstitutionEditDraft | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const editBaselineRef = useRef<ApplicantInstitutionEditDraft | null>(null)

  const applicantEducationGrade = useMemo(() => {
    if (isEditing && draft?.educationGrade) {
      return formatInstitutionApplicationGradeDisplay(draft.educationGrade)
    }
    return institution?.educationGrade?.trim()
      ? formatInstitutionApplicationGradeDisplay(institution.educationGrade)
      : undefined
  }, [draft?.educationGrade, institution?.educationGrade, isEditing])

  const { catalog: textbookCatalog, isLoading: isTextbookCatalogLoading } =
    useIndividualApplicantTextbookOptions(program, applicantEducationGrade)

  const resetEditState = useCallback(() => {
    setIsEditing(false)
    setDraft(null)
    setValidationErrors({})
    editBaselineRef.current = null
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
      institution.id,
      institution.educationGrade
    ).map(row => ({
      value: row.id,
      label: row.educationGrade,
      educationGrade: row.educationGrade,
    }))
  }, [
    institution,
    institutionList,
    isCombinedClassProgramEligibleFlag,
    program?.id,
  ])

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

  const enterEdit = useCallback((institutionOverride?: ApplicantSchoolRow) => {
    const source = institutionOverride ?? institution
    if (!source) return
    let nextDraft = rowToEditDraft(source)
    if (!isCombinedClassProgramEligibleFlag) {
      nextDraft = {
        ...nextDraft,
        combinedClassApplication: '미신청',
        combinedClassPartnerApplicantIds: [],
      }
    }
    setDraft(nextDraft)
    editBaselineRef.current = nextDraft
    setValidationErrors({})
    setIsEditing(true)
  }, [institution, isCombinedClassProgramEligibleFlag])

  const cancelEdit = useCallback(() => {
    resetEditState()
  }, [resetEditState])

  const updateDraft = useCallback((partial: Partial<ApplicantInstitutionEditDraft>) => {
    setDraft(prev => {
      if (!prev) return prev
      const next = { ...prev, ...partial }
      if (
        partial.educationGrade != null &&
        formatInstitutionApplicationGradeDisplay(partial.educationGrade) !==
          formatInstitutionApplicationGradeDisplay(prev.educationGrade)
      ) {
        return {
          ...next,
          textbookId: TEXTBOOK_NOT_USED_OPTION_VALUE,
          textbookName: '해당 없음',
        }
      }
      return next
    })
    setValidationErrors({})
  }, [])

  const textbookOptions = useMemo((): TextbookSelectOption[] => {
    return buildApplicantInstitutionTextbookOptions(
      program,
      applicantEducationGrade ?? '',
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

  const saveEdit = useCallback(async (): Promise<InstitutionInfoSaveResult> => {
    if (!institution || !draft) return false

    if (
      isCombinedClassProgramEligibleFlag &&
      !combinedClassReadOnly &&
      draft.combinedClassApplication === '신청' &&
      draft.combinedClassPartnerApplicantIds.length === 0
    ) {
      return COMBINED_CLASS_GRADE_REQUIRED_SAVE_RESULT
    }

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
    const baselineDraft = editBaselineRef.current ?? rowToEditDraft(institution)

    setIsSaving(true)
    try {
      const nonMergeChanged = hasApplicantInstitutionNonCombinedClassDraftChanges(
        institution,
        normalizedDraft
      )

      if (!nonMergeChanged) {
        resetEditState()
        showUpdateCompletedAlert()
        return true
      }

      {
        const selectedTeacher = teacherOptions.find(
          option => option.label === normalizedDraft.teacherName
        )
        const teacherMemberId = selectedTeacher ? Number(selectedTeacher.value) : undefined
        const textbookIdRaw = normalizedDraft.textbookId.trim()
        const textbookIdNumber = Number(textbookIdRaw)
        const textbookIsNotUsed =
          textbookIdRaw === TEXTBOOK_NOT_USED_OPTION_VALUE ||
          normalizedDraft.textbookName.trim() === '해당 없음' ||
          textbookIdRaw === ''
        const textbookChanged =
          normalizedDraft.textbookId !== baselineDraft.textbookId ||
          normalizedDraft.textbookName !== baselineDraft.textbookName
        const textbookPatch = textbookChanged
          ? {
              textbookId: textbookIsNotUsed
                ? undefined
                : Number.isFinite(textbookIdNumber)
                  ? textbookIdNumber
                  : undefined,
            }
          : {}
        const nextEducationFormat = showEducationFormatField
          ? toRequestedEducationFormatApiValue(normalizedDraft.educationFormat)
          : undefined
        const baselineEducationFormat = toRequestedEducationFormatApiValue(
          baselineDraft.educationFormat
        )
        await updateOrganizationApplicationRemote(institution.id, {
          requestedGrade: normalizedDraft.educationGrade,
          organizationAddressDetail: normalizedDraft.addressDetail.trim() || undefined,
          requestedClassCount: savePayload.classCount,
          requestedStudentCount: savePayload.studentCount,
          requestedEducationFormat:
            nextEducationFormat && nextEducationFormat !== baselineEducationFormat
              ? nextEducationFormat
              : undefined,
          teacherMemberId:
            teacherMemberId != null && Number.isFinite(teacherMemberId)
              ? teacherMemberId
              : institution.teacherMemberId,
          ...buildOrganizationApplicationTeacherContactPatch(normalizedDraft, baselineDraft),
          ...textbookPatch,
          applicationReason: normalizedDraft.applicationReason.trim() || undefined,
          otherRequests: normalizedDraft.otherRequests.trim() || undefined,
          computerInRoom: normalizedDraft.computerInRoom.trim() || undefined,
          waitingRoomAvailable: normalizedDraft.waitingRoomAvailable,
          waitingRoomLocation: normalizedDraft.waitingRoomAvailable
            ? normalizedDraft.waitingRoomLocation.trim() || undefined
            : undefined,
          mealProvided: normalizedDraft.mealProvided,
          mealNotice: normalizedDraft.mealProvided
            ? normalizedDraft.mealNotice.trim() || undefined
            : undefined,
          parkingInfo: normalizedDraft.parkingInfo.trim() || undefined,
        })
        // PATCH 응답은 마스킹되므로 전화 입력칸을 응답값으로 덮지 않고 GET + 원문 unmask를 쓴다.
        const response = await fetchOrganizationApplicationDetailRemote(institution.id)
        const programIdNumber = program?.id != null ? Number(program.id) : NaN
        let unmaskedContact: {
          teacherTel?: string | null
          teacherPhone?: string | null
          teacherEmail?: string | null
        } | null = null
        try {
          unmaskedContact = await unmaskOrganizationApplicationPrivacyRemote(
            institution.id,
            '신청 정보 수정',
            Number.isFinite(programIdNumber) ? programIdNumber : undefined
          )
        } catch {
          unmaskedContact = null
        }
        const remotelyUpdatedInstitution = mapOrganizationApplicationDetailToApplicantSchoolRow(
          unmaskedContact
            ? {
                ...response,
                teacherTel: unmaskedContact.teacherTel ?? undefined,
                teacherPhone: unmaskedContact.teacherPhone ?? undefined,
                teacherEmail: unmaskedContact.teacherEmail ?? undefined,
              }
            : response,
          institution
        )
        for (const queryKey of organizationApplicationDetailCacheKeys(
          institution.id,
          String(program?.id ?? '')
        )) {
          queryClient.setQueryData(queryKey, response)
          void queryClient.invalidateQueries({ queryKey })
        }
        void queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.organizationList(String(program?.id ?? '')),
        })
        if (program?.id != null) {
          void queryClient.invalidateQueries({
            queryKey: generalProgramProgressQueryKeys.institutions(String(program.id)),
          })
          if (isTrainedTeachersDetailProgram(program)) {
            void queryClient.invalidateQueries({
              queryKey: trainedTeacherQueryKeys.organizationApplicationsRoot(),
            })
            void queryClient.invalidateQueries({
              queryKey: trainedTeacherQueryKeys.organizationApplication(
                String(program.id),
                institution.id
              ),
            })
          }
        }

        onSaved(
          institutionList.map(row => {
            if (row.id !== institution.id) return row
            return {
              ...remotelyUpdatedInstitution,
              detail: {
                ...remotelyUpdatedInstitution.detail,
                combinedClassApplication: row.detail?.combinedClassApplication,
                combinedClassPartnerApplicantIds: row.detail?.combinedClassPartnerApplicantIds ?? [],
                combinedClassPartnerGrades: row.detail?.combinedClassPartnerGrades ?? [],
              },
            }
          })
        )
      }

      resetEditState()
      showUpdateCompletedAlert()
      return true
    } catch (error) {
      const responseData = axios.isAxiosError(error) ? error.response?.data : undefined
      const httpStatus = axios.isAxiosError(error) ? error.response?.status : undefined
      const message = axios.isAxiosError(error)
        ? resolveOrganizationMergeErrorMessage(responseData, {
            httpStatus,
            fallback: '저장에 실패했습니다. 다시 시도해 주세요.',
          })
        : error instanceof Error && error.message.trim()
          ? error.message
          : '저장에 실패했습니다. 다시 시도해 주세요.'
      setValidationErrors({ form: message })
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
