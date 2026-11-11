/**
 * 알림 발송 팝업이 따르는 모집의 최종 발표일 — 「발표일에 맞춰서」 경과 비활성용.
 * 모집 화면(기관·강사·개인·봉사자 신청 목록 등)이 Provider로 발표일을 내려주고,
 * 공통 알림 라디오(`PermissionModal` 등)가 읽는다. Provider 밖이면 기존 동작(항상 선택 가능).
 */
import { createContext, useContext, type ReactNode } from 'react'
import { isNotifyAnnouncementPassed } from '@/shared/lib/notify-announcement'

type NotifyAnnouncementContextValue = {
  /** GET `recruitments[].finalPassAnnouncementAt`. 없으면 null */
  announcementAt: string | null
}

const NotifyAnnouncementContext = createContext<NotifyAnnouncementContextValue | null>(null)

export function NotifyAnnouncementProvider({
  announcementAt,
  children,
}: {
  announcementAt: string | null | undefined
  children: ReactNode
}) {
  return (
    <NotifyAnnouncementContext.Provider value={{ announcementAt: announcementAt ?? null }}>
      {children}
    </NotifyAnnouncementContext.Provider>
  )
}

/**
 * 「발표일에 맞춰서」 비활성 여부. `announcementAt`을 직접 주면 그 값을, 생략(undefined)하면 Provider 값을 쓴다.
 */
export function useNotifyAnnouncementPassed(announcementAt?: string | null): boolean {
  const context = useContext(NotifyAnnouncementContext)
  const resolved = announcementAt !== undefined ? announcementAt : (context?.announcementAt ?? null)
  return isNotifyAnnouncementPassed(resolved)
}
