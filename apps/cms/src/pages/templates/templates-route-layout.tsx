/** `/templates/*` 공통 레이아웃 — lazy `TemplateListPage` Suspense 경계 밖에서 preview context 보장 */
import { Outlet } from 'react-router-dom'
import { TemplateWritingPreviewProvider } from '@/features/template/context/template-writing-preview-context'

export function TemplatesRouteLayout() {
  return (
    <TemplateWritingPreviewProvider>
      <Outlet />
    </TemplateWritingPreviewProvider>
  )
}
