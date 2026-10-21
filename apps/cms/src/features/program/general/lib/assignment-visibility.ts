import type { Program } from '@/types/domain'
import { resolveEffectiveGeneralProgramTypeFields } from '@/features/program/general/lib/curriculum-display'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'

/** 일반 개인 프로그램 과제 기능은 복수 회차에서만 제공한다. */
export function shouldShowGeneralIndividualAssignment(program?: Program | null): boolean {
  if (!program || !isGeneralIndividualProgram(program)) return false

  const { sessionRound } = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: program.generalCommonInfo?.curriculumSessions,
    registrationOverlay: program.registrationOverlay,
  })

  return sessionRound === 'multi'
}
