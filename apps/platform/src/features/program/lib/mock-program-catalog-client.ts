/**
 * Platform → 공유 mock program catalog 클라이언트.
 * DEV + mock 로그인 일 때만 네트워크 조회.
 *
 * StrictMode 이중 effect / 동시 호출은 in-flight dedupe + 모듈 캐시로 1회 네트워크만 나간다.
 */

import type { CmsProgramLike } from '../model/cms-program.types'
import { getDevAuthLoggedIn } from '@/shared/lib/dev-auth'

/** tools/mock-program-catalog/constants 와 동일 */
export const MOCK_PROGRAM_CATALOG_API_PATH = '/__dev__/mock-program-catalog'

let inflightRequest: Promise<CmsProgramLike[]> | null = null
let cachedCatalog: CmsProgramLike[] | null = null

function isCmsProgramLike(value: unknown): value is CmsProgramLike {
  return (
    value != null &&
    typeof value === 'object' &&
    typeof (value as CmsProgramLike).id === 'string' &&
    (value as CmsProgramLike).id.trim().length > 0 &&
    typeof (value as CmsProgramLike).title === 'string'
  )
}

/** 로그아웃·캐시 무효화 시 호출 (모듈 메모리 유지되는 동안만 유효) */
export function clearMockProgramCatalogCache() {
  inflightRequest = null
  cachedCatalog = null
}

async function requestMockProgramCatalog(): Promise<CmsProgramLike[]> {
  try {
    const response = await fetch(MOCK_PROGRAM_CATALOG_API_PATH, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) {
      console.warn('[mock-program-catalog] fetch failed', response.status)
      return []
    }
    const body = (await response.json()) as { items?: unknown }
    if (!Array.isArray(body.items)) return []
    return body.items.filter(isCmsProgramLike)
  } catch (error) {
    console.warn('[mock-program-catalog] fetch error', error)
    return []
  }
}

/**
 * CMS mock 등록 카탈로그.
 * mock 로그인·DEV 가 아니면 빈 배열 — 실 세션/비로그인 목록은 시드만 유지.
 */
export async function fetchMockProgramCatalog(): Promise<CmsProgramLike[]> {
  if (!import.meta.env.DEV) return []
  if (!getDevAuthLoggedIn()) {
    clearMockProgramCatalogCache()
    return []
  }

  if (cachedCatalog) return cachedCatalog
  if (inflightRequest) return inflightRequest

  inflightRequest = requestMockProgramCatalog()
    .then(items => {
      cachedCatalog = items
      return items
    })
    .finally(() => {
      inflightRequest = null
    })

  return inflightRequest
}
