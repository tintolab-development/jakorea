import { useSyncExternalStore } from 'react'
import { RouterProvider } from 'react-router-dom'
import { PlatformAuthRestoreNoticeModal } from '@/features/auth/session/auth-restore-notice-modal'
import { router } from './router'

const subscribeRouter = (onChange: () => void) => router.subscribe(() => onChange())
const readRouterPath = () => `${router.state.location.pathname}${router.state.location.search}`
const navigateWithRouter = (to: string) => {
  void router.navigate(to)
}

export function App() {
  // QA-0137 로그인 복원 실패 안내는 라우터 밖(전역)에 두되, 현재 위치에 따라 버튼을 고른다.
  const currentPath = useSyncExternalStore(subscribeRouter, readRouterPath, readRouterPath)

  return (
    <>
      <RouterProvider router={router} />
      <PlatformAuthRestoreNoticeModal currentPath={currentPath} navigate={navigateWithRouter} />
    </>
  )
}
