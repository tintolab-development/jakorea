import { resolveEffectiveGeneralProgramTypeFields } from '@/features/program/general/lib/curriculum-display'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import { resolveParticipatingProgressAssignedSessions } from '@/features/program/general/lib/organization-education-schedule-sources'
import { formatParticipatingSchoolSessionLine } from '@/features/program/general/lib/participating-school-session-display'
import type { ParticipatingSchoolRow, ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'

/** 임직원 자원봉사자 등록 모달 — 일정 행 식별자 */
export type EmployeeVolunteerSessionRowId = 'pre_education' | 'program_progress' | `round_${number}`

export interface EmployeeVolunteerSessionRow {
  id: EmployeeVolunteerSessionRowId
  label: string
  /** 참여 봉사자 일정 round 매칭용. 사전교육은 `null` */
  round: number | null
  isPreEducation: boolean
  /** 사전교육 일정이면 신규·재참여 모두 총 참가자에 합산 */
  countsTowardParticipants: boolean
}

function buildRoundId(round: number): EmployeeVolunteerSessionRowId {
  return `round_${round}`
}

function formatRoundEducationLabel(roundIndex: number): string {
  return `${roundIndex}회차 교육`
}

/** 기관 + 복수 회차 + 커리큘럼형 — 과목명 대신 N회차 교육으로 표기 (일정형은 실제 일정명) */
function shouldUseRoundIndexLabelsForOrganizationCurriculum(
  audience: Program['generalProgramAudience'],
  sessionRound: 'single' | 'multi',
  educationStructure: 'schedule' | 'curriculum'
): boolean {
  return (
    sessionRound === 'multi' &&
    audience === 'organization' &&
    educationStructure === 'curriculum'
  )
}

/**
 * 프로그램 교육 구조(일정형/커리큘럼형·단일/복수 회차)에 따라 모달 일정 행을 결정한다.
 * - 단일 회차: 일정/커리큘럼형 무관 `프로그램 진행` 1행
 * - 복수 회차 + 사전교육 설정: `사전교육` 선행
 * - 일정형: scheduleDetails[].name (없으면 scheduleLabel → 세부 일정 NN) — 기관·개인 동일
 * - 커리큘럼형: curriculumSessions[].sessionLabel (없으면 N회차 교육)
 * - 기관 + 복수 + 커리큘럼: `N회차 교육` (사전교육은 `사전교육`)
 */
export function resolveEmployeeVolunteerSessionRows(program: Program): EmployeeVolunteerSessionRow[] {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const { educationStructure, sessionRound, audience } = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
  })
  const useRoundIndexLabels = shouldUseRoundIndexLabelsForOrganizationCurriculum(
    audience,
    sessionRound,
    educationStructure
  )

  if (sessionRound === 'single') {
    return [
      {
        id: 'program_progress',
        label: '프로그램 진행',
        round: 1,
        isPreEducation: false,
        countsTowardParticipants: false,
      },
    ]
  }

  const rows: EmployeeVolunteerSessionRow[] = []

  if (commonInfo.scheduleCurriculumPreEducation) {
    rows.push({
      id: 'pre_education',
      label: '사전교육',
      round: null,
      isPreEducation: true,
      countsTowardParticipants: true,
    })
  }

  if (educationStructure === 'schedule') {
    const details = commonInfo.scheduleDetails ?? []
    let roundIndex = 0
    for (let index = 0; index < details.length; index += 1) {
      const detail = details[index]
      if (detail?.scheduleLabel?.includes('사전 교육')) continue
      roundIndex += 1
      const label = useRoundIndexLabels
        ? formatRoundEducationLabel(roundIndex)
        : (() => {
            const name = detail?.name?.trim()
            const scheduleLabel = detail?.scheduleLabel?.trim()
            return name || scheduleLabel || `세부 일정 ${String(roundIndex).padStart(2, '0')}`
          })()
      rows.push({
        id: buildRoundId(roundIndex),
        label,
        round: roundIndex,
        isPreEducation: false,
        countsTowardParticipants: false,
      })
    }
    return rows
  }

  const sessions = commonInfo.curriculumSessions ?? []
  const regularSessions = sessions.filter(
    session => !session.sessionLabel?.includes('사전 교육')
  )
  for (let index = 0; index < regularSessions.length; index += 1) {
    const roundIndex = index + 1
    const sessionLabel = regularSessions[index]?.sessionLabel?.trim()
    const label = useRoundIndexLabels
      ? formatRoundEducationLabel(roundIndex)
      : sessionLabel || formatRoundEducationLabel(roundIndex)
    rows.push({
      id: buildRoundId(index + 1),
      label,
      round: index + 1,
      isPreEducation: false,
      countsTowardParticipants: false,
    })
  }

  return rows
}

function isPreEducationParticipatingSession(session: ParticipatingSchoolSession): boolean {
  const educationLabel = session.educationScheduleLabel?.trim() ?? ''
  const scheduleLabel = session.scheduleLabel?.trim() ?? ''
  return educationLabel.includes('사전') || scheduleLabel.includes('사전')
}

function participatingSessionDisplayLabel(session: ParticipatingSchoolSession): string {
  const educationLabel = session.educationScheduleLabel?.trim()
  if (educationLabel) return educationLabel
  return formatParticipatingSchoolSessionLine(session)
}

/**
 * 기관 프로그램 — 선택 기관의 배정 일정으로 모달 행 라벨을 보강한다.
 * - 단일 회차 `프로그램 진행`: 해당 기관 배정 일정 표시(없으면 프로그램 공통 라벨 유지)
 * - 기관 + 복수 + 커리큘럼 `N회차 교육` 라벨은 스펙상 유지
 * - 그 외 회차 행: 배정 일정의 educationScheduleLabel·일정 문자열이 있으면 우선
 */
export function resolveEmployeeVolunteerSessionRowsForInstitution(
  program: Program,
  school: ParticipatingSchoolRow | undefined
): EmployeeVolunteerSessionRow[] {
  const baseRows = resolveEmployeeVolunteerSessionRows(program)
  if (!school) return baseRows

  const assigned = resolveParticipatingProgressAssignedSessions(school.sessions ?? [])
  if (assigned.length === 0) return baseRows

  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const { educationStructure, sessionRound, audience } = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
  })
  const useRoundIndexLabels = shouldUseRoundIndexLabelsForOrganizationCurriculum(
    audience,
    sessionRound,
    educationStructure
  )

  return baseRows.map(row => {
    if (useRoundIndexLabels && row.round != null && !row.isPreEducation) {
      return row
    }

    if (row.id === 'pre_education') {
      const preSession = assigned.find(isPreEducationParticipatingSession)
      if (!preSession) return row
      return { ...row, label: participatingSessionDisplayLabel(preSession) }
    }

    if (row.id === 'program_progress') {
      const session = assigned.find(s => !isPreEducationParticipatingSession(s)) ?? assigned[0]
      if (!session) return row
      return { ...row, label: participatingSessionDisplayLabel(session) }
    }

    if (row.round != null) {
      const session = assigned.find(s => s.round === row.round)
      if (!session) return row
      return { ...row, label: participatingSessionDisplayLabel(session) }
    }

    return row
  })
}
