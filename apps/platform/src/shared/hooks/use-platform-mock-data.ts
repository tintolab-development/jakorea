import { useSyncExternalStore } from 'react'
import { DEV_AUTH_CHANGE_EVENT, shouldUsePlatformMockData } from '@/shared/lib/dev-auth'

function subscribe(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(DEV_AUTH_CHANGE_EVENT, onStoreChange)
  window.addEventListener('storage', onStoreChange)
  return () => {
    window.removeEventListener(DEV_AUTH_CHANGE_EVENT, onStoreChange)
    window.removeEventListener('storage', onStoreChange)
  }
}

/** mock 카탈로그 on/off. 로그인 전환 시 getter를 다시 읽게 한다. */
export function useShouldUsePlatformMockData(): boolean {
  return useSyncExternalStore(subscribe, shouldUsePlatformMockData, () => true)
}
