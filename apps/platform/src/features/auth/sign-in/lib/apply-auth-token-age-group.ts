import { platformQueryKeys } from '@/shared/api/query-keys'
import { queryClient } from '@/shared/lib'
import type { HomepageMeResponse } from '../api/types'
import { parsePortalAgeGroup, type PortalAgeGroup } from './portal-age-group'

/**
 * 로그인·리프레시 토큰의 ageGroup을 이미 있는 GET /me 캐시에 덧씌운다. 없으면 OVER_14로 채우지 않는다.
 * 캐시가 비어 있으면 새로 만들지 않는다 — `{ ageGroup }`만 든 캐시가 fresh로 남으면
 * 관리자 등록 온보딩 가드 등이 GET /me 없이 온보딩 플래그를 빈 값으로 판정한다.
 */
export function applyAuthTokenAgeGroupToMeCache(ageGroup: unknown): PortalAgeGroup | undefined {
  const parsed = parsePortalAgeGroup(ageGroup)
  if (!parsed) return undefined

  const key = platformQueryKeys.auth.me()
  const current = queryClient.getQueryData<HomepageMeResponse>(key)
  if (current) {
    queryClient.setQueryData<HomepageMeResponse>(key, { ...current, ageGroup: parsed })
  }
  return parsed
}
