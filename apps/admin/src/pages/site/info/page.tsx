/**
 * 사이트 정보 관리
 */

import { useSiteInfo } from '@/features/site-info/api/hooks'
import { SiteInfoFormCard } from '@/features/site-info/ui/site-info-form'
import { PageContentLoading } from '@/shared/ui'

import './page.css'

export function SiteInfoPage() {
  const siteQuery = useSiteInfo()

  const data = siteQuery.data

  if (siteQuery.isLoading) {
    return (
      <div className="site-info-page">
        <PageContentLoading variant="viewport" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="site-info-page">
        <div className="admin-list-card page-content-error" role="alert">
          콘텐츠를 불러오지 못했습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="site-info-page">
      <SiteInfoFormCard data={data} />
    </div>
  )
}
