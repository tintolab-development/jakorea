import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/shared/styles/index.css'
import { AppProviders } from '@/app/providers'
import { ProgramPreviewApp } from './program-preview-app'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <ProgramPreviewApp />
    </AppProviders>
  </StrictMode>,
)
