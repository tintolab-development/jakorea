/**
 * BI 소개 관리
 */

import { useJaKoreaBi } from '@/features/ja-korea-bi/api/hooks'
import { jaKoreaBiQueryKeys } from '@/features/ja-korea-bi/api/query-keys'
import { JA_KOREA_BI_CHANGED_EVENT } from '@/features/ja-korea-bi/api/store'
import { BiFormCard } from '@/features/ja-korea-bi/ui/bi-form'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { PageContentLoading } from '@/shared/ui'

import './page.css'

export function BiPage() {
  const biQuery = useJaKoreaBi()

  useInvalidateOnWindowEvent(JA_KOREA_BI_CHANGED_EVENT, jaKoreaBiQueryKeys.all)

  const data = biQuery.data

  if (biQuery.isLoading) {
    return (
      <div className="ja-korea-bi-page">
        <PageContentLoading variant="viewport" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="ja-korea-bi-page">
        <div className="admin-list-card page-content-error" role="alert">
          콘텐츠를 불러오지 못했습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="ja-korea-bi-page">
      <BiFormCard data={data} />
    </div>
  )
}
