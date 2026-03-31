/**
 * 브레드크럼 훅
 *
 * [설계]
 * - 데이터 소스: pathname(useLocation) + 역할(useAuthStore) + 메뉴 설정(menu-config).
 * - `/users/list?kind=…` 등 메뉴 키에 쿼리가 포함된 경우 `location.search`를 넘겨 매칭한다.
 * - getBreadcrumbByPath(path, role, user, search) → BreadcrumbItem[]; useBreadcrumb() → { items }.
 * - 공통 UI: AppBreadcrumb(items). 헤더 외 다른 레이아웃에서도 재사용 가능.
 * - 권한별 필터링된 메뉴에서 검색하여 올바른 breadcrumb 생성 (1뎁스는 breadcrumb 미표시).
 */

import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/shared/lib/auth/auth-context'
import { getBreadcrumbByPath } from '@/shared/config/menu-config'
import type { BreadcrumbItem } from '@/shared/config/menu-config'

export interface UseBreadcrumbReturn {
  items: BreadcrumbItem[]
}

export function useBreadcrumb(): UseBreadcrumbReturn {
  const location = useLocation()
  const { user } = useAuth()
  const role = user?.role ?? null

  const items = useMemo(
    () => getBreadcrumbByPath(location.pathname, role, user, location.search),
    [location.pathname, location.search, role, user]
  )

  return { items }
}
