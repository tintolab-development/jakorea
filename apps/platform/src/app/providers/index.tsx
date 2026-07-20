import type { ReactNode } from 'react'

type AppProvidersProps = {
  children: ReactNode
}

/** 전역 provider (router, theme 등) 추가 시 이 컴포넌트에서 감싼다. */
export function AppProviders({ children }: AppProvidersProps) {
  return <>{children}</>
}
