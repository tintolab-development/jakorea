import type { Program } from '@/types/domain'

/** 합반 API가 허용하는 유일한 BE programType */
export const GENERAL_ORGANIZATION_PROGRAM_TYPE = 'GENERAL_ORGANIZATION'

export function isGeneralOrganizationProgramType(
  programType: string | null | undefined
): boolean {
  return programType?.trim().toUpperCase() === GENERAL_ORGANIZATION_PROGRAM_TYPE
}

export function isGeneralOrganizationProgram(
  program: Pick<Program, 'backendProgramType'> | null | undefined
): boolean {
  return isGeneralOrganizationProgramType(program?.backendProgramType)
}
