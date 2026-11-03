import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { App } from 'antd'
import { ThemeProvider } from './app/providers/theme-provider'
import { ErrorBoundary } from './app/providers/error-boundary'
import { AuthProvider } from './app/providers/auth-provider'
import { QueryProvider } from './app/providers/query-provider'
import { CmsAlertModalProvider } from '@/shared/ui/cms-alert-modal-provider'
import { FileUploadOverlay } from '@/shared/ui/file-upload-overlay'
import { BlockingOverlay } from '@/shared/ui/blocking-overlay'
import { TemplateWritingPreviewProvider } from '@/features/template/context/template-writing-preview-context'
import { router } from './app/router'
import { reloadOnceAfterDeployChunkMismatch } from './app/router/lazy-load'
import './index.css'

if (import.meta.env.PROD && typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', event => {
    event.preventDefault()
    reloadOnceAfterDeployChunkMismatch('vite-preload')
  })
}

console.info(
  `[CMS] 배포 빌드 ${import.meta.env.VITE_APP_BUILD_AT ?? 'unknown'} (${import.meta.env.VITE_APP_GIT_SHA || 'local'} / ${import.meta.env.MODE})`
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <App>
            <CmsAlertModalProvider>
              <FileUploadOverlay />
              <BlockingOverlay />
              <AuthProvider>
                <TemplateWritingPreviewProvider>
                  <RouterProvider router={router} />
                </TemplateWritingPreviewProvider>
              </AuthProvider>
            </CmsAlertModalProvider>
          </App>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
)
