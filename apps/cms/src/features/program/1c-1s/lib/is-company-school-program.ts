import type { Program } from '@/types/domain'

/** Backend Primary SoT ONE-01/02/03 */
export const COMPANY_SCHOOL_PRIMARY_PROGRAM_IDS = ['170001', '170002', '170003'] as const

export type CompanySchoolPrimaryProgramId = (typeof COMPANY_SCHOOL_PRIMARY_PROGRAM_IDS)[number]

export function isCompanySchoolPrimaryProgramId(programId: string | null | undefined): boolean {
  if (!programId) return false
  return (COMPANY_SCHOOL_PRIMARY_PROGRAM_IDS as readonly string[]).includes(String(programId))
}

/** mock·local·Primary·제목 휴리스틱 (원격 숫자 id는 Primary 집합·제목·라우트와 병행) */
export function isCompanySchoolProgram(
  program: Pick<Program, 'id' | 'title' | 'mainTitle'> | null | undefined
): boolean {
  if (!program?.id) return false
  const id = String(program.id)
  return (
    isCompanySchoolPrimaryProgramId(id) ||
    id.startsWith('economy-prog-') ||
    id.startsWith('company-school-prog-') ||
    id.startsWith('company-school-local-') ||
    id.startsWith('company-school-primary-') ||
    program.mainTitle?.includes('1사1교') === true ||
    program.title?.includes('1사1교') === true ||
    program.mainTitle?.startsWith('ONE-0') === true ||
    program.title?.includes('ONE-0') === true
  )
}
