/**
 * JA Worldwide 관리
 */

import { useJaKoreaWorldwide } from '@/features/ja-korea-worldwide/api/hooks'
import { jaKoreaWorldwideQueryKeys } from '@/features/ja-korea-worldwide/api/query-keys'
import { JA_KOREA_WORLDWIDE_CHANGED_EVENT } from '@/features/ja-korea-worldwide/api/store'
import { WorldwideFormCard } from '@/features/ja-korea-worldwide/ui/worldwide-form'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { PageContentLoading } from '@/shared/ui'

import './page.css'

export function WorldwidePage() {
  const worldwideQuery = useJaKoreaWorldwide()

  useInvalidateOnWindowEvent(JA_KOREA_WORLDWIDE_CHANGED_EVENT, jaKoreaWorldwideQueryKeys.all)

  const data = worldwideQuery.data

  if (worldwideQuery.isLoading) {
    return (
      <div className="ja-korea-worldwide-page">
        <PageContentLoading variant="viewport" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="ja-korea-worldwide-page">
        <div className="admin-list-card page-content-error" role="alert">
          콘텐츠를 불러오지 못했습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="ja-korea-worldwide-page">
      <WorldwideFormCard data={data} />
    </div>
  )
}
