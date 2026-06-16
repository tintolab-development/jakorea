import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import { resolveEffectiveGeneralProgramTypeFields } from '@/features/program/general/lib/curriculum-display'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import { resolveSchoolDetailAttendanceSessionLeadLabel } from '@/features/program/general/lib/school-detail-attendance-display'
import type { Program } from '@/types/domain'

function padTimePart(part: string): string {
  const trimmed = part.trim()
  const [h, m = '00'] = trimmed.split(':')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

/** 스크린샷 형식: YYYY. MM. DD(요일) HH:mm ~ HH:mm | N차시 */
export function formatParticipatingSchoolSessionLine(s: ParticipatingSchoolSession): string {
  const datePart = s.date.replace(/\./g, '. ')
  const [startRaw, endRaw] = s.timeRange.split('~')
  const timePart = `${padTimePart(startRaw)} ~ ${padTimePart(endRaw ?? startRaw)}`
  return `${datePart}(${s.dayOfWeek}) ${timePart} | ${s.round}차시`
}

/** 참여 봉사자 배정 현황 — 단일 회차 프로그램은 차시/회차 생략 */
export function formatVolunteerAssignmentScheduleLine(
  s: ParticipatingSchoolSession,
  program?: Program
): string {
  const datePart = s.date.replace(/\./g, '. ')
  const [startRaw, endRaw] = s.timeRange.split('~')
  const timePart = `${padTimePart(startRaw)} ~ ${padTimePart(endRaw ?? startRaw)}`
  const base = `${datePart}(${s.dayOfWeek}) ${timePart}`

  if (!program) {
    return `${base} | ${s.round}차시`
  }

  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const { sessionRound } = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
  })

  if (sessionRound === 'single') {
    return base
  }

  return `${base} | ${s.round}차시`
}

export function buildParticipatingSchoolSessionLines(
  sessions: ParticipatingSchoolSession[] | undefined
): string[] {
  if (!sessions?.length) return []
  return sessions.map(formatParticipatingSchoolSessionLine)
}

/**
 * 참여 기관 상세 — 교육 진행 일정 행 라벨 (진행 내용 기준)
 * - 단일 회차: 교육 일정
 * - 복수 회차 + 커리큘럼형: 회차명 (curriculumSessions[].sessionLabel)
 * - 복수 회차 + 일정형: 일정명 (scheduleDetails[].name)
 */
export function resolveParticipatingInstitutionScheduleRowLabel(
  program: Program,
  session: ParticipatingSchoolSession
): string {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const { sessionRound } = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
  })

  if (sessionRound === 'single') {
    return '교육 일정'
  }

  return resolveSchoolDetailAttendanceSessionLeadLabel(program, session.round)
}
