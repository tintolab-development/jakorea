/**
 * 알림 발송 팝업이 따르는 모집의 최종 발표일 — 「발표일에 맞춰서」 비활성용.
 * 모집 화면(기관·강사·개인·봉사자 신청 목록 등)이 Provider로 발표일을 내려주고,
 * 공통 알림 라디오(`PermissionModal` 등)가 읽는다.
 * - Provider 안: 발표일이 지났거나 null(미설정·판단 불가)이면 비활성.
 * - Provider 밖(발표일을 모르는 화면): 기존 동작(항상 선택 가능).
 */
import { createContext, useContext, type ReactNode } from 'react'
import { isNotifyAnnouncementOptionDisabled } from '@/shared/lib/notify-announcement'

type NotifyAnnouncementContextValue = {
  /** GET `recruitments[].finalPassAnnouncementAt`. 없으면 null */
  announcementAt: string | null
}

const NotifyAnnouncementContext = createContext<NotifyAnnouncementContextValue | null>(null)

/**
 * `announcementAt`: 모집 발표일(string) 또는 미설정(null).
 * undefined는 「이 화면은 어느 모집 발표일인지 모름」 — Provider 밖과 같게(기존 동작) 둔다.
 */
export function NotifyAnnouncementProvider({
  announcementAt,
  children,
}: {
  announcementAt: string | null | undefined
  children: ReactNode
}) {
  return (
    <NotifyAnnouncementContext.Provider
      value={announcementAt === undefined ? null : { announcementAt }}
    >
      {children}
    </NotifyAnnouncementContext.Provider>
  )
}

/**
 * 「발표일에 맞춰서」 비활성 여부.
 * `announcementAt`을 직접 주면(null 포함) 그 값으로, 생략(undefined)하면 Provider 값으로 판단한다.
 * 둘 다 없으면(Provider 밖) false — 기존 동작 유지.
 */
export function useNotifyAnnouncementDisabled(announcementAt?: string | null): boolean {
  const context = useContext(NotifyAnnouncementContext)
  if (announcementAt !== undefined) return isNotifyAnnouncementOptionDisabled(announcementAt)
  if (!context) return false
  return isNotifyAnnouncementOptionDisabled(context.announcementAt)
}
