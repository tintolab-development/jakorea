import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import { listTextbooksFromStore } from '@/features/textbook/api/textbook-service'
import type { Program } from '@/types/domain'
import { isGeneralProgramScheduleType } from '@/features/program/general/model/common-info-edit-schema'
import { normalizeProgramBusinessAreaValue } from '@/features/program/shared/lib/program-detail-info-constants'
import {
  dedupeTextbooksByName,
  filterTextbooksForIndividualApplicant,
  resolveIndividualTextbookOptionLabel,
  resolveProgramEducationTargets,
  textbookMatchesProgramEducationTargets,
} from '@/features/program/general/lib/filter-textbooks-for-applicant'
import { TEXTBOOK_NOT_USED_OPTION_VALUE } from '@/features/program/general/lib/individual-applicant-textbook'
import type { TextbookSelectOption } from '@/features/program/general/hooks/use-applicant-institution-detail-edit'

function listUsedTextbooksForProgram(program: Program, catalog?: TextbookRow[]): TextbookRow[] {
  const educationTargets = resolveProgramEducationTargets(program)
  // undefined = 아직 원격 미도착 → sync store 폴백. [] = 로드 완료·교재 없음.
  // 원격 카탈로그는 교육 대상이 여러 개면 대상 조건을 빼고 받으므로, 여기서 합집합으로 다시 거른다.
  if (catalog !== undefined) {
    return catalog.filter(row =>
      textbookMatchesProgramEducationTargets(row.educationTarget, educationTargets)
    )
  }
  return listTextbooksFromStore().filter(row => {
    if (row.useStatus !== 'USED') return false
    if (program.businessArea && row.businessArea !== program.businessArea) return false
    return textbookMatchesProgramEducationTargets(row.educationTarget, educationTargets)
  })
}

/** 사업 분야·교육 대상에 맞는 사용 중 교재가 카탈로그에 있는지 (일정형 여부 무관) */
export function programHasTextbookCatalog(program: Program, catalog?: TextbookRow[]): boolean {
  return dedupeTextbooksByName(listUsedTextbooksForProgram(program, catalog)).length > 0
}

/** 교재 카탈로그·일정형이 아닌 일반 프로그램에 교재 정보 노출 여부 */
export function programUsesTextbook(program: Program, catalog?: TextbookRow[]): boolean {
  if (isGeneralProgramScheduleType(program)) return false
  return programHasTextbookCatalog(program, catalog)
}

const textbookNotUsedSelectOption: TextbookSelectOption = {
  value: TEXTBOOK_NOT_USED_OPTION_VALUE,
  label: '해당 없음',
  textbookName: '해당 없음',
}

/**
 * 참여 기관 수정 셀렉트를 열 수 있는지.
 * 일정형도 연다. 조건에 맞는 교재가 없어도 「해당 없음」은 남긴다.
 */
export function programOffersParticipatingTextbookSelect(
  _program: Program,
  _options?: { isCompanySchool?: boolean }
): boolean {
  return true
}

/** 매칭 교재가 없어도 맨 앞에 「해당 없음」을 둔다 */
export function ensureTextbookNotUsedSelectOption(
  options: TextbookSelectOption[]
): TextbookSelectOption[] {
  if (options.some(option => option.value === TEXTBOOK_NOT_USED_OPTION_VALUE)) return options
  return [textbookNotUsedSelectOption, ...options]
}

/** 참여 기관 교재 셀렉트 — 같은 사업분야의 사용 중 교재. 교육 대상·학년은 거르지 않는다. */
export function filterTextbooksByProgramBusinessArea(
  program: Program,
  catalog?: TextbookRow[]
): TextbookRow[] {
  const businessArea = normalizeProgramBusinessAreaValue(program.businessArea)
  const source = catalog ?? listTextbooksFromStore()
  return dedupeTextbooksByName(
    source.filter(row => {
      if (catalog === undefined && row.useStatus !== 'USED') return false
      if (!businessArea) return false
      return normalizeProgramBusinessAreaValue(row.businessArea) === businessArea
    })
  )
}

/** 합반 수정 셀렉트도 참여 기관과 같이 사업분야만 본다. */
export function filterTextbooksForCombinedClassEdit(
  program: Program,
  catalog?: TextbookRow[]
): TextbookRow[] {
  return filterTextbooksByProgramBusinessArea(program, catalog)
}

/**
 * 합반 신청 시 교재 셀렉 — 합반용 카탈로그.
 * 라벨·「해당 없음」은 개인/기관 셀렉과 동일.
 */
export function buildCombinedClassTextbookSelectOptions(
  program: Program,
  catalog?: TextbookRow[]
): TextbookSelectOption[] {
  const rows = filterTextbooksForCombinedClassEdit(program, catalog)

  return ensureTextbookNotUsedSelectOption(
    rows.map(row => ({
      value: row.id,
      label: resolveIndividualTextbookOptionLabel(row),
      textbookName: row.textbookName,
    }))
  )
}

/**
 * 진행 현황 참여 기관 교재 셀렉.
 * 프로그램 사업 분야 + 신청 학년이 포함되는 사용 중 교재. 라벨은 `교재명 educationTarget`.
 */
export function buildParticipatingInstitutionTextbookSelectOptions(params: {
  program: Program
  educationGrade?: string
  catalog?: TextbookRow[]
}): TextbookSelectOption[] {
  if (params.catalog === undefined) return [textbookNotUsedSelectOption]

  const grade = params.educationGrade?.trim() ?? ''
  const rows = grade
    ? filterTextbooksForIndividualApplicant(params.program, grade, params.catalog)
    : []

  return ensureTextbookNotUsedSelectOption(
    rows.map(row => ({
      value: row.id,
      label: resolveIndividualTextbookOptionLabel(row),
      textbookName: row.textbookName,
    }))
  )
}

/** 선택 교재의 학년 라벨 (실적 취합·표시용) */
export function resolveTextbookGradeLabel(textbook: TextbookRow): string {
  const grade = textbook.grade?.trim()
  if (grade && grade !== '전학년') return grade

  for (const stage of textbook.educationStages) {
    if (!stage.selected || !stage.grades) continue
    const selectedGrade = stage.grades.find(g => g.selected)?.label?.trim()
    if (selectedGrade) return selectedGrade
  }

  return grade || ''
}

export function resolveTextbookFieldsFromSelection(textbook: TextbookRow): {
  textbookId: string
  textbookName: string
  textbookGrade: string
} {
  return {
    textbookId: textbook.id,
    textbookName: textbook.textbookName,
    textbookGrade: resolveTextbookGradeLabel(textbook),
  }
}

function positiveCount(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

/** 기관 학생 수와 프로그램 배정 스냅샷(1키트당 권수)으로 필요 키트를 산출한다. 전역 최신 설정은 쓰지 않는다. */
export function calculateInstitutionKitQuantity(input: {
  studentCount?: number | null
  booksPerKit?: number | null
}): { kits: number; quantity: number } | null {
  const students = positiveCount(input.studentCount)
  const booksPerKit = positiveCount(input.booksPerKit)
  if (students == null || booksPerKit == null) return null
  const kits = Math.ceil(students / booksPerKit)
  return { kits, quantity: kits * booksPerKit }
}

function readBooksPerKitSnapshot(item: {
  booksPerKitSnapshot?: number
  bookCountPerKit?: number
}): number | null {
  return positiveCount(item.booksPerKitSnapshot) ?? positiveCount(item.bookCountPerKit)
}

function textbookNameMatches(
  item: { textbookNameKo?: string; textbookNameEn?: string },
  displayName?: string
): boolean {
  const display = displayName?.trim() ?? ''
  if (!display) return false
  const names = [item.textbookNameKo, item.textbookNameEn]
    .map(value => value?.trim() ?? '')
    .filter(Boolean)
  return names.some(name => display === name || display.startsWith(name) || name.startsWith(display))
}

export function resolveAssignedBooksPerKit(input: {
  items: Array<{
    textbookId?: number
    textbookNameKo?: string
    textbookNameEn?: string
    booksPerKitSnapshot?: number
    bookCountPerKit?: number
  }>
  textbookId?: string
  textbookName?: string
}): number | null {
  const id = input.textbookId != null && input.textbookId !== '' ? Number(input.textbookId) : NaN
  const byId = Number.isFinite(id) ? input.items.filter(item => item.textbookId === id) : []
  const byName = input.items.filter(item => textbookNameMatches(item, input.textbookName))
  const matched = byId.length > 0 ? byId : byName
  for (const item of matched) {
    const booksPerKit = readBooksPerKitSnapshot(item)
    if (booksPerKit != null) return booksPerKit
  }
  if (matched.length === 0 && input.items.length === 1) {
    return readBooksPerKitSnapshot(input.items[0]!)
  }
  return null
}

/** 기관 상세 키트·권수. 0·null은 미산출. 전역 최신 설정으로 재계산하지 않는다. */
export function formatParticipatingInstitutionKitQuantity(
  kits: number | null | undefined,
  quantity: number | null | undefined,
  fallback?: { studentCount?: number | null; booksPerKit?: number | null }
): string {
  const kitCount = positiveCount(kits)
  const bookCount = positiveCount(quantity)
  if (kitCount != null && bookCount != null) return `${kitCount}키트 (${bookCount}권)`
  if (kitCount != null) {
    const booksPerKit = positiveCount(fallback?.booksPerKit)
    if (booksPerKit != null) return `${kitCount}키트 (${kitCount * booksPerKit}권)`
    return `${kitCount}키트`
  }
  if (bookCount != null) return `${bookCount}권`

  const calculated = calculateInstitutionKitQuantity({
    studentCount: fallback?.studentCount,
    booksPerKit: fallback?.booksPerKit,
  })
  if (calculated) return `${calculated.kits}키트 (${calculated.quantity}권)`
  return '-'
}

/** 저장·조회용 교재 표시값 — 교재 수량은 서버 응답값만 표시 */
export function resolveParticipatingInstitutionTextbookDisplay(params: {
  textbookId?: string
  textbookName?: string
  textbookGrade?: string
  textbookKits?: number | null
  textbookQuantity?: number | null
  catalog?: TextbookRow[]
}): {
  textbookId?: string
  textbookName: string
  textbookGrade: string
  textbookKits: number | null
  textbookQuantity: number | null
} {
  const catalogSource = params.catalog ?? listTextbooksFromStore()

  const rawTextbookId = params.textbookId?.trim()
  const rawTextbookName = params.textbookName?.trim()
  const isExplicitlyNotUsed =
    rawTextbookId === TEXTBOOK_NOT_USED_OPTION_VALUE || rawTextbookName === '해당 없음'

  if (isExplicitlyNotUsed) {
    return {
      textbookName: '해당 없음',
      textbookGrade: params.textbookGrade ?? '',
      textbookKits: params.textbookKits ?? null,
      textbookQuantity: params.textbookQuantity ?? null,
    }
  }

  if (rawTextbookId || rawTextbookName) {
    const storeRow = rawTextbookId
      ? catalogSource.find(row => row.id === rawTextbookId)
      : catalogSource.find(row => row.textbookName.trim() === rawTextbookName)
    const grade =
      params.textbookGrade?.trim() || (storeRow ? resolveTextbookGradeLabel(storeRow) : '')
    const displayName = storeRow
      ? resolveIndividualTextbookOptionLabel(storeRow)
      : rawTextbookName || '해당 없음'

    return {
      textbookId: rawTextbookId || storeRow?.id,
      textbookName: displayName,
      textbookGrade: grade,
      textbookKits: params.textbookKits ?? null,
      textbookQuantity: params.textbookQuantity ?? null,
    }
  }
  return {
    textbookName: '해당 없음',
    textbookGrade: params.textbookGrade ?? '',
    textbookKits: params.textbookKits ?? null,
    textbookQuantity: params.textbookQuantity ?? null,
  }
}
