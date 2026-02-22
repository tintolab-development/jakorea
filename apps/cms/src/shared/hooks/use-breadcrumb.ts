/**
 * 브레드크럼 훅
 *
 * [설계]
 * - 데이터 소스: pathname(useLocation) + 역할(useAuthStore) + 메뉴 설정(menu-config).
 * - 브레드크럼은 pathname·메뉴 구조에서 파생되므로 쿼리 파라미터 연동 없음.
 * - getBreadcrumbByPath(path, role, user) → BreadcrumbItem[]; useBreadcrumb() → { items }.
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
    () => getBreadcrumbByPath(location.pathname, role, user),
    [location.pathname, role, user]
  )

  return { items }
}
