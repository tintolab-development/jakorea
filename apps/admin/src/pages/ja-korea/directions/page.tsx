/**
 * 오시는 길 관리
 */

import { useDirections } from '@/features/directions/api/hooks'
import { directionsQueryKeys } from '@/features/directions/api/query-keys'
import { DIRECTIONS_CHANGED_EVENT } from '@/features/directions/api/store'
import { DirectionsFormCard } from '@/features/directions/ui/directions-form-card'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { PageContentLoading } from '@/shared/ui'

import './page.css'

export function DirectionsPage() {
  const directionsQuery = useDirections()

  useInvalidateOnWindowEvent(DIRECTIONS_CHANGED_EVENT, directionsQueryKeys.all)

  const data = directionsQuery.data

  if (directionsQuery.isLoading) {
    return (
      <div className="ja-korea-directions-page">
        <PageContentLoading variant="viewport" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="ja-korea-directions-page">
        <div className="admin-list-card page-content-error" role="alert">
          콘텐츠를 불러오지 못했습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="ja-korea-directions-page">
      <DirectionsFormCard data={data} />
    </div>
  )
}
