/**
 * GNB 메뉴 관리
 */

import { useGnbMenu } from '@/features/gnb-menu/api/hooks'
import { gnbMenuQueryKeys } from '@/features/gnb-menu/api/query-keys'
import { GNB_MENU_CHANGED_EVENT } from '@/features/gnb-menu/api/store'
import { GnbMenuFormCard } from '@/features/gnb-menu/ui/gnb-menu-form'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { PageContentLoading } from '@/shared/ui'

import './page.css'

export function GnbMenuPage() {
  const query = useGnbMenu()

  useInvalidateOnWindowEvent(GNB_MENU_CHANGED_EVENT, gnbMenuQueryKeys.all)

  const data = query.data

  if (query.isLoading) {
    return (
      <div className="gnb-menu-page">
        <PageContentLoading variant="viewport" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="gnb-menu-page">
        <div className="admin-list-card page-content-error" role="alert">
          콘텐츠를 불러오지 못했습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="gnb-menu-page">
      <GnbMenuFormCard data={data} />
    </div>
  )
}
