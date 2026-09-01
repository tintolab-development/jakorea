/**
 * 참여하기 관리 — 메뉴명 연결 링크
 */

import {
  useParticipateMenuLinks,
} from '@/features/participate/api/hooks'
import { participateQueryKeys } from '@/features/participate/api/query-keys'
import { PARTICIPATE_LINKS_CHANGED_EVENT } from '@/features/participate/api/store'
import { ParticipateLinksFormCard } from '@/features/participate/ui/links-form-card'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { PageContentLoading } from '@/shared/ui'

import './page.css'

export function ParticipatePage() {
  const linksQuery = useParticipateMenuLinks()

  useInvalidateOnWindowEvent(
    PARTICIPATE_LINKS_CHANGED_EVENT,
    participateQueryKeys.all
  )

  const data = linksQuery.data

  if (linksQuery.isLoading) {
    return (
      <div className="participate-page">
        <PageContentLoading variant="viewport" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="participate-page">
        <div className="admin-list-card page-content-error" role="alert">
          콘텐츠를 불러오지 못했습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="participate-page">
      <ParticipateLinksFormCard data={data} />
    </div>
  )
}
