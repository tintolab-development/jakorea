/**
 * `/templates/*` 공통 레이아웃.
 * `TemplateWritingPreviewProvider`는 `TemplateListPage` 내부 `<Outlet />` 직전에 둔다
 * (lazy + Suspense 경계에서 상위 Provider가 자식 hook과 어긋나는 RR7 이슈 방지).
 */
import { Outlet } from 'react-router-dom'

export function TemplatesRouteLayout() {
  return <Outlet />
}
