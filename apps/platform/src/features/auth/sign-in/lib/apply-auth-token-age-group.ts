import { platformQueryKeys } from '@/shared/api/query-keys'
import { queryClient } from '@/shared/lib'
import type { HomepageMeResponse } from '../api/types'
import { parsePortalAgeGroup, type PortalAgeGroup } from './portal-age-group'

/** 로그인·리프레시 토큰의 ageGroup을 GET /me 캐시에 심는다. 없으면 OVER_14로 채우지 않는다. */
export function applyAuthTokenAgeGroupToMeCache(ageGroup: unknown): PortalAgeGroup | undefined {
  const parsed = parsePortalAgeGroup(ageGroup)
  if (!parsed) return undefined

  const key = platformQueryKeys.auth.me()
  const current = queryClient.getQueryData<HomepageMeResponse>(key)
  queryClient.setQueryData<HomepageMeResponse>(key, {
    ...(current ?? {}),
    ageGroup: parsed,
  })
  return parsed
}
