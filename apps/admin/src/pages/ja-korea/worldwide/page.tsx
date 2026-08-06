/**
 * JA Worldwide 관리
 */

import { useJaKoreaWorldwide } from '@/features/ja-korea-worldwide/api/hooks'
import { jaKoreaWorldwideQueryKeys } from '@/features/ja-korea-worldwide/api/query-keys'
import { JA_KOREA_WORLDWIDE_CHANGED_EVENT } from '@/features/ja-korea-worldwide/api/store'
import { WorldwideFormCard } from '@/features/ja-korea-worldwide/ui/worldwide-form'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'

import './page.css'

export function WorldwidePage() {
  const worldwideQuery = useJaKoreaWorldwide()

  useInvalidateOnWindowEvent(JA_KOREA_WORLDWIDE_CHANGED_EVENT, jaKoreaWorldwideQueryKeys.all)

  const data = worldwideQuery.data

  if (worldwideQuery.isLoading || !data) {
    return (
      <div className="ja-korea-worldwide-page">
        <div className="admin-list-card">콘텐츠를 불러오는 중…</div>
      </div>
    )
  }

  return (
    <div className="ja-korea-worldwide-page">
      <WorldwideFormCard data={data} />
    </div>
  )
}
