import type { Program } from '@/types/domain'
import { shouldShowGeneralIndividualAssignment } from './assignment-visibility'

export const PARTICIPANT_DETAIL_TAB_KEYS = [
  'application',
  'attendance',
  'assignments',
  'settlement',
] as const
export type ParticipantDetailTabKey = (typeof PARTICIPANT_DETAIL_TAB_KEYS)[number]

const TAB_LABELS: Record<ParticipantDetailTabKey, string> = {
  application: '신청 정보',
  attendance: '출석 관리',
  assignments: '과제 관리',
  settlement: '정산 현황',
}

export function getParticipantDetailTabLabel(tab: ParticipantDetailTabKey): string {
  return TAB_LABELS[tab]
}

/** 프로그램 회차 capability에 맞는 참여자 상세 탭만 반환한다. */
export function getParticipantDetailTabKeys(
  program?: Program | null
): readonly ParticipantDetailTabKey[] {
  // 프로그램 상세를 아직 불러오지 않은 동안에는 기존 URL을 보존한다.
  if (program == null) return PARTICIPANT_DETAIL_TAB_KEYS

  const assignmentVisible = shouldShowGeneralIndividualAssignment(program)
  return PARTICIPANT_DETAIL_TAB_KEYS.filter(tab => tab !== 'assignments' || assignmentVisible)
}

export function normalizeParticipantDetailTab(
  tab: string | null | undefined,
  program?: Program | null
): ParticipantDetailTabKey {
  const normalized = tab?.trim()
  const allowedTabs = getParticipantDetailTabKeys(program)
  if (!normalized || !(allowedTabs as readonly string[]).includes(normalized)) {
    return 'application'
  }
  return normalized as ParticipantDetailTabKey
}
