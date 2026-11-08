/**
 * GNB 메뉴 관리
 */

import { useGnbMenu } from '@/features/gnb-menu/api/hooks'
import { GnbMenuSectionCards } from '@/features/gnb-menu/ui/gnb-menu-form'
import { PageContentLoading } from '@/shared/ui'

import './page.css'

export function GnbMenuPage() {
  const query = useGnbMenu()

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
      <GnbMenuSectionCards data={data} />
    </div>
  )
}
