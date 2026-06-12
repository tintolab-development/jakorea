import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ParticipatingSchoolRow } from '@/data/mock/participating-schools'
import type { Program } from '@/types/domain'
import type { SchoolDetailForModal } from '@/features/program/general/model/school-detail-types'
import {
  isCombinedClassProgramEligible,
  resolveCombinedClassApplyRadioDisabled,
} from '@/features/program/general/lib/combined-class-edit-policy'
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
}

export function useParticipatingInstitutionDetailEdit({
  detail,
  row,
  program,
  participatingSchoolList,
  onSaveBasicInfo,
}: UseParticipatingInstitutionDetailEditParams) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<ReturnType<
    typeof detailToParticipatingInstitutionEditDraft
  > | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const usesTextbook = useMemo(() => programUsesTextbook(program), [program])

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
    ]
  )

  const textbookOptions = useMemo((): TextbookSelectOption[] => {
    if (!usesTextbook) return []

    const rows =
      draft?.combinedClassApplication === '신청' ||
      toCombinedClassApplicationStatus(detail.combinedClassApplication) === '신청'
        ? filterTextbooksForCombinedClassEdit(program)
        : filterTextbooksForApplicant(program, row.educationGrade)

    return rows.map(textbookRow => ({
      value: textbookRow.id,
      label: resolveTextbookOptionLabel(textbookRow),
      textbookName: textbookRow.textbookName,
    }))
  }, [
    detail.combinedClassApplication,
    draft?.combinedClassApplication,
    program,
    row.educationGrade,
    usesTextbook,
  ])

  const canEditTextbook = usesTextbook && draft?.combinedClassApplication === '신청'

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
          const storeRow = filterTextbooksForCombinedClassEdit(program).find(
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
    [program, row.studentCount, textbookOptions, usesTextbook]
  )

  const saveEdit = useCallback((): boolean => {
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
      setValidationErrors(parsed.errors)
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
    })
    if (Object.keys(patch).length === 0) {
      setValidationErrors({ form: '저장할 수 없습니다. 입력값을 확인해 주세요.' })
      return false
    }

    onSaveBasicInfo?.({ ...patch, id: detail.id })
    resetEditState()
    return true
  }, [
    detail.id,
    draft,
    isCombinedClassProgramEligibleFlag,
    onSaveBasicInfo,
    participatingSchoolList,
    program,
    resetEditState,
    row.studentCount,
    usesTextbook,
  ])

  return {
    isEditing,
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
