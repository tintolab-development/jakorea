import type { TextbookStatusKey } from '@/data/mock/participating-schools'
import { TEXTBOOK_STATUS_LABELS } from '@/data/mock/participating-schools'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import type { Program } from '@/types/domain'
import {
  calculateParticipatingTextbookKitQuantity,
  programUsesTextbook,
} from '@/features/program/general/lib/participating-institution-textbook'
import {
  filterTextbooksForApplicant,
  resolveTextbookOptionLabel,
} from '@/features/program/general/lib/filter-textbooks-for-applicant'
import type { TextbookSelectOption } from '@/features/program/general/hooks/use-applicant-institution-detail-edit'

export const TEXTBOOK_NOT_USED_OPTION_VALUE = '__TEXTBOOK_NOT_USED__'

export const TEXTBOOK_UNDECIDED_LABEL = '미정'

export function individualApplicantUsesTextbook(program: Program | null | undefined): boolean {
  if (!program) return false
  return programUsesTextbook(program)
}

export function buildIndividualApplicantTextbookOptions(
  program: Program | null | undefined,
  educationGrade: string
): TextbookSelectOption[] {
  if (!program) return []
  const grade = educationGrade.trim()
  const catalog = grade
    ? filterTextbooksForApplicant(program, grade).map(row => ({
        value: row.id,
        label: resolveTextbookOptionLabel(row),
        textbookName: row.textbookName,
      }))
    : []

  return [
    { value: TEXTBOOK_NOT_USED_OPTION_VALUE, label: '해당 없음', textbookName: '해당 없음' },
    ...catalog,
  ]
}

export function resolveIndividualApplicantTextbookDisplay(
  program: Program | null | undefined,
  row: GeneralIndividualApplicantRow
): {
  name: string
  kitsLabel: string
  status: TextbookStatusKey | null
  isUndecided: boolean
} {
  if (row.textbookId === TEXTBOOK_NOT_USED_OPTION_VALUE || row.textbookName === '해당 없음') {
    return {
      name: '해당 없음',
      kitsLabel: '-',
      status: 'not_applicable',
      isUndecided: false,
    }
  }

  if (!row.textbookId && !row.textbookName?.trim()) {
    return {
      name: TEXTBOOK_UNDECIDED_LABEL,
      kitsLabel: '-',
      status: null,
      isUndecided: true,
    }
  }

  const participantCount = row.detail?.teamMemberCount ?? 1
  const kits =
    row.textbookKits ??
    (program ? calculateParticipatingTextbookKitQuantity(program, participantCount).textbookKits : 0)
  const quantity =
    row.textbookQuantity ??
    (program
      ? calculateParticipatingTextbookKitQuantity(program, participantCount).textbookQuantity
      : 0)

  return {
    name: row.textbookName?.trim() || TEXTBOOK_UNDECIDED_LABEL,
    kitsLabel: kits > 0 ? `${kits}키트 (${quantity}권)` : '-',
    status: row.textbookStatus ?? 'preparing',
    isUndecided: false,
  }
}

export function resolveIndividualTextbookStatusLabel(status: TextbookStatusKey | null): string {
  if (!status) return '-'
  return TEXTBOOK_STATUS_LABELS[status] ?? '-'
}
