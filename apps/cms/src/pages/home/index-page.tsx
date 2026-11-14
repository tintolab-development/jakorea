/**
 * `/` 인덱스: 관리자는 대시보드. CMS는 관리자 전용이라 그 외 역할은 다른 주소로 보내지 않고 접근 불가 안내만 보여 준다
 * (로그인 화면으로 보내면 로그인 후 이동과 서로 오가며 반복될 수 있다).
 */

import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { Dashboard } from '@/pages/dashboard'
import { ComingSoonPage } from '@/pages/error/coming-soon-page'

export function IndexPage() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const user = useAuthStore(state => state.user)

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === 'ADMIN') {
    return <Dashboard />
  }

  return (
    <ComingSoonPage
      title="접근 권한이 없습니다"
      description="이 페이지에 접근할 권한이 없습니다."
    />
  )
}
