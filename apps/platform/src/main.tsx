import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/shared/styles/index.css'
import { App, AppProviders } from '@/app'
import { bootstrapPortalAccessToken } from '@/shared/api/axios-instance'
import { waitForAuthBootstrap } from '@/shared/lib/auth-bootstrap'

/**
 * 시작 시 access token 복원 대기 상한. 넘으면 렌더를 시작한다 — 늦게 성공하면 조용히 복원하고,
 * 늦게 실패하면 복원 실패 안내 규칙(axios-instance `bootstrapPortalAccessToken`)대로 처리한다.
 */
const AUTH_BOOTSTRAP_RENDER_WAIT_MS = 3_000

console.info(
  `[Platform] 배포 빌드 ${import.meta.env.VITE_APP_BUILD_AT ?? 'unknown'} (${import.meta.env.VITE_APP_GIT_SHA || 'local'} / ${import.meta.env.MODE})`
)

function renderApp() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>,
  )
}

// QA-0137: access token은 메모리에만 있으므로, 렌더 시점에 토큰을 읽는 조회·가드가 동작하도록 복원 후 렌더한다.
void waitForAuthBootstrap(bootstrapPortalAccessToken(), AUTH_BOOTSTRAP_RENDER_WAIT_MS).then(renderApp)
