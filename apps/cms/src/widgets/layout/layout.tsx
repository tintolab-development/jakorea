/**
 * 기본 레이아웃 컴포넌트
 * Phase 1.1: Ant Design Layout 활용
 * 타이틀을 사이드바 최상단으로 이동
 * Phase: 유저 로그인 정보를 사이드바에서 헤더로 이동
 * 접근 권한이 없는 경로는 콘텐츠 영역에서만 Coming Soon 표시 (LNB·헤더 유지)
 */

import { Layout as AntLayout } from 'antd'
import { Outlet, useLocation, useParams } from 'react-router-dom'
import { TemplateWritingPreviewProvider } from '@/features/template/context/template-writing-preview-context'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canAccessProgram } from '@/features/permission-request/lib/program-acl'
import { canAccessPath } from '@/shared/config/menu-config'
import { ComingSoonPage } from '@/pages/error/coming-soon-page'
import { Sidebar } from './sidebar'
import { MainHeader } from './main-header'
import './layout.css'

const { Content } = AntLayout

function LayoutContent() {
  const location = useLocation()
  const params = useParams()
  const { user } = useAuthStore()

  const pathActor = user ? { role: user.role, adminLevel: user.adminLevel } : null
  if (user && location.pathname !== '/' && !canAccessPath(location.pathname, pathActor)) {
    return (
      <ComingSoonPage
        title="접근 권한이 없습니다"
        description="이 페이지에 접근할 권한이 없습니다. 해당 기능은 현재 준비 중입니다."
      />
    )
  }

  const programId = params.id || params.programId
  if (user && programId && location.pathname.includes('/programs/')) {
    const action = location.pathname.includes('/edit') ? 'EDIT' : 'VIEW'
    if (!canAccessProgram(user, programId, action)) {
      return (
        <ComingSoonPage
          title="접근 권한이 없습니다"
          description="이 프로그램에 접근할 권한이 없습니다. 해당 기능은 현재 준비 중입니다."
        />
      )
    }
  }

  return <Outlet />
}

export function Layout() {
  const location = useLocation()
  const isTemplatesPath = location.pathname.startsWith('/templates')

  return (
    <AntLayout className="app-layout" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <AntLayout>
        <MainHeader />
        <Content className={`layout-content ${isTemplatesPath ? 'layout-content--templates' : ''}`}>
          <TemplateWritingPreviewProvider>
            <LayoutContent />
          </TemplateWritingPreviewProvider>
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
