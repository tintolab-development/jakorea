import { resolveEffectiveGeneralProgramTypeFields } from '@/features/program/general/lib/curriculum-display'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import { resolveProgramOperationalBindingKind } from '@/features/program/general/lib/program-operational-binding-profile'
import { resolveEducationScheduleSessionLeadLabel } from '@/features/program/general/lib/school-detail-attendance-display'
import {
  isEducationSchedulePreEducation,
  toDisplayEducationScheduleName,
} from '@/shared/lib/education-schedule-name'
import type {
  GeneralProgramEducationStructure,
  GeneralProgramSessionRoundKind,
  Program,
} from '@/types/domain'

export type GeneralProgramScheduleStructure = {
  educationStructure: GeneralProgramEducationStructure
  sessionRound: GeneralProgramSessionRoundKind
}

/**
 * 일반 프로그램이면 교육 구조(커리큘럼형·일정형 × 단일·복수 회차), 아니면 null.
 * 1사1교·교육받은 교사·UJAT는 null — 호출부는 그 유형의 기존 표기를 유지한다.
 */
export function resolveGeneralProgramScheduleStructure(
  program: Program | null | undefined
): GeneralProgramScheduleStructure | null {
  if (!program || resolveProgramOperationalBindingKind(program) !== 'GENERAL') return null
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const { educationStructure, sessionRound } = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
    registrationOverlay: program.registrationOverlay,
  })
  return { educationStructure, sessionRound }
}

export type GeneralScheduleUnitInput = {
  /** program_schedule.session_no(회차). 배열 순서·지망 순위를 넣지 않는다 */
  sessionNo?: number | null
  /** 일정에 연결된 커리큘럼 차시 수 */
  curriculumSessionCount?: number | null
  scheduleRole?: string | null
  educationSlotKey?: string | null
  /** 서버 일정명. 자동 기본명(`공통 교육 예정 N`)은 쓰지 않는다 */
  scheduleName?: string | null
}

/**
 * 일정 1건의 교육 구조별 단위 라벨. 회차 = 일정 단위(`N회차`), 차시 = 커리큘럼 수업 단위(`N차시`)는 다른 개념이다.
 * - `undefined`: 일반 프로그램이 아님 → 호출부 기존 표기
 * - 사전교육: `사전교육`
 * - 일정형: 서버 세부 일정명 → 없으면 공통정보 세부 일정명({@link resolveEducationScheduleSessionLeadLabel})
 * - 커리큘럼형 단일 회차: `N차시` (회차 표기 없음)
 * - 커리큘럼형 복수 회차: `N회차` (차시 수를 알면 `N회차 (K차시)`)
 * - 알 수 없으면 `null` (지어내지 않는다)
 */
export function resolveGeneralScheduleUnitLabel(
  input: GeneralScheduleUnitInput,
  program: Program | null | undefined
): string | null | undefined {
  const structure = resolveGeneralProgramScheduleStructure(program)
  if (structure == null || program == null) return undefined
  const scheduleRole = input.scheduleRole?.trim() || undefined
  const educationSlotKey = input.educationSlotKey?.trim() || undefined
  if (isEducationSchedulePreEducation({ scheduleRole, educationSlotKey })) {
    return resolveEducationScheduleSessionLeadLabel({ scheduleRole, educationSlotKey }, program)
  }
  if (structure.educationStructure === 'schedule') {
    const scheduleName = toDisplayEducationScheduleName(input.scheduleName)
    if (scheduleName) return scheduleName
  }
  return resolveEducationScheduleSessionLeadLabel(
    {
      sessionNo: input.sessionNo ?? null,
      curriculumSessionCount: input.curriculumSessionCount ?? null,
      scheduleRole,
      educationSlotKey,
    },
    program
  )
}
