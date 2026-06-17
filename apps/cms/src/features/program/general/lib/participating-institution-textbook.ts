import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import { listTextbooksFromStore } from '@/features/textbook/api/textbook-service'
import type { Program, TargetLevel } from '@/types/domain'
import { isGeneralProgramScheduleType } from '@/features/program/general/model/common-info-edit-schema'
import {
  dedupeTextbooksByName,
  filterTextbooksForApplicant,
  resolveProgramEducationTarget,
} from '@/features/program/general/lib/filter-textbooks-for-applicant'

/** 초등·중학 키트당 권수 */
export const PARTICIPATING_TEXTBOOK_BOOKS_PER_KIT_ELEMENTARY = 24
/** 고등·대학 키트당 권수 */
export const PARTICIPATING_TEXTBOOK_BOOKS_PER_KIT_SECONDARY = 32

export type ParticipatingTextbookKitQuantity = {
  textbookKits: number
  textbookQuantity: number
}

function getBooksPerKitForTargetLevel(targetLevel?: TargetLevel): number {
  if (targetLevel === 'high' || targetLevel === 'university') {
    return PARTICIPATING_TEXTBOOK_BOOKS_PER_KIT_SECONDARY
  }
  return PARTICIPATING_TEXTBOOK_BOOKS_PER_KIT_ELEMENTARY
}

/** 프로그램 대상 구분 기준 키트당 권수 (초·중 24 / 고·대 32) */
export function getParticipatingTextbookBooksPerKit(program: Program): number {
  return getBooksPerKitForTargetLevel(program.targetLevel)
}

/** 총 인원 기준 키트 수·권수 자동 산출 */
export function calculateParticipatingTextbookKitQuantity(
  program: Program,
  studentCount: number
): ParticipatingTextbookKitQuantity {
  const booksPerKit = getParticipatingTextbookBooksPerKit(program)
  const textbookKits = studentCount > 0 ? Math.ceil(studentCount / booksPerKit) : 0
  const textbookQuantity = textbookKits * booksPerKit
  return { textbookKits, textbookQuantity }
}

function listUsedTextbooksForProgram(program: Program): TextbookRow[] {
  const educationTarget = resolveProgramEducationTarget(program)
  return listTextbooksFromStore().filter(row => {
    if (row.useStatus !== 'USED') return false
    if (program.businessArea && row.businessArea !== program.businessArea) return false
    if (educationTarget && row.educationTarget !== educationTarget) return false
    return true
  })
}

/** 사업 분야·교육 대상에 맞는 사용 중 교재가 카탈로그에 있는지 (일정형 여부 무관) */
export function programHasTextbookCatalog(program: Program): boolean {
  return dedupeTextbooksByName(listUsedTextbooksForProgram(program)).length > 0
}

/** 교재 카탈로그·일정형이 아닌 일반 프로그램에 교재 정보 노출 여부 */
export function programUsesTextbook(program: Program): boolean {
  if (isGeneralProgramScheduleType(program)) return false
  return programHasTextbookCatalog(program)
}

/** 사업 분야·교육 학년에 맞는 기본 교재 (첫 매칭) */
export function resolveTextbookForEducationGrade(
  program: Program,
  educationGrade: string
): TextbookRow | null {
  const matches = filterTextbooksForApplicant(program, educationGrade)
  return matches[0] ?? null
}

/** 합반 수정: 사업 분야·교육 대상 동일, 교재 학년만 다른 옵션 */
export function filterTextbooksForCombinedClassEdit(program: Program): TextbookRow[] {
  return dedupeTextbooksByName(listUsedTextbooksForProgram(program))
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
    studentCount
  )
  return {
    textbookId: textbook.id,
    textbookName: textbook.textbookName,
    textbookGrade: resolveTextbookGradeLabel(textbook),
    textbookKits,
    textbookQuantity,
  }
}

/** 저장·조회용 교재 표시값 (미저장 시 학년 기준 자동 매칭) */
export function resolveParticipatingInstitutionTextbookDisplay(params: {
  program: Program
  educationGrade: string
  studentCount: number
  textbookId?: string
  textbookName?: string
  textbookGrade?: string
  textbookKits?: number
  textbookQuantity?: number
}): {
  textbookId?: string
  textbookName: string
  textbookGrade: string
  textbookKits: number
  textbookQuantity: number
} {
  const auto = resolveTextbookForEducationGrade(params.program, params.educationGrade)
  const kitsFromCount = calculateParticipatingTextbookKitQuantity(
    params.program,
    params.studentCount
  )

  if (params.textbookId || params.textbookName?.trim()) {
    const storeRow = params.textbookId
      ? listTextbooksFromStore().find(row => row.id === params.textbookId)
      : listTextbooksFromStore().find(
          row => row.textbookName.trim() === params.textbookName?.trim()
        )
    const grade =
      params.textbookGrade?.trim() ||
      (storeRow ? resolveTextbookGradeLabel(storeRow) : params.educationGrade)

    return {
      textbookId: params.textbookId ?? storeRow?.id,
      textbookName: params.textbookName?.trim() || storeRow?.textbookName || auto?.textbookName || '-',
      textbookGrade: grade,
      textbookKits: params.textbookKits ?? kitsFromCount.textbookKits,
      textbookQuantity: params.textbookQuantity ?? kitsFromCount.textbookQuantity,
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

  return {
    textbookName: '-',
    textbookGrade: params.educationGrade,
    textbookKits: kitsFromCount.textbookKits,
    textbookQuantity: kitsFromCount.textbookQuantity,
  }
}
