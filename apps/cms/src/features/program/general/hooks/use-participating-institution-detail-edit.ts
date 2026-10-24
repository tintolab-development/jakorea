import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'
import type { SchoolDetailForModal } from '@/features/program/general/model/school-detail-types'
import {
  isCombinedClassProgramEligible,
  resolveCombinedClassApplyRadioDisabled,
} from '@/features/program/general/lib/combined-class-edit-policy'
import { COMBINED_CLASS_GRADE_REQUIRED_SAVE_RESULT, type InstitutionInfoSaveResult } from '@/features/program/general/lib/combined-class-copy'
import {
  detailToParticipatingInstitutionEditDraft,
  parseParticipatingInstitutionEditDraft,
  participatingInstitutionEditDraftToDetailPatch,
  requiresParticipatingTextbookSelection,
  resolveTextbookIdFromName,
  toCombinedClassApplicationStatus,
} from '@/features/program/general/lib/participating-institution-detail-edit'
import {
  filterTextbooksForCombinedClassEdit,
  buildCombinedClassTextbookSelectOptions,
  buildParticipatingInstitutionTextbookSelectOptions,
  ensureTextbookNotUsedSelectOption,
  programOffersParticipatingTextbookSelect,
  programUsesTextbook,
  resolveParticipatingInstitutionTextbookDisplay,
  resolveTextbookFieldsFromSelection,
} from '@/features/program/general/lib/participating-institution-textbook'
import { TEXTBOOK_NOT_USED_OPTION_VALUE } from '@/features/program/general/lib/individual-applicant-textbook'
import type { TextbookSelectOption } from '@/features/program/general/hooks/use-applicant-institution-detail-edit'
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
import { useProgramTextbookCatalog } from '@/features/textbook/hooks/use-program-textbook-catalog'
import { useIndividualApplicantTextbookOptions } from '@/features/textbook/hooks/use-individual-applicant-textbook-options'
import { getSameSchoolParticipatingGrades } from '@/features/program/general/lib/get-same-school-participating-grades'
import { useCmsAlert } from '@/shared/ui'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import {
  fetchOrganizationApplicationDetailRemote,
  updateOrganizationApplicationRemote,
} from '@/features/program/general/api/applications-api-client'
import {
  shouldUseApplicationsHttpRemoteApi,
  shouldUseGeneralApplicationsRemoteApi,
} from '@/features/program/general/api/applications-remote-capabilities'
import { shouldUseCompanySchoolApplicationsRemoteApi } from '@/features/program/1c-1s/api/capabilities'
import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import {
  generalApplicationsQueryKeys,
  generalProgramProgressQueryKeys,
  organizationApplicationDetailCacheKeys,
} from '@/features/program/general/api/general-applications-query-keys'
import { trainedTeacherQueryKeys } from '@/features/program/trained-teachers/api/query-keys'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import {
  buildParticipatingInstitutionLocalSavePatch,
  buildParticipatingInstitutionOrganizationUpdateRequest,
  resolveParticipatingInstitutionApplicationId,
} from '@/features/program/general/lib/participating-institution-organization-update'
import { resolveOrganizationMergeErrorMessage } from '@/features/program/general/lib/organization-merge-error-message'
import axios from 'axios'

function shouldUseParticipatingInstitutionApplicationPatchRemote(): boolean {
  if (shouldUseGeneralApplicationsRemoteApi()) return true
  if (shouldUseCompanySchoolApplicationsRemoteApi()) return true
  if (shouldUseApplicationsHttpRemoteApi()) return true
  return (
    shouldUseTrainedTeacherProgramsRemoteApi() &&
    isRealApiModuleEnabled('applications') &&
    hasRemoteAdminJwt()
  )
}

export interface SameSchoolParticipatingGradeOption {
  value: string
  label: string
  educationGrade: string
}

export interface UseParticipatingInstitutionDetailEditParams {
  detail: SchoolDetailForModal
  row: ParticipatingSchoolRow
  program: Program
  participatingSchoolList: ParticipatingSchoolRow[]
  onSaveBasicInfo?: (patch: Partial<SchoolDetailForModal> & { id: string }) => void
  /** 합반 멤버(비 lead) 행이면 true — 합반 필드 read-only */
  combinedClassReadOnly?: boolean
}

export function useParticipatingInstitutionDetailEdit({
  detail,
  row,
  program,
  participatingSchoolList,
  onSaveBasicInfo,
  combinedClassReadOnly = false,
}: UseParticipatingInstitutionDetailEditParams) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState<ReturnType<
    typeof detailToParticipatingInstitutionEditDraft
  > | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const { showAlert } = useCmsAlert()

  const isCompanySchool = useMemo(() => isCompanySchoolProgram(program), [program])
  const applicantEducationGrade = useMemo(() => {
    const raw =
      isEditing && draft?.educationGrade
        ? draft.educationGrade
        : (row.educationGrade ?? detail.educationGrade)
    return formatInstitutionApplicationGradeDisplay(raw ?? '')
  }, [detail.educationGrade, draft?.educationGrade, isEditing, row.educationGrade])

  const { catalog: gradeTextbookCatalog, isLoading: isGradeTextbookCatalogLoading } =
    useIndividualApplicantTextbookOptions(program, applicantEducationGrade || undefined)
  const { catalog: textbookCatalog, isLoading: isTextbookCatalogLoading } =
    useProgramTextbookCatalog(program, undefined, { businessAreaOnly: true })
  /** 일정형이 아니면 매칭 교재가 없어도 수정 셀렉트를 연다 */
  const programAllowsTextbookSelect = useMemo(
    () => programOffersParticipatingTextbookSelect(program, { isCompanySchool }),
    [isCompanySchool, program]
  )

  /** 카탈로그 로딩 중에는 필드를 숨기지 않음(새로고침 플래시 방지) */
  const usesTextbook = useMemo(
    () =>
      isCompanySchool ||
      isTextbookCatalogLoading ||
      isGradeTextbookCatalogLoading ||
      programUsesTextbook(program, textbookCatalog),
    [
      isCompanySchool,
      isGradeTextbookCatalogLoading,
      isTextbookCatalogLoading,
      program,
      textbookCatalog,
    ]
  )

  const isCombinedClassProgramEligibleFlag = useMemo(
    () => isCombinedClassProgramEligible(program),
    [program]
  )

  const canFetchAffiliatedTeachers = Boolean(isMembersRemoteEnabled() && row.organizationId != null)

  const affiliatedTeachersQuery = useAffiliatedTeachersQuery(
    row.teacherMemberId,
    canFetchAffiliatedTeachers && isEditing,
    row.organizationId
  )

  const teacherOptions = useMemo((): InstitutionAffiliatedTeacherOption[] => {
    const currentName = isEditing ? draft?.teacherName : detail.teacherName

    if (canFetchAffiliatedTeachers && isEditing && affiliatedTeachersQuery.data) {
      const apiOptions = affiliatedTeachersQuery.data
        .filter(rowItem => isSchoolAffiliatedTeacherRowSelectable(rowItem.employmentStatus))
        .map(rowItem => ({
          value: rowItem.teacherMemberId != null ? String(rowItem.teacherMemberId) : rowItem.id,
          label: rowItem.name === '-' ? '' : rowItem.name,
          mobile: rowItem.phone === '-' ? '' : rowItem.phone,
          email: rowItem.email === '-' ? '' : rowItem.email,
        }))
        .filter(option => option.label.trim())

      return mergeInstitutionAffiliatedTeacherOptions(apiOptions, currentName)
    }

    return getInstitutionAffiliatedTeacherOptions(row.schoolName, currentName)
  }, [
    affiliatedTeachersQuery.data,
    canFetchAffiliatedTeachers,
    detail.teacherName,
    draft?.teacherName,
    isEditing,
    row.schoolName,
  ])

  const resolvedTextbookCatalog = textbookCatalog

  const textbookDisplay = useMemo(
    () =>
      resolveParticipatingInstitutionTextbookDisplay({
        textbookId: detail.textbookId,
        textbookName: detail.textbookName,
        textbookGrade: detail.textbookGrade,
        textbookKits: detail.textbookKits,
        textbookQuantity: detail.textbookQuantity,
        catalog: resolvedTextbookCatalog,
      }),
    [
      detail.textbookGrade,
      detail.textbookId,
      detail.textbookKits,
      detail.textbookName,
      detail.textbookQuantity,
      resolvedTextbookCatalog,
    ]
  )

  const textbookOptions = useMemo((): TextbookSelectOption[] => {
    if (!usesTextbook && !programAllowsTextbookSelect) return []

    const isCombinedSelect =
      !isCompanySchool &&
      (draft?.combinedClassApplication === '신청' ||
        toCombinedClassApplicationStatus(detail.combinedClassApplication) === '신청')

    const options = isCombinedSelect
      ? buildCombinedClassTextbookSelectOptions(program, textbookCatalog)
      : buildParticipatingInstitutionTextbookSelectOptions({
          program,
          educationGrade: applicantEducationGrade,
          catalog: gradeTextbookCatalog,
        })

    return ensureTextbookNotUsedSelectOption(options)
  }, [
    applicantEducationGrade,
    detail.combinedClassApplication,
    draft?.combinedClassApplication,
    gradeTextbookCatalog,
    isCompanySchool,
    program,
    programAllowsTextbookSelect,
    textbookCatalog,
    usesTextbook,
  ])

  /** 승인 완료 시 교재 수정. 조건에 맞는 교재가 없어도 「해당 없음」 셀렉트를 연다 */
  const canEditTextbook =
    row.approvalStatus === 'approved' && (usesTextbook || programAllowsTextbookSelect)

  const sameSchoolGradeOptions = useMemo((): SameSchoolParticipatingGradeOption[] => {
    if (!isCombinedClassProgramEligibleFlag) return []
    return getSameSchoolParticipatingGrades(
      participatingSchoolList,
      row.schoolName,
      row.id,
      row.educationGrade
    ).map(
      participatingRow => ({
        value: participatingRow.id,
        label: participatingRow.educationGrade,
        educationGrade: participatingRow.educationGrade,
      })
    )
  }, [
    isCombinedClassProgramEligibleFlag,
    participatingSchoolList,
    row.educationGrade,
    row.id,
    row.schoolName,
  ])

  const isCombinedClassApplyRadioDisabled =
    resolveCombinedClassApplyRadioDisabled(sameSchoolGradeOptions)

  /** @deprecated isCombinedClassProgramEligibleFlag && !isCombinedClassApplyRadioDisabled */
  const canApplyCombinedClass =
    isCombinedClassProgramEligibleFlag && !isCombinedClassApplyRadioDisabled

  const resetEditState = useCallback(() => {
    setIsEditing(false)
    setDraft(null)
    setValidationErrors({})
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- detail 변경 시 편집 draft 초기화 */
  useEffect(() => {
    resetEditState()
  }, [detail.id, resetEditState])
  /* eslint-enable react-hooks/set-state-in-effect */

  const enterEdit = useCallback((detailOverride?: SchoolDetailForModal) => {
    const source = detailOverride ?? detail
    const hasTextbook =
      Boolean(source.textbookId?.trim()) ||
      (Boolean(source.textbookName?.trim()) && source.textbookName?.trim() !== '해당 없음')
    const textbookIdFallback = hasTextbook
      ? resolveTextbookIdFromName(source.textbookName, textbookOptions) ||
        source.textbookId ||
        textbookDisplay.textbookId ||
        ''
      : TEXTBOOK_NOT_USED_OPTION_VALUE
    let nextDraft = detailToParticipatingInstitutionEditDraft(
      source,
      textbookIdFallback,
      textbookDisplay.textbookGrade
    )
    if (!hasTextbook) {
      nextDraft = {
        ...nextDraft,
        textbookId: TEXTBOOK_NOT_USED_OPTION_VALUE,
        textbookName: '해당 없음',
      }
    }
    if (!isCombinedClassProgramEligibleFlag) {
      nextDraft = {
        ...nextDraft,
        combinedClassApplication: '미신청',
        combinedClassPartnerSchoolIds: [],
      }
    }
    setDraft(nextDraft)
    setValidationErrors({})
    setIsEditing(true)
  }, [
    detail,
    isCombinedClassProgramEligibleFlag,
    textbookDisplay.textbookGrade,
    textbookDisplay.textbookId,
    textbookOptions,
  ])

  const cancelEdit = useCallback(() => {
    resetEditState()
  }, [resetEditState])

  const updateDraft = useCallback(
    (partial: Partial<NonNullable<typeof draft>>) => {
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
            textbookGrade: '',
          }
        }
        if (partial.textbookId != null && (usesTextbook || programAllowsTextbookSelect)) {
          if (partial.textbookId === TEXTBOOK_NOT_USED_OPTION_VALUE || partial.textbookId === '') {
            return {
              ...next,
              textbookId: TEXTBOOK_NOT_USED_OPTION_VALUE,
              textbookName: '해당 없음',
              textbookGrade: '',
            }
          }
          const selected = textbookOptions.find(option => option.value === partial.textbookId)
          const storeRow =
            (gradeTextbookCatalog ?? []).find(rowItem => rowItem.id === partial.textbookId) ??
            (resolvedTextbookCatalog ?? []).find(rowItem => rowItem.id === partial.textbookId) ??
            filterTextbooksForCombinedClassEdit(program, textbookCatalog).find(
              rowItem => rowItem.id === partial.textbookId
            )
          if (selected && storeRow) {
            const fields = resolveTextbookFieldsFromSelection(storeRow)
            return {
              ...next,
              textbookId: fields.textbookId,
              textbookName: fields.textbookName,
              textbookGrade: fields.textbookGrade,
            }
          }
          if (selected) {
            return {
              ...next,
              textbookName: selected.textbookName,
            }
          }
        }
        return next
      })
      setValidationErrors({})
    },
    [
      gradeTextbookCatalog,
      program,
      programAllowsTextbookSelect,
      resolvedTextbookCatalog,
      textbookCatalog,
      textbookOptions,
      usesTextbook,
    ]
  )

  const saveEdit = useCallback(async (): Promise<InstitutionInfoSaveResult> => {
    if (!draft) return false

    if (
      isCombinedClassProgramEligibleFlag &&
      !combinedClassReadOnly &&
      draft.combinedClassApplication === '신청' &&
      draft.combinedClassPartnerSchoolIds.length === 0
    ) {
      return COMBINED_CLASS_GRADE_REQUIRED_SAVE_RESULT
    }

    const normalizedDraft = {
      ...draft,
      combinedClassApplication: isCombinedClassProgramEligibleFlag
        ? draft.combinedClassApplication
        : '미신청',
      combinedClassPartnerSchoolIds:
        isCombinedClassProgramEligibleFlag && draft.combinedClassApplication === '신청'
          ? draft.combinedClassPartnerSchoolIds
          : [],
    }

    const parsed = parseParticipatingInstitutionEditDraft(normalizedDraft, { usesTextbook })
    if (!parsed.success) {
      void showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return false
    }

    const patch = participatingInstitutionEditDraftToDetailPatch(normalizedDraft, [], {
      program,
      requiresTextbook: usesTextbook,
      // 진행 현황 상세 — 합반 미신청이어도 교재 지정·해당 없음 저장 허용
      allowTextbookSelectionWithoutCombinedClass: true,
      catalog: resolvedTextbookCatalog,
    })
    if (Object.keys(patch).length === 0) {
      void showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return false
    }

    setIsSaving(true)
    try {
      const baseline = detailToParticipatingInstitutionEditDraft(
        detail,
        detail.textbookId || textbookDisplay.textbookId || '',
        detail.textbookGrade || textbookDisplay.textbookGrade
      )
      const nonMergeChanged =
        baseline.educationGrade !== normalizedDraft.educationGrade ||
        baseline.classCount !== normalizedDraft.classCount ||
        baseline.studentCount !== normalizedDraft.studentCount ||
        baseline.textbookId !== normalizedDraft.textbookId ||
        baseline.textbookName !== normalizedDraft.textbookName ||
        baseline.addressDetail !== normalizedDraft.addressDetail ||
        baseline.educationFormat !== normalizedDraft.educationFormat ||
        baseline.teacherName !== normalizedDraft.teacherName ||
        baseline.teacherPhone !== normalizedDraft.teacherPhone ||
        baseline.teacherMobile !== normalizedDraft.teacherMobile ||
        baseline.teacherEmail !== normalizedDraft.teacherEmail ||
        baseline.applicationReason !== normalizedDraft.applicationReason ||
        baseline.otherRequests !== normalizedDraft.otherRequests ||
        baseline.computerInRoom !== normalizedDraft.computerInRoom ||
        baseline.waitingRoomAvailable !== normalizedDraft.waitingRoomAvailable ||
        baseline.waitingRoomLocation !== normalizedDraft.waitingRoomLocation ||
        baseline.mealProvided !== normalizedDraft.mealProvided ||
        baseline.mealNotice !== normalizedDraft.mealNotice ||
        baseline.parkingInfo !== normalizedDraft.parkingInfo
      const textbookChanged =
        baseline.textbookId !== normalizedDraft.textbookId ||
        baseline.textbookName !== normalizedDraft.textbookName ||
        baseline.textbookGrade !== normalizedDraft.textbookGrade

      if (!nonMergeChanged) {
        resetEditState()
        return true
      }

      if (!shouldUseParticipatingInstitutionApplicationPatchRemote()) {
        notifyProgramApiUnavailable(
          'general-participating-institution-detail-patch',
          '일반 프로그램 · 참여 기관 신청 정보 수정'
        )
        return false
      }

      {
          const applicationId = resolveParticipatingInstitutionApplicationId({
            organizationApplicationId: row.organizationApplicationId,
            detailId: detail.id,
            rowId: row.id,
          })
          if (!applicationId) {
            void showAlert({
              title: '안내',
              content: '기관 신청 ID가 없어 저장할 수 없습니다.',
            })
            return false
          }

          const updateBody = buildParticipatingInstitutionOrganizationUpdateRequest({
            draft: normalizedDraft,
            teacherOptions,
            fallbackTeacherMemberId: row.teacherMemberId,
            textbookGrade: patch.textbookGrade,
            textbookKits: patch.textbookKits,
            textbookQuantity: patch.textbookQuantity,
            baselineEducationFormat: baseline.educationFormat,
            includeTextbookFields: textbookChanged,
            allowEducationFormatChange:
              shouldShowInstitutionApplicationEducationFormatField(program),
          })
          await updateOrganizationApplicationRemote(applicationId, updateBody)
          const canonicalDetail = await fetchOrganizationApplicationDetailRemote(applicationId)
          const programId = String(program.id ?? '')
          for (const queryKey of organizationApplicationDetailCacheKeys(applicationId, programId)) {
            queryClient.setQueryData(queryKey, canonicalDetail)
            void queryClient.invalidateQueries({ queryKey })
          }
          if (programId) {
            void queryClient.invalidateQueries({
              queryKey: generalApplicationsQueryKeys.organizationList(programId),
            })
            void queryClient.invalidateQueries({
              queryKey: generalProgramProgressQueryKeys.institutions(programId),
            })
            if (isTrainedTeachersDetailProgram(program)) {
              void queryClient.invalidateQueries({
                queryKey: trainedTeacherQueryKeys.organizationApplicationsRoot(),
              })
              void queryClient.invalidateQueries({
                queryKey: trainedTeacherQueryKeys.organizationApplication(programId, applicationId),
              })
              void queryClient.invalidateQueries({
                queryKey: trainedTeacherQueryKeys.participatingInstitutions(programId),
              })
              void queryClient.invalidateQueries({
                queryKey: trainedTeacherQueryKeys.performanceSummary(programId),
              })
            }
          }

          const {
            combinedClassApplication: _combinedClassApplication,
            combinedClassPartnerSchoolIds: _combinedClassPartnerSchoolIds,
            combinedClassPartnerGrades: _combinedClassPartnerGrades,
            ...infoPatch
          } = patch
          onSaveBasicInfo?.(
            buildParticipatingInstitutionLocalSavePatch({
              detailId: detail.id,
              draft: normalizedDraft,
              patch: infoPatch,
              fallbackClassCount: row.classCount,
              fallbackStudentCount: row.studentCount,
            })
          )
      }

      resetEditState()
      return true
    } catch (error) {
      const responseData = axios.isAxiosError(error) ? error.response?.data : undefined
      const httpStatus = axios.isAxiosError(error) ? error.response?.status : undefined
      void showAlert({
        title: '안내',
        content: axios.isAxiosError(error)
          ? resolveOrganizationMergeErrorMessage(responseData, {
              httpStatus,
              fallback: '저장에 실패했습니다. 다시 시도해 주세요.',
            })
          : error instanceof Error && error.message.trim()
            ? error.message
            : '저장에 실패했습니다. 다시 시도해 주세요.',
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }, [
    combinedClassReadOnly,
    detail,
    draft,
    isCombinedClassProgramEligibleFlag,
    onSaveBasicInfo,
    program,
    queryClient,
    resetEditState,
    row,
    showAlert,
    resolvedTextbookCatalog,
    teacherOptions,
    textbookDisplay.textbookGrade,
    textbookDisplay.textbookId,
    usesTextbook,
  ])

  return {
    isEditing,
    isSaving,
    combinedClassReadOnly,
    draft,
    validationErrors,
    textbookOptions,
    textbookDisplay,
    usesTextbook,
    canEditTextbook,
    requiresTextbookSelection: draft
      ? requiresParticipatingTextbookSelection(usesTextbook, draft)
      : false,
    sameSchoolGradeOptions,
    teacherOptions,
    isTeacherOptionsLoading: affiliatedTeachersQuery.isLoading,
    canApplyCombinedClass,
    isCombinedClassProgramEligible: isCombinedClassProgramEligibleFlag,
    isCombinedClassApplyRadioDisabled,
    enterEdit,
    cancelEdit,
    saveEdit,
    updateDraft,
  }
}
