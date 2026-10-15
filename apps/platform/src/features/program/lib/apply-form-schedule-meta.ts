import { readCurriculumMultiDateFixedScheduleMeta } from '@jakorea/form-schema/program-application'
import type { ProgramDetail } from '../model/types.ts'

export function readApplyScheduleMetaFromProgram(
  program: Pick<ProgramDetail, 'sessionRound'> & Partial<Pick<ProgramDetail, 'sessions'>>
): {
  educationRoundCount?: number
  sessionsPerRound?: number
  curriculumChartSessionCount?: number
  curriculumSessions?: Array<{ sessionLabel?: string; title?: string }>
} {
  const curriculumSessions = program.sessions?.map(session => ({
    sessionLabel: session.sessionLabel,
    title: session.title,
  }))
  const meta = readCurriculumMultiDateFixedScheduleMeta({ curriculumSessions })
  const curriculumChartSessionCount =
    program.sessionRound === 'single' && curriculumSessions?.length
      ? curriculumSessions.length
      : undefined
  return {
    educationRoundCount: meta.educationRoundCount,
    sessionsPerRound: meta.sessionsPerRound,
    curriculumChartSessionCount,
    curriculumSessions,
  }
}
