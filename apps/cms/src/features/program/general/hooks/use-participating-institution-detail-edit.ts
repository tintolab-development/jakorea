import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'
import type { SchoolDetailForModal } from '@/features/program/general/model/school-detail-types'
import {
  isCombinedClassProgramEligible,
  resolveCombinedClassApplyRadioDisabled,
} from '@/features/program/general/lib/combined-class-edit-policy'
import {
  buildCombinedClassLeadTeacherCandidatesFromParticipating,
  type CombinedClassLeadTeacherCandidate,
} from '@/features/program/general/lib/combined-class-lead-teacher'
import {
  detailToParticipatingInstitutionEditDraft,
  parseParticipatingInstitutionEditDraft,
  participatingInstitutionEditDraftToDetailPatch,
  requiresParticipatingTextbookSelection,
  resolvePartnerGradesFromSchoolIds,
  resolveTextbookIdFromName,
  toCombinedClassApplicationStatus,
} from '@/features/program/general/lib/participating-institution-detail-edit'
import {
  filterTextbooksForCombinedClassEdit,
  buildCombinedClassTextbookSelectOptions,
  buildParticipatingInstitutionTextbookSelectOptions,
  programUsesTextbook,
  resolveParticipatingInstitutionTextbookDisplay,
  resolveTextbookFieldsFromSelection,
} from '@/features/program/general/lib/participating-institution-textbook'
import { TEXTBOOK_NOT_USED_OPTION_VALUE } from '@/features/program/general/lib/individual-applicant-textbook'
import type { TextbookSelectOption } from '@/features/program/general/hooks/use-applicant-institution-detail-edit'
import type { CombinedClassApplicationStatus } from '@/features/program/general/lib/applicant-institution-detail-edit'
import {
  getInstitutionAffiliatedTeacherOptions,
  mergeInstitutionAffiliatedTeacherOptions,
  shouldShowInstitutionApplicationEducationFormatField,
  type InstitutionAffiliatedTeacherOption,
} from '@/features/program/general/lib/institution-application-detail-edit-policy'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { useAffiliatedTeachersQuery } from '@/features/user/api/hooks/use-member-detail-subresource-queries'
import { isSchoolAffiliatedTeacherRowSelectable } from '@/features/user/detail/lib/school-teacher-employment-status'
import { useProgramTextbookCatalog } from '@/features/textbook/hooks/use-program-textbook-catalog'
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
} from '@/features/program/general/api/general-applications-query-keys'
import { trainedTeacherQueryKeys } from '@/features/program/trained-teachers/api/query-keys'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import {
  buildParticipatingInstitutionLocalSavePatch,
  buildParticipatingInstitutionOrganizationUpdateRequest,
  resolveParticipatingInstitutionApplicationId,
} from '@/features/program/general/lib/participating-institution-organization-update'
import { extractApiErrorMessage } from '@/shared/lib/extract-api-error-message'
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
  /** remote 합반 저장 — 미전달 시 로컬 patch만 */
  onSaveCombinedClass?: (params: {
    combinedClassApplication: CombinedClassApplicationStatus
    combinedClassPartnerSchoolIds: string[]
  }) => Promise<void>
  /** 합반 멤버(비 lead) 행이면 true — 합반 필드 read-only */
  combinedClassReadOnly?: boolean
  onCombinedClassApplied?: (params: {
    memberRowIds: string[]
    candidates: CombinedClassLeadTeacherCandidate[]
  }) => void
}

export function useParticipatingInstitutionDetailEdit({
  detail,
  row,
  program,
  participatingSchoolList,
  onSaveBasicInfo,
  onSaveCombinedClass,
  combinedClassReadOnly = false,
  onCombinedClassApplied,
}: UseParticipatingInstitutionDetailEditParams) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState<ReturnType<
    typeof detailToParticipatingInstitutionEditDraft
  > | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const { showAlert } = useCmsAlert()

  const educationGradeForTextbookOptions =
    (isEditing ? draft?.educationGrade?.trim() : '') || row.educationGrade
  const { catalog: textbookCatalog, isLoading: isTextbookCatalogLoading } =
    useProgramTextbookCatalog(program)
  const { catalog: gradeTextbookCatalog, isLoading: isGradeTextbookCatalogLoading } =
    useProgramTextbookCatalog(program, educationGradeForTextbookOptions)
  const isCompanySchool = useMemo(() => isCompanySchoolProgram(program), [program])

  /** 카탈로그 로딩 중에는 필드를 숨기지 않음(새로고침 플래시 방지) */
  const usesTextbook = useMemo(
    () =>
      isCompanySchool ||
      isTextbookCatalogLoading ||
      isGradeTextbookCatalogLoading ||
      programUsesTextbook(program, textbookCatalog) ||
      programUsesTextbook(program, gradeTextbookCatalog),
    [
      isCompanySchool,
      isGradeTextbookCatalogLoading,
      isTextbookCatalogLoading,
      gradeTextbookCatalog,
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

  const resolvedTextbookCatalog = useMemo(() => {
    if (gradeTextbookCatalog === undefined && textbookCatalog === undefined) return undefined
    const byId = new Map<string, NonNullable<typeof textbookCatalog>[number]>()
    for (const rowItem of textbookCatalog ?? []) byId.set(rowItem.id, rowItem)
    for (const rowItem of gradeTextbookCatalog ?? []) byId.set(rowItem.id, rowItem)
    return [...byId.values()]
  }, [gradeTextbookCatalog, textbookCatalog])

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
    if (!usesTextbook) return []

    const isCombinedSelect =
      !isCompanySchool &&
      (draft?.combinedClassApplication === '신청' ||
        toCombinedClassApplicationStatus(detail.combinedClassApplication) === '신청')

    if (isCombinedSelect) {
      return buildCombinedClassTextbookSelectOptions(program, textbookCatalog)
    }

    return buildParticipatingInstitutionTextbookSelectOptions({
      program,
      educationGrade: educationGradeForTextbookOptions,
      gradeCatalog: gradeTextbookCatalog,
      programCatalog: textbookCatalog,
    })
  }, [
    detail.combinedClassApplication,
    draft?.combinedClassApplication,
    educationGradeForTextbookOptions,
    gradeTextbookCatalog,
    isCompanySchool,
    program,
    textbookCatalog,
    usesTextbook,
  ])

  /** 프로그램 진행 현황 — 승인 완료 시 교재 수정·등록 (합반 여부와 무관) */
  const canEditTextbook = usesTextbook && row.approvalStatus === 'approved'

  const sameSchoolGradeOptions = useMemo((): SameSchoolParticipatingGradeOption[] => {
    if (!isCombinedClassProgramEligibleFlag) return []
    return getSameSchoolParticipatingGrades(participatingSchoolList, row.schoolName, row.id).map(
      participatingRow => ({
        value: participatingRow.id,
        label: participatingRow.educationGrade,
        educationGrade: participatingRow.educationGrade,
      })
    )
  }, [isCombinedClassProgramEligibleFlag, participatingSchoolList, row.id, row.schoolName])

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

  const enterEdit = useCallback(() => {
    const hasTextbook =
      Boolean(detail.textbookId?.trim()) ||
      (Boolean(detail.textbookName?.trim()) && detail.textbookName?.trim() !== '해당 없음')
    const textbookIdFallback = hasTextbook
      ? resolveTextbookIdFromName(detail.textbookName, textbookOptions) ||
        detail.textbookId ||
        textbookDisplay.textbookId ||
        ''
      : TEXTBOOK_NOT_USED_OPTION_VALUE
    let nextDraft = detailToParticipatingInstitutionEditDraft(
      detail,
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
        if (partial.textbookId != null && usesTextbook) {
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
    [program, resolvedTextbookCatalog, textbookCatalog, textbookOptions, usesTextbook]
  )

  const saveEdit = useCallback(async (): Promise<boolean> => {
    if (!draft) return false

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

    const partnerGrades = resolvePartnerGradesFromSchoolIds(
      normalizedDraft.combinedClassPartnerSchoolIds,
      participatingSchoolList
    )
    const patch = participatingInstitutionEditDraftToDetailPatch(normalizedDraft, partnerGrades, {
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
      const partnersChanged =
        baseline.combinedClassApplication !== normalizedDraft.combinedClassApplication ||
        baseline.combinedClassPartnerSchoolIds.join('|') !==
          normalizedDraft.combinedClassPartnerSchoolIds.join('|')
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

      let savedCombinedClass = false
      if (
        partnersChanged &&
        onSaveCombinedClass &&
        isCombinedClassProgramEligibleFlag &&
        !combinedClassReadOnly
      ) {
        await onSaveCombinedClass({
          combinedClassApplication: normalizedDraft.combinedClassApplication,
          combinedClassPartnerSchoolIds: normalizedDraft.combinedClassPartnerSchoolIds,
        })
        savedCombinedClass = true
      } else if (partnersChanged && !onSaveCombinedClass) {
        notifyProgramApiUnavailable(
          'general-org-merge-groups-progress',
          '일반 프로그램 · 참여 기관 합반 신청'
        )
        return false
      }

      if (nonMergeChanged) {
        if (!shouldUseParticipatingInstitutionApplicationPatchRemote()) {
          notifyProgramApiUnavailable(
            'general-participating-institution-detail-patch',
            '일반 프로그램 · 참여 기관 신청 정보 수정'
          )
          if (!savedCombinedClass) return false
        } else {
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
          queryClient.setQueryData(
            generalApplicationsQueryKeys.organizationDetail(applicationId),
            canonicalDetail
          )

          const programId = String(program.id ?? '')
          void queryClient.invalidateQueries({
            queryKey: generalApplicationsQueryKeys.organizationDetail(applicationId),
          })
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

          onSaveBasicInfo?.(
            buildParticipatingInstitutionLocalSavePatch({
              detailId: detail.id,
              draft: normalizedDraft,
              patch: {
                ...patch,
                combinedClassApplication: normalizedDraft.combinedClassApplication,
                combinedClassPartnerSchoolIds:
                  normalizedDraft.combinedClassApplication === '신청'
                    ? normalizedDraft.combinedClassPartnerSchoolIds
                    : [],
                combinedClassPartnerGrades:
                  normalizedDraft.combinedClassApplication === '신청' ? partnerGrades : [],
              },
              fallbackClassCount: row.classCount,
              fallbackStudentCount: row.studentCount,
            })
          )
        }
      }

      if (!savedCombinedClass && !nonMergeChanged) {
        resetEditState()
        return true
      }

      if (savedCombinedClass && !nonMergeChanged) {
        onSaveBasicInfo?.({
          id: detail.id,
          combinedClassApplication: normalizedDraft.combinedClassApplication,
          combinedClassPartnerSchoolIds:
            normalizedDraft.combinedClassApplication === '신청'
              ? normalizedDraft.combinedClassPartnerSchoolIds
              : [],
          combinedClassPartnerGrades:
            normalizedDraft.combinedClassApplication === '신청' ? partnerGrades : [],
        })
      }

      resetEditState()

      if (
        savedCombinedClass &&
        normalizedDraft.combinedClassApplication === '신청' &&
        normalizedDraft.combinedClassPartnerSchoolIds.length > 0 &&
        !combinedClassReadOnly
      ) {
        const partnerRows = participatingSchoolList.filter(item =>
          normalizedDraft.combinedClassPartnerSchoolIds.includes(item.id)
        )
        const candidates = buildCombinedClassLeadTeacherCandidatesFromParticipating(
          {
            ...detail,
            combinedClassApplication: normalizedDraft.combinedClassApplication,
            combinedClassPartnerSchoolIds: normalizedDraft.combinedClassPartnerSchoolIds,
            combinedClassPartnerGrades: partnerGrades,
          },
          row,
          partnerRows
        )
        if (candidates.length > 0) {
          onCombinedClassApplied?.({
            memberRowIds: [detail.id, ...normalizedDraft.combinedClassPartnerSchoolIds],
            candidates,
          })
        }
      }

      return true
    } catch (error) {
      const responseData = axios.isAxiosError(error) ? error.response?.data : undefined
      const httpStatus = axios.isAxiosError(error) ? error.response?.status : undefined
      void showAlert({
        title: '안내',
        content: extractApiErrorMessage(responseData, {
          httpStatus,
          fallback: '저장에 실패했습니다. 다시 시도해 주세요.',
        }),
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
    onCombinedClassApplied,
    onSaveBasicInfo,
    onSaveCombinedClass,
    participatingSchoolList,
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
