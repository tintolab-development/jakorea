import type { Program } from '@/types/domain'

/** Backend Primary SoT ONE-01/02/03 */
export const COMPANY_SCHOOL_PRIMARY_PROGRAM_IDS = ['170001', '170002', '170003'] as const

export type CompanySchoolPrimaryProgramId = (typeof COMPANY_SCHOOL_PRIMARY_PROGRAM_IDS)[number]

export function isCompanySchoolPrimaryProgramId(programId: string | null | undefined): boolean {
  if (!programId) return false
  return (COMPANY_SCHOOL_PRIMARY_PROGRAM_IDS as readonly string[]).includes(String(programId))
}

function isCompanySchoolBackendType(type: string | undefined): boolean {
  const normalized = type?.trim().toUpperCase()
  return normalized === 'COMPANY_SCHOOL' || normalized === 'ONE_COMPANY_ONE_SCHOOL'
}

/** mock·local·Primary·backendProgramType (제목 휴리스틱 없음) */
export function isCompanySchoolProgram(
  program: Pick<Program, 'id' | 'backendProgramType'> | null | undefined
): boolean {
  if (!program?.id) return false
  if (isCompanySchoolBackendType(program.backendProgramType)) return true
  const id = String(program.id)
  return (
    isCompanySchoolPrimaryProgramId(id) ||
    id.startsWith('economy-prog-') ||
    id.startsWith('company-school-prog-') ||
    id.startsWith('company-school-local-') ||
    id.startsWith('company-school-primary-')
  )
}
