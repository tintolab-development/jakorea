import type { ReactNode } from 'react'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import '@/features/user/shared/ui/member-management-small-screen.css'

export interface UserDetailLayoutProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  sidebar?: ReactNode
  header?: ReactNode
  headerTrailing?: ReactNode
  /** 상세 GET 첫 응답 전 — 같은 모달 인스턴스에서 스피너만 보여준다 */
  loading?: boolean
  /** 권한 승인 목록에서 연 신청 상세 — 시안 컨테이너 기준이 회원 상세와 달라 셸 클래스를 붙인다 */
  permissionRequest?: boolean
  children?: ReactNode
}

/** 회원 상세 풀페이지 — 셸만 담당 (비즈니스 로직 없음) */
export function UserDetailLayout({
  open,
  onClose,
  title,
  sidebar,
  header,
  headerTrailing,
  loading,
  permissionRequest,
  children,
}: UserDetailLayoutProps) {
  return (
    <DetailFullPageModal
      open={open}
      onClose={onClose}
      className={
        permissionRequest
          ? 'user-detail-fullpage-modal user-detail-fullpage-modal--permission-request'
          : 'user-detail-fullpage-modal'
      }
      title={title}
      headerTrailing={headerTrailing}
      sidebar={sidebar}
      contentExtra={header}
      loading={loading}
    >
      {children}
    </DetailFullPageModal>
  )
}
