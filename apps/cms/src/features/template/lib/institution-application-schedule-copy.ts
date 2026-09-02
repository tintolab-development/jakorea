import type { InstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'

const FIXED_SCHEDULE_DESCRIPTION_SINGLE_ROUND =
  '진행 가능한 일정을 모두 선택해 주세요. 모두 동일한 커리큘럼이며, 선택한 일정 중 1타임에 배정됩니다.'

const FIXED_SCHEDULE_DESCRIPTION_MULTI_ROUND =
  'N차시*N회로 구성된 프로그램입니다. 진행 가능한 일정을 모두 선택해 주세요.'

/** 날짜 지정 — 고정 일정 체크박스 안내 문구 */
export function resolveInstitutionFixedScheduleDescription(
  bridge: InstitutionApplicationProgramBridge
): string {
  if (bridge.sessionRound === 'multi') {
    return FIXED_SCHEDULE_DESCRIPTION_MULTI_ROUND
  }
  return FIXED_SCHEDULE_DESCRIPTION_SINGLE_ROUND
}
