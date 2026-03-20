import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { App } from 'antd'
import { ThemeProvider } from './app/providers/theme-provider'
import { ErrorBoundary } from './app/providers/error-boundary'
import { AuthProvider } from './app/providers/auth-provider'
import { QueryProvider } from './app/providers/query-provider'
import { router } from './app/router'
import './index.css'
import './common.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <App>
            <AuthProvider>
              <RouterProvider router={router} />
            </AuthProvider>
          </App>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
)
