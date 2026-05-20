/**
 * `/templates/*` 공통 레이아웃 — `TemplateWritingPreviewProvider`는 lazy `TemplateListPage`보다
 * 위에 두어 클라이언트 네비게이션 시 자식 라우트가 Provider 마운트 전에 렌더되는 것을 방지한다.
 */
import { Outlet } from 'react-router-dom'
import { TemplateWritingPreviewProvider } from '@/features/template/context/template-writing-preview-context'

export function TemplatesRouteLayout() {
  return (
    <TemplateWritingPreviewProvider>
      <Outlet />
    </TemplateWritingPreviewProvider>
  )
}
