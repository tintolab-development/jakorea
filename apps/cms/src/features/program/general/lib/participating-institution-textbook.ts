import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import { listTextbooksFromStore } from '@/features/textbook/api/textbook-service'
import type { Program, TargetLevel } from '@/types/domain'
import { isGeneralProgramScheduleType } from '@/features/program/general/model/common-info-edit-schema'
import {
  dedupeTextbooksByName,
  filterTextbooksForApplicant,
  resolveIndividualTextbookOptionLabel,
  resolveProgramEducationTargets,
} from '@/features/program/general/lib/filter-textbooks-for-applicant'
import { TEXTBOOK_NOT_USED_OPTION_VALUE } from '@/features/program/general/lib/individual-applicant-textbook'
import type { TextbookSelectOption } from '@/features/program/general/hooks/use-applicant-institution-detail-edit'

/** 초등·중학 키트당 권수 */
export const PARTICIPATING_TEXTBOOK_BOOKS_PER_KIT_ELEMENTARY = 24
/** 고등·대학 키트당 권수 */
export const PARTICIPATING_TEXTBOOK_BOOKS_PER_KIT_SECONDARY = 32

export type ParticipatingTextbookKitQuantity = {
  textbookKits: number
  textbookQuantity: number
}

function getBooksPerKitForEducationTarget(educationTarget?: string | null): number | null {
  if (!educationTarget) return null
  if (educationTarget === '고등학교' || educationTarget === '대학교') {
    return PARTICIPATING_TEXTBOOK_BOOKS_PER_KIT_SECONDARY
  }
  if (
    educationTarget === '유아' ||
    educationTarget === '초등학교' ||
    educationTarget === '중학교'
  ) {
    return PARTICIPATING_TEXTBOOK_BOOKS_PER_KIT_ELEMENTARY
  }
  return null
}

function getBooksPerKitForTargetLevel(targetLevel?: TargetLevel): number {
  if (targetLevel === 'high' || targetLevel === 'university') {
    return PARTICIPATING_TEXTBOOK_BOOKS_PER_KIT_SECONDARY
  }
  return PARTICIPATING_TEXTBOOK_BOOKS_PER_KIT_ELEMENTARY
}

/** 프로그램·교육대상 기준 키트당 권수 (초·중 24 / 고·대 32) */
export function getParticipatingTextbookBooksPerKit(
  program: Program,
  educationTarget?: string | null
): number {
  const fromTarget = getBooksPerKitForEducationTarget(educationTarget)
  if (fromTarget != null) return fromTarget
  return getBooksPerKitForTargetLevel(program.targetLevel)
}

/** 등록 학생 수·학년(교육대상) 기준 키트 수·권수 자동 산출 */
export function calculateParticipatingTextbookKitQuantity(
  program: Program,
  studentCount: number,
  educationTarget?: string | null
): ParticipatingTextbookKitQuantity {
  const booksPerKit = getParticipatingTextbookBooksPerKit(program, educationTarget)
  const textbookKits = studentCount > 0 ? Math.ceil(studentCount / booksPerKit) : 0
  const textbookQuantity = textbookKits * booksPerKit
  return { textbookKits, textbookQuantity }
}

function listUsedTextbooksForProgram(program: Program, catalog?: TextbookRow[]): TextbookRow[] {
  // undefined = 아직 원격 미도착 → sync store 폴백. [] = 로드 완료·교재 없음.
  if (catalog !== undefined) return catalog
  const educationTargets = resolveProgramEducationTargets(program)
  return listTextbooksFromStore().filter(row => {
    if (row.useStatus !== 'USED') return false
    if (program.businessArea && row.businessArea !== program.businessArea) return false
    if (
      educationTargets.length > 0 &&
      !educationTargets.includes(row.educationTarget)
    ) {
      return false
    }
    return true
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

/** 사업 분야·교육 학년에 맞는 기본 교재 (첫 매칭) */
export function resolveTextbookForEducationGrade(
  program: Program,
  educationGrade: string,
  catalog?: TextbookRow[]
): TextbookRow | null {
  const matches = filterTextbooksForApplicant(program, educationGrade, catalog)
  return matches[0] ?? null
}

/** 합반 수정: 사업 분야·교육 대상 동일, 교재 학년만 다른 옵션 */
export function filterTextbooksForCombinedClassEdit(
  program: Program,
  catalog?: TextbookRow[]
): TextbookRow[] {
  return dedupeTextbooksByName(listUsedTextbooksForProgram(program, catalog))
}

/**
 * 합반 신청 시 교재 셀렉 — 합반용 카탈로그 ∩ materials.
 * 라벨·「해당 없음」은 개인/기관 셀렉과 동일.
 */
export function buildCombinedClassTextbookSelectOptions(
  program: Program,
  catalog?: TextbookRow[],
  programMaterialTextbookIds?: ReadonlySet<string> | null
): TextbookSelectOption[] {
  const rows = filterTextbooksForCombinedClassEdit(program, catalog).filter(row => {
    if (programMaterialTextbookIds == null) return true
    if (programMaterialTextbookIds.size === 0) return false
    return programMaterialTextbookIds.has(row.id)
  })

  return [
    {
      value: TEXTBOOK_NOT_USED_OPTION_VALUE,
      label: '해당 없음',
      textbookName: '해당 없음',
    },
    ...rows.map(row => ({
      value: row.id,
      label: resolveIndividualTextbookOptionLabel(row),
      textbookName: row.textbookName,
    })),
  ]
}

/**
 * 진행 현황 참여 기관 교재 셀렉.
 * 1) 사업분야+교육대상+신청학년 matches
 * 2) 학년 매칭이 비면 사업분야(+교육대상) 프로그램 교재로 폴백
 * materials가 비어 있으면 교집합하지 않는다.
 */
export function buildParticipatingInstitutionTextbookSelectOptions(params: {
  program: Program
  educationGrade: string
  gradeCatalog?: TextbookRow[]
  programCatalog?: TextbookRow[]
  programMaterialTextbookIds?: ReadonlySet<string> | null
}): TextbookSelectOption[] {
  const notUsed: TextbookSelectOption = {
    value: TEXTBOOK_NOT_USED_OPTION_VALUE,
    label: '해당 없음',
    textbookName: '해당 없음',
  }
  const { program, educationGrade, gradeCatalog, programCatalog, programMaterialTextbookIds } =
    params

  if (gradeCatalog === undefined && programCatalog === undefined) {
    return [notUsed]
  }

  const grade = educationGrade.trim()
  let rows: TextbookRow[] = []
  if (grade && gradeCatalog !== undefined) {
    rows = filterTextbooksForApplicant(program, grade, gradeCatalog)
  }
  if (rows.length === 0) {
    const fallbackSource =
      programCatalog !== undefined
        ? programCatalog
        : gradeCatalog !== undefined
          ? gradeCatalog
          : undefined
    if (fallbackSource === undefined) return [notUsed]
    rows = filterTextbooksForCombinedClassEdit(program, fallbackSource)
  }

  const materialFilter =
    programMaterialTextbookIds != null && programMaterialTextbookIds.size > 0
      ? programMaterialTextbookIds
      : null
  if (materialFilter) {
    rows = rows.filter(row => materialFilter.has(row.id))
  }

  return [
    notUsed,
    ...dedupeTextbooksByName(rows).map(row => ({
      value: row.id,
      label: resolveIndividualTextbookOptionLabel(row),
      textbookName: row.textbookName,
    })),
  ]
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

export function resolveTextbookFieldsFromSelection(
  program: Program,
  textbook: TextbookRow,
  studentCount: number
): {
  textbookId: string
  textbookName: string
  textbookGrade: string
  textbookKits: number
  textbookQuantity: number
} {
  const { textbookKits, textbookQuantity } = calculateParticipatingTextbookKitQuantity(
    program,
    studentCount,
    textbook.educationTarget
  )
  return {
    textbookId: textbook.id,
    textbookName: textbook.textbookName,
    textbookGrade: resolveTextbookGradeLabel(textbook),
    textbookKits,
    textbookQuantity,
  }
}

/** 저장·조회용 교재 표시값 — 준비 수량은 등록 학생 수·학년으로 항상 자동 산출 */
export function resolveParticipatingInstitutionTextbookDisplay(params: {
  program: Program
  educationGrade: string
  studentCount: number
  textbookId?: string
  textbookName?: string
  textbookGrade?: string
  textbookKits?: number
  textbookQuantity?: number
  catalog?: TextbookRow[]
}): {
  textbookId?: string
  textbookName: string
  textbookGrade: string
  textbookKits: number
  textbookQuantity: number
} {
  const auto = resolveTextbookForEducationGrade(
    params.program,
    params.educationGrade,
    params.catalog
  )
  const catalogSource = params.catalog ?? listTextbooksFromStore()

  const rawTextbookId = params.textbookId?.trim()
  const rawTextbookName = params.textbookName?.trim()
  const isExplicitlyNotUsed =
    rawTextbookId === TEXTBOOK_NOT_USED_OPTION_VALUE || rawTextbookName === '해당 없음'

  if (isExplicitlyNotUsed) {
    return {
      textbookName: '해당 없음',
      textbookGrade: params.educationGrade,
      textbookKits: 0,
      textbookQuantity: 0,
    }
  }

  if (rawTextbookId || rawTextbookName) {
    const storeRow = rawTextbookId
      ? catalogSource.find(row => row.id === rawTextbookId)
      : catalogSource.find(row => row.textbookName.trim() === rawTextbookName)
    const grade =
      params.textbookGrade?.trim() ||
      (storeRow ? resolveTextbookGradeLabel(storeRow) : params.educationGrade)
    const kitsFromCount = calculateParticipatingTextbookKitQuantity(
      params.program,
      params.studentCount,
      storeRow?.educationTarget ?? auto?.educationTarget
    )
    const displayName = storeRow
      ? resolveIndividualTextbookOptionLabel(storeRow)
      : rawTextbookName || auto?.textbookName || '해당 없음'

    return {
      textbookId: rawTextbookId || storeRow?.id,
      textbookName: displayName,
      textbookGrade: grade,
      textbookKits: kitsFromCount.textbookKits,
      textbookQuantity: kitsFromCount.textbookQuantity,
    }
  }

  if (auto) {
    const fromAuto = resolveTextbookFieldsFromSelection(
      params.program,
      auto,
      params.studentCount
    )
    return {
      textbookId: fromAuto.textbookId,
      textbookName: fromAuto.textbookName,
      textbookGrade: fromAuto.textbookGrade,
      textbookKits: fromAuto.textbookKits,
      textbookQuantity: fromAuto.textbookQuantity,
    }
  }

  const kitsFromCount = calculateParticipatingTextbookKitQuantity(
    params.program,
    params.studentCount
  )
  return {
    textbookName: '-',
    textbookGrade: params.educationGrade,
    textbookKits: kitsFromCount.textbookKits,
    textbookQuantity: kitsFromCount.textbookQuantity,
  }
}
