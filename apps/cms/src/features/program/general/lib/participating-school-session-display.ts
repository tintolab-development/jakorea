import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import type { ApplicantSessionLineInput } from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-session-format'
import { resolveEffectiveGeneralProgramTypeFields } from '@/features/program/general/lib/curriculum-display'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import { resolveInstitutionApplicationSessionPeriodPart } from '@/features/program/general/lib/institution-application-session-display'
import { resolveInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
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

function participatingSchoolSessionToApplicantInput(
  s: ParticipatingSchoolSession
): ApplicantSessionLineInput {
  return {
    date: s.date,
    dayOfWeek: s.dayOfWeek,
    duration: s.duration,
    format: s.format,
    classNum: s.classNum,
    timeRange: s.timeRange,
    round: s.round,
  }
}

function resolveVolunteerAssignmentSessionName(
  s: ParticipatingSchoolSession,
  program: Program
): string | undefined {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const { sessionRound, educationStructure } = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
  })

  if (sessionRound === 'single') return undefined

  if (educationStructure === 'schedule') {
    const label = resolveParticipatingInstitutionScheduleRowLabel(program, s)
    return label === '교육 일정' ? undefined : label
  }

  const bridge = resolveInstitutionApplicationProgramBridge(program)
  const periodPart = resolveInstitutionApplicationSessionPeriodPart(
    participatingSchoolSessionToApplicantInput(s),
    bridge
  )
  if (periodPart) return periodPart

  const label = resolveParticipatingInstitutionScheduleRowLabel(program, s)
  return label === '교육 일정' ? undefined : label
}

/**
 * 참여 봉사자 배정 현황 — 날짜 / 진행 시간 / 교육 차시·회차(또는 일정명)
 * - 단일 회차: 차시·회차 생략
 * - 일정형 + 복수 회차: 일정명
 * - 진행 시간·차시·회차 없을 수 있음(희망 일정)
 */
export function formatVolunteerAssignmentScheduleLine(
  s: ParticipatingSchoolSession,
  program?: Program
): string {
  const datePart = s.date.replace(/\./g, '. ')
  const dateWithDow = `${datePart}(${s.dayOfWeek})`

  const timeRange = s.timeRange?.trim()
  let timePart = ''
  if (timeRange) {
    const [startRaw, endRaw] = timeRange.split('~')
    timePart = `${padTimePart(startRaw)} ~ ${padTimePart(endRaw ?? startRaw)}`
  }

  if (!program) {
    const base = timePart ? `${dateWithDow} ${timePart}` : dateWithDow
    if (s.round) return `${base} | ${s.round}차시`
    return base
  }

  const { sessionRound } = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: program.generalCommonInfo?.curriculumSessions ?? null,
  })

  const sessionName =
    sessionRound === 'single' ? undefined : resolveVolunteerAssignmentSessionName(s, program)

  if (timePart && sessionName) return `${dateWithDow} ${timePart} | ${sessionName}`
  if (timePart) return `${dateWithDow} ${timePart}`
  if (sessionName) return `${dateWithDow} | ${sessionName}`
  return dateWithDow
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
