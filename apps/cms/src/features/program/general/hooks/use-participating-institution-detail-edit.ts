import { useCallback, useEffect, useMemo, useState } from 'react'
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
  filterTextbooksForApplicant,
  resolveTextbookOptionLabel,
} from '@/features/program/general/lib/filter-textbooks-for-applicant'
import {
  filterTextbooksForCombinedClassEdit,
  programUsesTextbook,
  resolveParticipatingInstitutionTextbookDisplay,
  resolveTextbookFieldsFromSelection,
} from '@/features/program/general/lib/participating-institution-textbook'
import { getSameSchoolParticipatingGrades } from '@/features/program/general/lib/get-same-school-participating-grades'
import type { TextbookSelectOption } from '@/features/program/general/hooks/use-applicant-institution-detail-edit'
import type { CombinedClassApplicationStatus } from '@/features/program/general/lib/applicant-institution-detail-edit'
import { useProgramTextbookCatalog } from '@/features/textbook/hooks/use-program-textbook-catalog'
import { useCmsAlert } from '@/shared/ui'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'

function isCompanySchoolProgram(program: Program): boolean {
  return (
    program.id.startsWith('economy-prog-') ||
    program.id.startsWith('company-school-prog-') ||
    program.id.startsWith('company-school-local-') ||
    program.mainTitle?.includes('1사1교') === true ||
    program.title?.includes('1사1교') === true
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
  onSaveCombinedClass,
  combinedClassReadOnly = false,
  onCombinedClassApplied,
}: UseParticipatingInstitutionDetailEditParams) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState<ReturnType<
    typeof detailToParticipatingInstitutionEditDraft
  > | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const { showAlert } = useCmsAlert()

  const { catalog: textbookCatalog, isLoading: isTextbookCatalogLoading } =
    useProgramTextbookCatalog(program)

  const isCompanySchool = useMemo(() => isCompanySchoolProgram(program), [program])

  /** 카탈로그 로딩 중에는 필드를 숨기지 않음(새로고침 플래시 방지) */
  const usesTextbook = useMemo(
    () =>
      isCompanySchool ||
      isTextbookCatalogLoading ||
      programUsesTextbook(program, textbookCatalog),
    [isCompanySchool, isTextbookCatalogLoading, program, textbookCatalog]
  )

  const isCombinedClassProgramEligibleFlag = useMemo(
    () => isCombinedClassProgramEligible(program),
    [program]
  )

  const textbookDisplay = useMemo(
    () =>
      resolveParticipatingInstitutionTextbookDisplay({
        program,
        educationGrade: row.educationGrade,
        studentCount: row.studentCount,
        textbookId: detail.textbookId,
        textbookName: detail.textbookName,
        textbookGrade: detail.textbookGrade,
        textbookKits: detail.textbookKits,
        textbookQuantity: detail.textbookQuantity,
        catalog: textbookCatalog,
      }),
    [
      detail.textbookGrade,
      detail.textbookId,
      detail.textbookKits,
      detail.textbookName,
      detail.textbookQuantity,
      program,
      row.educationGrade,
      row.studentCount,
      textbookCatalog,
    ]
  )

  const textbookOptions = useMemo((): TextbookSelectOption[] => {
    if (!usesTextbook) return []

    const rows =
      !isCompanySchool &&
      (draft?.combinedClassApplication === '신청' ||
        toCombinedClassApplicationStatus(detail.combinedClassApplication) === '신청')
        ? filterTextbooksForCombinedClassEdit(program, textbookCatalog)
        : filterTextbooksForApplicant(program, row.educationGrade, textbookCatalog)

    return rows.map(textbookRow => ({
      value: textbookRow.id,
      label: resolveTextbookOptionLabel(textbookRow),
      textbookName: textbookRow.textbookName,
    }))
  }, [
    detail.combinedClassApplication,
    draft?.combinedClassApplication,
    isCompanySchool,
    program,
    row.educationGrade,
    usesTextbook,
    textbookCatalog,
  ])

  const canEditTextbook =
    usesTextbook &&
    (isCompanySchool ? row.approvalStatus === 'approved' : draft?.combinedClassApplication === '신청')

  const sameSchoolGradeOptions = useMemo((): SameSchoolParticipatingGradeOption[] => {
    if (!isCombinedClassProgramEligibleFlag) return []
    return getSameSchoolParticipatingGrades(
      participatingSchoolList,
      row.schoolName,
      row.id
    ).map(participatingRow => ({
      value: participatingRow.id,
      label: participatingRow.educationGrade,
      educationGrade: participatingRow.educationGrade,
    }))
  }, [isCombinedClassProgramEligibleFlag, participatingSchoolList, row.id, row.schoolName])

  const isCombinedClassApplyRadioDisabled = resolveCombinedClassApplyRadioDisabled(
    sameSchoolGradeOptions
  )

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
    const textbookIdFallback =
      resolveTextbookIdFromName(detail.textbookName, textbookOptions) ||
      textbookDisplay.textbookId ||
      ''
    let nextDraft = detailToParticipatingInstitutionEditDraft(
      detail,
      textbookIdFallback,
      textbookDisplay.textbookGrade
    )
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
          const selected = textbookOptions.find(option => option.value === partial.textbookId)
          const storeRow = filterTextbooksForCombinedClassEdit(program, textbookCatalog).find(
            rowItem => rowItem.id === partial.textbookId
          )
          if (selected && storeRow) {
            const fields = resolveTextbookFieldsFromSelection(program, storeRow, row.studentCount)
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
    [program, row.studentCount, textbookCatalog, textbookOptions, usesTextbook]
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
      studentCount: row.studentCount,
      requiresTextbook: usesTextbook,
      allowTextbookSelectionWithoutCombinedClass: isCompanySchool,
      catalog: textbookCatalog,
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
        notifyProgramApiUnavailable(
          'general-participating-institution-detail-patch',
          '일반 프로그램 · 참여 기관 신청 정보 수정'
        )
        if (!savedCombinedClass) return false
      }

      if (!savedCombinedClass && !nonMergeChanged) {
        resetEditState()
        return true
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
    } catch {
      void showAlert({
        title: '안내',
        content: '저장에 실패했습니다. 다시 시도해 주세요.',
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
    onSaveCombinedClass,
    participatingSchoolList,
    program,
    resetEditState,
    row,
    row.studentCount,
    isCompanySchool,
    showAlert,
    textbookCatalog,
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
    canApplyCombinedClass,
    isCombinedClassProgramEligible: isCombinedClassProgramEligibleFlag,
    isCombinedClassApplyRadioDisabled,
    enterEdit,
    cancelEdit,
    saveEdit,
    updateDraft,
  }
}
