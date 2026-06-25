import { listTextbooks } from '@/features/textbook/api/textbook-mock-store'
import type { TextbookRow } from '@/features/textbook/model/textbook.types'
import { resolveProgramEducationTarget } from '@/features/program/general/lib/filter-textbooks-for-applicant'
import type { MatchesParams } from '@/shared/api/generated/data-management/schemas'
import type { Program } from '@/types/domain'

export function buildTextbookMatchesParamsFromProgram(program: Program): MatchesParams {
  const educationTarget = resolveProgramEducationTarget(program)
  return {
    businessArea: program.businessArea || undefined,
    educationTarget: educationTarget || undefined,
  }
}

export function serializeProgramTextbookCatalogKey(program: Program): string {
  const params = buildTextbookMatchesParamsFromProgram(program)
  return `${params.businessArea ?? ''}|${params.educationTarget ?? ''}`
}

/** API 비활성 시 프로그램 폼용 mock 교재 카탈로그 */
export function listMockTextbookCatalogForProgram(program: Program): TextbookRow[] {
  const educationTarget = resolveProgramEducationTarget(program)
  return listTextbooks().filter(row => {
    if (row.useStatus !== 'USED') return false
    if (program.businessArea && row.businessArea !== program.businessArea) return false
    if (educationTarget && row.educationTarget !== educationTarget) return false
    return true
  })
}
