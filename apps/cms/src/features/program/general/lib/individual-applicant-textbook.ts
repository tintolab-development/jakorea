import type { TextbookStatusKey } from '@/features/program/general/model/participating-schools'
import { TEXTBOOK_STATUS_LABELS } from '@/features/program/general/model/participating-schools'
import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import type { Program } from '@/types/domain'
import {
  filterTextbooksForIndividualApplicant,
  resolveIndividualTextbookOptionLabel,
} from '@/features/program/general/lib/filter-textbooks-for-applicant'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import type { TextbookSelectOption } from '@/features/program/general/hooks/use-applicant-institution-detail-edit'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'

/** UI 셀렉 전용 sentinel — PATCH 시 `textbookId: null`로 보낸다 */
export const TEXTBOOK_NOT_USED_OPTION_VALUE = '__TEXTBOOK_NOT_USED__'

/** 미지정(textbook null) 표시 — 기관 신청 상세와 같은 「해당 없음」 */
export const INDIVIDUAL_APPLICANT_TEXTBOOK_UNDECIDED_LABEL = '해당 없음'

/**
 * 일반 프로그램(개인) 참여자 신청 상세 — 승인 완료 시 기본 정보 첫 행 「프로그램 승인 현황 | 교재명」 반반.
 * 시안 06-1(4121:106093)·06-2(4121:108167). 승인 대기·반려 시안(01·03)에는 교재명 행이 없다.
 * 기관형 `shouldShowGeneralOrganizationApplicantTextbookField`와 같은 규칙(유형 + 승인 완료).
 */
export function shouldShowGeneralIndividualApplicantTextbookField(
  program: Program | null | undefined,
  approvalStatus: string | null | undefined
): boolean {
  if (!program) return false
  return isGeneralIndividualProgram(program) && approvalStatus === 'approved'
}

/**
 * 승인 완료 후 교재 셀렉트 옵션.
 * matches(사업분야+학년). 라벨은 `교재명 educationTarget`.
 * 맨 앞 「해당 없음」→ 저장 시 null.
 */
export function buildIndividualApplicantTextbookOptions(
  program: Program | null | undefined,
  educationGrade: string,
  catalog?: TextbookRow[]
): TextbookSelectOption[] {
  if (!program) {
    return [
      { value: TEXTBOOK_NOT_USED_OPTION_VALUE, label: '해당 없음', textbookName: '해당 없음' },
    ]
  }
  const grade = educationGrade.trim()
  const businessArea = program.businessArea?.trim()
  // catalog undefined = 로딩 중 → 옵션은 해당 없음만 (store 폴백 금지)
  const rows =
    catalog !== undefined && grade && businessArea
      ? filterTextbooksForIndividualApplicant(program, grade, catalog)
      : []

  return [
    { value: TEXTBOOK_NOT_USED_OPTION_VALUE, label: '해당 없음', textbookName: '해당 없음' },
    ...rows.map(row => ({
      value: row.id,
      label: resolveIndividualTextbookOptionLabel(row),
      textbookName: row.textbookName,
    })),
  ]
}

function resolveMatchedTextbookRow(
  row: GeneralIndividualApplicantRow,
  program: Program | null | undefined,
  catalog?: TextbookRow[]
): TextbookRow | undefined {
  const textbookId = row.textbookId?.trim()
  if (textbookId === TEXTBOOK_NOT_USED_OPTION_VALUE) return undefined
  const textbookName = row.textbookName?.trim()
  const catalogRows = catalog ?? []

  const matchedById = textbookId ? catalogRows.find(item => item.id === textbookId) : undefined
  if (matchedById) return matchedById

  const matchedByName =
    textbookName && textbookName !== '해당 없음'
      ? catalogRows.find(item => item.textbookName.trim() === textbookName)
      : undefined
  if (matchedByName) return matchedByName

  if (!program || !textbookName || textbookName === '해당 없음') return undefined
  const grade = (row.educationGrade ?? row.detail?.affiliationGrade ?? '').trim()
  if (!grade) return undefined
  const filtered = filterTextbooksForIndividualApplicant(program, grade, catalog)
  return (
    (textbookId ? filtered.find(item => item.id === textbookId) : undefined) ??
    filtered.find(item => item.textbookName.trim() === textbookName)
  )
}

/** 미지정(textbook null / textbookId null) → 배지「해당 없음」 */
export function isIndividualTextbookUnspecified(row: GeneralIndividualApplicantRow): boolean {
  if (row.textbookId === TEXTBOOK_NOT_USED_OPTION_VALUE) return true
  if (row.textbookName === '해당 없음') return true
  return !row.textbookId?.trim() && !row.textbookName?.trim()
}

export function resolveIndividualApplicantTextbookDisplay(
  program: Program | null | undefined,
  row: GeneralIndividualApplicantRow,
  catalog?: TextbookRow[]
): {
  name: string
  kitsLabel: string
  status: TextbookStatusKey | null
  isUnspecified: boolean
} {
  if (isIndividualTextbookUnspecified(row)) {
    return {
      name: '해당 없음',
      kitsLabel: '-',
      status: 'not_applicable',
      isUnspecified: true,
    }
  }

  const matched = resolveMatchedTextbookRow(row, program, catalog)
  const displayName = matched
    ? resolveIndividualTextbookOptionLabel(matched)
    : row.textbookName?.trim() || '해당 없음'

  const textbookKits = row.textbookKits
  const textbookQuantity = row.textbookQuantity

  return {
    name: displayName,
    kitsLabel:
      textbookKits != null || textbookQuantity != null
        ? `${textbookKits ?? '-'}키트 (${textbookQuantity ?? '-'}권)`
        : '-',
    status: row.textbookStatus ?? 'preparing',
    isUnspecified: false,
  }
}

export function resolveIndividualTextbookStatusLabel(status: TextbookStatusKey | null): string {
  if (!status) return '-'
  return TEXTBOOK_STATUS_LABELS[status] ?? '-'
}
