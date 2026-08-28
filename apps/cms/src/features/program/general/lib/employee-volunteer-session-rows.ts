import { resolveEffectiveGeneralProgramTypeFields } from '@/features/program/general/lib/curriculum-display'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
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

/**
 * 프로그램 교육 구조(일정형/커리큘럼형·단일/복수 회차)에 따라 모달 일정 행을 결정한다.
 * - 단일 회차: 일정/커리큘럼형 무관 `프로그램 진행` 1행
 * - 복수 회차 + 사전교육 설정: `사전교육` 선행
 * - 일정형: scheduleDetails[].name (없으면 scheduleLabel → 세부 일정 NN)
 * - 커리큘럼형: curriculumSessions[].sessionLabel (없으면 N회차 교육)
 */
export function resolveEmployeeVolunteerSessionRows(program: Program): EmployeeVolunteerSessionRow[] {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const { educationStructure, sessionRound } = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
  })

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
    const count = Math.max(details.length, 1)
    for (let index = 0; index < count; index += 1) {
      const detail = details[index]
      if (detail?.scheduleLabel?.includes('사전 교육')) continue
      const name = detail?.name?.trim()
      const scheduleLabel = detail?.scheduleLabel?.trim()
      const label = name || scheduleLabel || `세부 일정 ${String(index + 1).padStart(2, '0')}`
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

  const sessions = commonInfo.curriculumSessions ?? []
  const count = Math.max(sessions.length, 1)
  for (let index = 0; index < count; index += 1) {
    const sessionLabel = sessions[index]?.sessionLabel?.trim()
    const label = sessionLabel || `${index + 1}회차 교육`
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
