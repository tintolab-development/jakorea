import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { App } from 'antd'
import { ThemeProvider } from './app/providers/theme-provider'
import { ErrorBoundary } from './app/providers/error-boundary'
import { AuthProvider } from './app/providers/auth-provider'
import { QueryProvider } from './app/providers/query-provider'
import { AdminReadOnlyActionGuard } from './app/providers/admin-read-only-action-guard'
import { CmsAlertModalProvider } from '@/shared/ui/cms-alert-modal-provider'
import { FileUploadOverlay } from '@/shared/ui/file-upload-overlay'
import { BlockingOverlay } from '@/shared/ui/blocking-overlay'
import { TemplateWritingPreviewProvider } from '@/features/template/context/template-writing-preview-context'
import { router } from './app/router'
import { reloadOnceAfterDeployChunkMismatch } from './app/router/lazy-load'
import {
  installCmsWindowErrorReporting,
  onCmsCaughtRenderError,
} from './app/providers/client-error-reporting'
import './index.css'
import '@/shared/components/detail-info-form/detail-info-form.css'

if (import.meta.env.PROD && typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', event => {
    event.preventDefault()
    reloadOnceAfterDeployChunkMismatch('vite-preload')
  })
}

console.info(
  `[CMS] 배포 빌드 ${import.meta.env.VITE_APP_BUILD_AT ?? 'unknown'} (${import.meta.env.VITE_APP_GIT_SHA || 'local'} / ${import.meta.env.MODE})`
)

// QA-0183 화면 오류 수집 — 관리자 로그인 상태에서만, 실패는 조용히 버린다
installCmsWindowErrorReporting()

createRoot(document.getElementById('root')!, {
  onCaughtError: onCmsCaughtRenderError,
}).render(
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
                  <AdminReadOnlyActionGuard>
                    <RouterProvider router={router} />
                  </AdminReadOnlyActionGuard>
                </TemplateWritingPreviewProvider>
              </AuthProvider>
            </CmsAlertModalProvider>
          </App>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
)
