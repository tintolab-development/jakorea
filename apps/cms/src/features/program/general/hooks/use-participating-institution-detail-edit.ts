import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'
import type { SchoolDetailForModal } from '@/features/program/general/model/school-detail-types'
import {
  isCombinedClassProgramEligible,
  resolveCombinedClassApplyRadioDisabled,
} from '@/features/program/general/lib/combined-class-edit-policy'
import {
  detailToParticipatingInstitutionEditDraft,
  parseParticipatingInstitutionEditDraft,
  requiresParticipatingTextbookSelection,
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
import { PROGRAM_API_UNAVAILABLE_SAVE_CONTENT } from '@/features/program/shared/lib/program-api-unavailable'
import type { CombinedClassApplicationStatus } from '@/features/program/general/lib/applicant-institution-detail-edit'
import { useProgramTextbookCatalog } from '@/features/textbook/hooks/use-program-textbook-catalog'
import { useCmsAlert } from '@/shared/ui'
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
}

export function useParticipatingInstitutionDetailEdit({
  detail,
  row,
  program,
  participatingSchoolList,
  onSaveBasicInfo,
  onSaveCombinedClass,
  combinedClassReadOnly = false,
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

    const canSaveCombined =
      Boolean(onSaveCombinedClass) &&
      isCombinedClassProgramEligibleFlag &&
      !combinedClassReadOnly

    const initialDraft = detailToParticipatingInstitutionEditDraft(detail)
    const combinedClassChanged =
      normalizedDraft.combinedClassApplication !== initialDraft.combinedClassApplication ||
      normalizedDraft.combinedClassPartnerSchoolIds.join('|') !==
        initialDraft.combinedClassPartnerSchoolIds.join('|')

    // Body PATCH는 BE gap — 로컬 setSavedBasicPatches 성공 UX 금지. 합반만 remote.
    // 합반 외 필드 변경이 있으면 미연동 안내 (합반도 함께 저장하지 않음).
    const otherFieldsChanged =
      normalizedDraft.educationGrade !== initialDraft.educationGrade ||
      normalizedDraft.classCount !== initialDraft.classCount ||
      normalizedDraft.textbookId !== initialDraft.textbookId ||
      normalizedDraft.textbookName !== initialDraft.textbookName ||
      normalizedDraft.teacherName !== initialDraft.teacherName

    if (otherFieldsChanged) {
      setValidationErrors({ form: PROGRAM_API_UNAVAILABLE_SAVE_CONTENT })
      void showAlert({
        title: 'API 연동 안내',
        content: PROGRAM_API_UNAVAILABLE_SAVE_CONTENT,
      })
      return false
    }

    if (!combinedClassChanged) {
      resetEditState()
      return true
    }

    if (!canSaveCombined || !onSaveCombinedClass) {
      setValidationErrors({ form: PROGRAM_API_UNAVAILABLE_SAVE_CONTENT })
      void showAlert({
        title: 'API 연동 안내',
        content: PROGRAM_API_UNAVAILABLE_SAVE_CONTENT,
      })
      return false
    }

    setIsSaving(true)
    try {
      await onSaveCombinedClass({
        combinedClassApplication: normalizedDraft.combinedClassApplication,
        combinedClassPartnerSchoolIds: normalizedDraft.combinedClassPartnerSchoolIds,
      })
      // keep onSaveBasicInfo unused for body — adminComment is saved via comments API elsewhere
      void onSaveBasicInfo
      resetEditState()
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
    onSaveBasicInfo,
    onSaveCombinedClass,
    resetEditState,
    showAlert,
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
