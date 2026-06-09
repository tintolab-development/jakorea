/**
 * 일반 프로그램 상세 — 진행 현황·참여자 면접 신청 URL tab SSOT
 */

export const PARTICIPANT_INTERVIEW_TABS = [
  'part_doc1',
  'part_doc_passed',
  'part_interview2',
] as const

export type GeneralParticipantInterviewTab = (typeof PARTICIPANT_INTERVIEW_TABS)[number]

export const PARTICIPANT_INTERVIEW_CHILD_ROWS = [
  { tab: 'part_doc1' as const, label: '1차 서류 심사 대상자' },
  { tab: 'part_doc_passed' as const, label: '1차 서류 합격자' },
  { tab: 'part_interview2' as const, label: '2차 면접 대상자' },
] as const

export const GENERAL_PROGRESS_TAB_KEYS = [
  'progress_participants',
  'progress_instructors',
  'progress_volunteers',
] as const

export type GeneralProgressTabKey = (typeof GENERAL_PROGRESS_TAB_KEYS)[number]

/** @deprecated URL 호환 — `progress_institutions` → `progress_participants` */
export const LEGACY_PROGRESS_INSTITUTIONS_TAB = 'progress_institutions'

export function normalizeGeneralProgressTab(tab: string): GeneralProgressTabKey | null {
  if (tab === LEGACY_PROGRESS_INSTITUTIONS_TAB) return 'progress_participants'
  if ((GENERAL_PROGRESS_TAB_KEYS as readonly string[]).includes(tab)) {
    return tab as GeneralProgressTabKey
  }
  return null
}

export function isValidGeneralProgressTab(tab: string, allowedTabs: readonly string[]): boolean {
  const normalized = normalizeGeneralProgressTab(tab)
  if (normalized == null) return false
  return allowedTabs.includes(normalized)
}

export function isParticipantInterviewTab(tab: string): tab is GeneralParticipantInterviewTab {
  return (PARTICIPANT_INTERVIEW_TABS as readonly string[]).includes(tab)
}

export function isParticipantTabValid(tab: string, interviewEnabled: boolean): boolean {
  if (!interviewEnabled) return tab === 'main'
  return isParticipantInterviewTab(tab)
}

export function defaultParticipantApplicationTab(interviewEnabled: boolean): string {
  return interviewEnabled ? 'part_doc1' : 'main'
}
