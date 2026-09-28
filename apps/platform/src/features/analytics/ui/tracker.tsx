import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { metricCodeForPathname } from '../lib/route-metrics'
import { ensureVisitorSession, recordMetric } from '../lib/session'

/**
 * 공개 레이아웃에만 마운트한다.
 * 세션은 문서당 1회, 메뉴 조회는 pathname이 바뀔 때마다 1회.
 */
export function AnalyticsTracker() {
  const { pathname } = useLocation()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    ensureVisitorSession()
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    const metricCode = metricCodeForPathname(pathname)
    if (!metricCode) return
    recordMetric(metricCode)
  }, [pathname])

  return null
}
