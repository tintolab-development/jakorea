import type { Program } from '@/types/domain'

export type ProgramKpiTargets = {
  finalParticipants?: number
  instructorCount?: number
  volunteerCount?: number
  finalSchools?: number
  finalClasses?: number
}

/** 등록·상세 JSON·top-level 컬럼에서 KPI 목표값을 읽는다 (대시보드 KPI API와 별개). */
export function resolveProgramKpiTargets(
  program: Program | null | undefined
): ProgramKpiTargets {
  const kpi = program?.generalCommonInfo?.kpi
  return {
    finalParticipants:
      kpi?.finalParticipants ??
      program?.totalParticipants ??
      program?.approvedStudentCount ??
      undefined,
    instructorCount: kpi?.instructorCount ?? program?.instructors ?? undefined,
    volunteerCount: kpi?.volunteerCount ?? program?.generalVolunteers ?? undefined,
    finalSchools: kpi?.finalSchools ?? program?.participatingSchoolCount ?? undefined,
    finalClasses: kpi?.finalClasses ?? undefined,
  }
}

export function hasProgramKpiTargets(targets: ProgramKpiTargets): boolean {
  return Object.values(targets).some(value => value != null && Number.isFinite(Number(value)))
}
