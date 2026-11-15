/**
 * 홈페이지 어드민 알림 탭 분류 — 시안 「02. GNB / 06. 알림 리스트」(전체·신청·매칭·시스템)와
 * 「10. 자동발송 메일 및 시스템 안내 팝업」 구역(신청·매칭 4종, 시스템 = 공통 동의·본인인증).
 */
export type SystemInboxCategory = 'matching' | 'system'

/** 시안 「신청·매칭」 구역의 4종 (채용 공고 마감·인재풀 신규 지원·기업후원 상담·재능기부) */
const MATCHING_NOTIFICATION_TYPES: ReadonlySet<string> = new Set([
  'CAREER_POSTING_DEADLINE',
  'CAREER_TALENT_APPLICATION',
  'CORPORATE_CONSULTATION',
  'TALENT_APPLICATION',
])

export function resolveSystemInboxCategory(
  notificationType: string | null | undefined,
): SystemInboxCategory {
  const key = notificationType?.trim().toUpperCase() ?? ''
  return MATCHING_NOTIFICATION_TYPES.has(key) ? 'matching' : 'system'
}
