import type { ReactNode } from 'react'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'

export interface UserDetailLayoutProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  sidebar: ReactNode
  header: ReactNode
  headerTrailing?: ReactNode
  children: ReactNode
}

/** 회원 상세 풀페이지 — 셸만 담당 (비즈니스 로직 없음) */
export function UserDetailLayout({
  open,
  onClose,
  title,
  sidebar,
  header,
  headerTrailing,
  children,
}: UserDetailLayoutProps) {
  return (
    <DetailFullPageModal
      open={open}
      onClose={onClose}
      title={title}
      headerTrailing={headerTrailing}
      sidebar={sidebar}
      contentExtra={header}
    >
      {children}
    </DetailFullPageModal>
  )
}
