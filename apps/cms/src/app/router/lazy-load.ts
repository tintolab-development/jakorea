/**
 * React.lazy + 배포 후 구버전 청크 참조 시 1회 전체 새로고침.
 * CloudFront SPA fallback이 없는 /assets/*.js 에 index.html 을 내려주면 동적 import 가 실패한다.
 */

import { lazy } from 'react'
import type { ComponentType } from 'react'

const CHUNK_RELOAD_SESSION_PREFIX = 'cms.chunk-reload:'

export function isDynamicImportChunkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  return (
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('dynamically imported module')
  )
}

/** @returns true if a reload was triggered */
export function reloadOnceAfterDeployChunkMismatch(routeKey: string): boolean {
  if (!import.meta.env.PROD || typeof window === 'undefined') return false
  const storageKey = `${CHUNK_RELOAD_SESSION_PREFIX}${routeKey}`
  try {
    if (sessionStorage.getItem(storageKey) === '1') return false
    sessionStorage.setItem(storageKey, '1')
  } catch {
    return false
  }
  window.location.reload()
  return true
}

export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<any>,
  routeKey?: string
) {
  const reloadKey = routeKey ?? importFunc.toString()

  return lazy(async () => {
    try {
      const module = await importFunc()
      const Component = (module.default || Object.values(module)[0]) as T
      if (!Component) {
        throw new Error('Failed to load component: No export found')
      }
      return { default: Component }
    } catch (error) {
      if (isDynamicImportChunkError(error) && reloadOnceAfterDeployChunkMismatch(reloadKey)) {
        return new Promise<{ default: T }>(() => {})
      }
      throw error
    }
  })
}
