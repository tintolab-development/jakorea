import type { MemberNotificationResponse } from '../api/client.ts'
import { resolvePortalNotificationPath } from './resolve-portal-notification-path.ts'

/**
 * 알림 클릭 시 안내 팝업 — 시안 Figma CMS 「시스템 안내 팝업」 › 시스템 섹션의 「공통_」 3종만 띄운다.
 * 그 밖의 알림은 null → 기존처럼 바로 이동한다.
 *
 * - 공통_#{동의_항목}_동의_완료 (17149:68324): 서버 제목·본문이 시안과 같아 그대로 쓴다.
 * - 공통_필수_동의_항목_만료_예정 (17149:68338): 제목은 시안 고정 문구. 본문의 #{동의 항목}은 응답에 없어 서버 본문을 쓴다.
 * - 공통_본인인증_완료 (17149:68352): 동적 값이 없어 시안 제목·본문을 그대로 쓴다.
 * 이동 버튼 문구는 이동 위치에 맞춘 시안 문구(동의 내역 보기 / 내 정보 보기). 이동 위치가 없으면 버튼 없이 [닫기]만.
 */
export type PortalNotificationPopup = {
  title: string
  message: string
  actionLabel: string | null
  path: string | null
}

type PopupCopy = {
  title?: string
  message?: string
  actionLabel: string
}

const POPUP_COPY_BY_EVENT_TYPE: Readonly<Record<string, PopupCopy>> = {
  MEMBER_CONSENT_COMPLETED: { actionLabel: '동의 내역 보기' },
  MEMBER_CONSENT_EXPIRING: { title: '필수 동의 항목 만료 예정', actionLabel: '동의 내역 보기' },
  MEMBER_IDENTITY_VERIFIED: {
    title: '본인인증 완료',
    message: '본인인증이 완료됐습니다.\n인증 일시와 등록된 정보를 확인해 주세요.',
    actionLabel: '내 정보 보기',
  },
}

export function resolvePortalNotificationPopup(
  item: Pick<
    MemberNotificationResponse,
    'eventType' | 'title' | 'message' | 'linkType' | 'linkId' | 'sourceId' | 'programId' | 'sourceDomain'
  >,
): PortalNotificationPopup | null {
  const copy = POPUP_COPY_BY_EVENT_TYPE[item.eventType?.trim().toUpperCase() ?? '']
  if (!copy) return null
  const path = resolvePortalNotificationPath(item)
  return {
    title: copy.title ?? (item.title?.trim() || '-'),
    message: copy.message ?? (item.message?.trim() || ''),
    actionLabel: path ? copy.actionLabel : null,
    path,
  }
}
