import type { ReactNode } from 'react'
import { PlatformSessionWarningModal } from '@/features/auth/session/session-warning-modal'
import { QueryProvider } from './query-provider'

type AppProvidersProps = {
  children: ReactNode
}

/** 전역 provider (Query, router, theme 등) 추가 시 이 컴포넌트에서 감싼다. */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      {children}
      <PlatformSessionWarningModal />
    </QueryProvider>
  )
}
