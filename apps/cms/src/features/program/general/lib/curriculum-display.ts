import type {
  GeneralProgramAudienceKind,
  GeneralProgramEducationStructure,
  GeneralProgramSessionRoundKind,
  GeneralProgramCurriculumSessionRow,
} from '@/types/domain'
import { resolveGeneralProgramVariantFromProgram } from '@/features/program/general/lib/variant'

/** Program·commonInfo·커리큘럼 차시에서 유형 필드 보강 (mock seed 누락·구버전 데이터 대비) */
export function resolveEffectiveGeneralProgramTypeFields(input: {
  generalProgramAudience?: GeneralProgramAudienceKind | null
  generalProgramEducationStructure?: GeneralProgramEducationStructure | null
  generalProgramSessionRound?: GeneralProgramSessionRoundKind | null
  curriculumSessions?: GeneralProgramCurriculumSessionRow[] | null
}): {
  audience: GeneralProgramAudienceKind
  educationStructure: GeneralProgramEducationStructure
  sessionRound: GeneralProgramSessionRoundKind
} {
  const variant = resolveGeneralProgramVariantFromProgram({
    generalProgramAudience: input.generalProgramAudience ?? undefined,
    generalProgramEducationStructure: input.generalProgramEducationStructure ?? undefined,
    generalProgramSessionRound: input.generalProgramSessionRound ?? undefined,
  })
  const sessions = input.curriculumSessions ?? []

  const educationStructure =
    input.generalProgramEducationStructure ??
    variant?.educationStructure ??
    (sessions.length > 0 ? 'curriculum' : 'curriculum')

  const sessionRound =
    input.generalProgramSessionRound ??
    variant?.sessionRound ??
    (isGeneralProgramMultiRoundCurriculum({
      educationStructure,
      curriculumSessions: sessions,
    })
      ? 'multi'
      : 'single')

  const audience =
    input.generalProgramAudience ??
    variant?.audience ??
    'organization'

  return { audience, educationStructure, sessionRound }
}

export function isGeneralProgramMultiRoundCurriculum(input: {
  educationStructure?: GeneralProgramEducationStructure | null
  sessionRound?: GeneralProgramSessionRoundKind | null
  curriculumSessions?: GeneralProgramCurriculumSessionRow[] | null
}): boolean {
  if (input.educationStructure === 'schedule') return false
  if (input.sessionRound === 'multi') return true
  if (input.sessionRound === 'single') return false

  const sessions = input.curriculumSessions ?? []
  return sessions.some(session => /회차/.test(session.sessionLabel ?? ''))
}

export function formatGeneralProgramCurriculumAssignmentView(
  assignmentEnabled?: boolean,
  assignmentPeriod?: string
): { status: string; period?: string } {
  if (!assignmentEnabled) return { status: '없음' }
  const period = assignmentPeriod?.trim()
  if (!period) return { status: '있음' }
  return { status: '있음', period }
}
