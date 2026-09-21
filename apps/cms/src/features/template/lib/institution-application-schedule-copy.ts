import type { InstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import {
  shouldShowInstitutionApplicationMaxSessionsPerDayField,
  shouldShowInstitutionApplicationPreferredScheduleParagraph,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { clampInstitutionScheduleBlockCount } from '@/features/template/lib/participant-recruitment-institution-limits'

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

function countOrN(value: number | undefined): string {
  return value != null && value > 0 ? String(value) : 'N'
}

/**
 * 커리큘럼형 + 복수 회차 + 기간 지정 — 희망 교육 일정 카드 설명.
 * 모집 상한이 없으면 시안과 같이 `N`으로 둔다.
 */
export function resolveInstitutionPreferredScheduleDescription(
  bridge: InstitutionApplicationProgramBridge
): string {
  const sessions = countOrN(bridge.maxSessionsPerDay)
  const max = countOrN(bridge.maxScheduleCount)
  return `교육을 희망하는 날짜와 수업 시간을 모두 작성해 주세요. 수업은 1일, ${sessions}차시 운영됩니다. (최대 ${max}개까지 희망 일정 신청이 가능합니다.)`
}

export function shouldUseInstitutionPreferredScheduleCardCopy(
  bridge: InstitutionApplicationProgramBridge
): boolean {
  return shouldShowInstitutionApplicationPreferredScheduleParagraph(bridge)
}

/** 커리큘럼 복수+기간 — 모집 미입력이면 시안처럼 추가 가능(상한 10), 기본 노출은 2지망 */
export function resolveInstitutionPreferredScheduleMaxBlocks(
  bridge: InstitutionApplicationProgramBridge
): number {
  const fallback = shouldShowInstitutionApplicationMaxSessionsPerDayField(bridge) ? 10 : undefined
  return clampInstitutionScheduleBlockCount(bridge.maxScheduleCount ?? fallback)
}

export function resolveInstitutionPreferredScheduleInitialBlockCount(
  bridge: InstitutionApplicationProgramBridge
): number {
  if (!shouldShowInstitutionApplicationMaxSessionsPerDayField(bridge)) return 1
  return Math.min(2, resolveInstitutionPreferredScheduleMaxBlocks(bridge))
}
