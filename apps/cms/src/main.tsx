import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { App } from 'antd'
import { ThemeProvider } from './app/providers/theme-provider'
import { ErrorBoundary } from './app/providers/error-boundary'
import { AuthProvider } from './app/providers/auth-provider'
import { QueryProvider } from './app/providers/query-provider'
import { CmsAlertModalProvider } from '@/shared/ui/cms-alert-modal-provider'
import { TemplateWritingPreviewProvider } from '@/features/template/context/template-writing-preview-context'
import { router } from './app/router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <App>
            <CmsAlertModalProvider>
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
