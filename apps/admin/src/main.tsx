import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { App } from 'antd'
import { ThemeProvider } from './app/providers/theme-provider'
import { ErrorBoundary } from './app/providers/error-boundary'
import { QueryProvider } from './app/providers/query-provider'
import { CmsAlertModalProvider } from '@/shared/ui/cms-alert-modal-provider'
import { router } from './app/router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <App>
            <CmsAlertModalProvider>
              <RouterProvider router={router} />
            </CmsAlertModalProvider>
          </App>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
)
