/**
 * 브레드크럼 훅
 *
 * [설계]
 * - 데이터 소스: pathname(useLocation) + 역할(useAuthStore) + 메뉴 설정(menu-config).
 * - 브레드크럼은 pathname·메뉴 구조에서 파생되므로 쿼리 파라미터 연동 없음.
 * - getBreadcrumbByPath(path, role) → BreadcrumbItem[]; useBreadcrumb() → { items }.
 * - 공통 UI: AppBreadcrumb(items). 헤더 외 다른 레이아웃에서도 재사용 가능.
 */

import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getBreadcrumbByPath } from '@/shared/config/menu-config'
import type { BreadcrumbItem } from '@/shared/config/menu-config'

export interface UseBreadcrumbReturn {
  items: BreadcrumbItem[]
}

export function useBreadcrumb(): UseBreadcrumbReturn {
  const location = useLocation()
  const user = useAuthStore(s => s.user)
  const role = user?.role ?? null

  const items = useMemo(
    () => getBreadcrumbByPath(location.pathname, role),
    [location.pathname, role]
  )

  return { items }
}
