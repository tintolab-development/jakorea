import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import { listTextbooksFromStore } from '@/features/textbook/api/textbook-service'
import type { Program } from '@/types/domain'
import { isGeneralProgramScheduleType } from '@/features/program/general/model/common-info-edit-schema'
import {
  dedupeTextbooksByName,
  filterTextbooksForApplicant,
  resolveIndividualTextbookOptionLabel,
  resolveProgramEducationTargets,
} from '@/features/program/general/lib/filter-textbooks-for-applicant'
import { TEXTBOOK_NOT_USED_OPTION_VALUE } from '@/features/program/general/lib/individual-applicant-textbook'
import type { TextbookSelectOption } from '@/features/program/general/hooks/use-applicant-institution-detail-edit'

function listUsedTextbooksForProgram(program: Program, catalog?: TextbookRow[]): TextbookRow[] {
  // undefined = 아직 원격 미도착 → sync store 폴백. [] = 로드 완료·교재 없음.
  if (catalog !== undefined) return catalog
  const educationTargets = resolveProgramEducationTargets(program)
  return listTextbooksFromStore().filter(row => {
    if (row.useStatus !== 'USED') return false
    if (program.businessArea && row.businessArea !== program.businessArea) return false
    if (educationTargets.length > 0 && !educationTargets.includes(row.educationTarget)) {
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

/** 합반 수정: 사업 분야·교육 대상 동일, 교재 학년만 다른 옵션 */
export function filterTextbooksForCombinedClassEdit(
  program: Program,
  catalog?: TextbookRow[]
): TextbookRow[] {
  return dedupeTextbooksByName(listUsedTextbooksForProgram(program, catalog))
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
 * 1) 사업분야+교육대상+신청학년 matches (전학년 교재 포함)
 * 2) 학년 매칭이 비면 사업분야(+교육대상) 프로그램 교재로 폴백
 * 프로그램 교재 배정 목록은 신청 교재의 허용 목록으로 사용하지 않는다.
 */
export function buildParticipatingInstitutionTextbookSelectOptions(params: {
  program: Program
  educationGrade: string
  gradeCatalog?: TextbookRow[]
  programCatalog?: TextbookRow[]
}): TextbookSelectOption[] {
  const notUsed: TextbookSelectOption = {
    value: TEXTBOOK_NOT_USED_OPTION_VALUE,
    label: '해당 없음',
    textbookName: '해당 없음',
  }
  const { program, educationGrade, gradeCatalog, programCatalog } = params

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
