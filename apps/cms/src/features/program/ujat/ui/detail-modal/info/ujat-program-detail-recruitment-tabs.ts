/**
 * UJAT 프로그램 상세 — 모집 정보 서브탭
 */

export const UJAT_RECRUIT_TAB_KEYS = [
  'recruit_participant',
  'recruit_volunteer_h1',
  'recruit_volunteer_h2',
] as const

export type UjatRecruitTabKey = (typeof UJAT_RECRUIT_TAB_KEYS)[number]

export const UJAT_RECRUIT_TAB_LABELS: Record<UjatRecruitTabKey, string> = {
  recruit_participant: '참여자 모집 정보',
  recruit_volunteer_h1: '상반기 봉사자 모집 정보',
  recruit_volunteer_h2: '하반기 봉사자 모집 정보',
}

export const UJAT_RECRUIT_EDIT_KEYS = UJAT_RECRUIT_TAB_KEYS

export type UjatRecruitEditKey = UjatRecruitTabKey

const LEGACY_RECRUITMENT_TAB = 'recruitment'

export function normalizeUjatRecruitTab(raw: string | null | undefined): UjatRecruitTabKey {
  if (raw === LEGACY_RECRUITMENT_TAB || raw == null || raw === '') {
    return 'recruit_participant'
  }
  if ((UJAT_RECRUIT_TAB_KEYS as readonly string[]).includes(raw)) {
    return raw as UjatRecruitTabKey
  }
  return 'recruit_participant'
}

export function isUjatRecruitTab(raw: string | null | undefined): boolean {
  if (raw === LEGACY_RECRUITMENT_TAB) return true
  return raw != null && (UJAT_RECRUIT_TAB_KEYS as readonly string[]).includes(raw)
}

export function volunteerHalfFromRecruitTab(tab: UjatRecruitTabKey): 'h1' | 'h2' | null {
  if (tab === 'recruit_volunteer_h1') return 'h1'
  if (tab === 'recruit_volunteer_h2') return 'h2'
  return null
}

/** 봉사자 모집 정보 단락 title — 프로그램 상세는 탭 라벨과 동일하게 노출 */
export function volunteerRecruitInfoSectionTitle(tab: UjatRecruitTabKey): string | undefined {
  if (tab === 'recruit_volunteer_h1' || tab === 'recruit_volunteer_h2') {
    return UJAT_RECRUIT_TAB_LABELS[tab]
  }
  return undefined
}
