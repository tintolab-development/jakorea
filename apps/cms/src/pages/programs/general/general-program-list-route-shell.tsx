/**
 * `/programs/general` 라우트 셸 — lazy 청크 분리.
 */
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'

const GeneralProgramListPage = lazy(() => import('./page'))

function GeneralProgramListLoadingFallback() {
  return (
    <div className="router-loading-fallback">
      <Spin size="large" />
    </div>
  )
}

export function GeneralProgramListRouteShell() {
  return (
    <Suspense fallback={<GeneralProgramListLoadingFallback />}>
      <GeneralProgramListPage />
    </Suspense>
  )
}
