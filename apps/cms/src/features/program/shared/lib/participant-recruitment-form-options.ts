/** 참여자 모집 정보 — 공고 게시 여부 (게시 / 미게시) */
export const ANNOUNCEMENT_PUBLISHED_OPTIONS = [
  { value: 'published', label: '게시' },
  { value: 'unpublished', label: '미게시' },
] as const

export type ParticipantRecruitmentAnnouncementPublishedValue =
  (typeof ANNOUNCEMENT_PUBLISHED_OPTIONS)[number]['value']

export function announcementPublishedToFormValue(
  value: boolean | undefined,
  defaultValue: ParticipantRecruitmentAnnouncementPublishedValue = 'published'
): ParticipantRecruitmentAnnouncementPublishedValue {
  if (value === true) return 'published'
  if (value === false) return 'unpublished'
  return defaultValue
}

export function announcementPublishedFromFormValue(
  value: ParticipantRecruitmentAnnouncementPublishedValue | undefined
): boolean | undefined {
  if (value === 'published') return true
  if (value === 'unpublished') return false
  return undefined
}
