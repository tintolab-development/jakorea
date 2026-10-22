import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/shared/styles/index.css'
import { App, AppProviders } from '@/app'

console.info(
  `[Platform] 배포 빌드 ${import.meta.env.VITE_APP_BUILD_AT ?? 'unknown'} (${import.meta.env.VITE_APP_GIT_SHA || 'local'} / ${import.meta.env.MODE})`
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
