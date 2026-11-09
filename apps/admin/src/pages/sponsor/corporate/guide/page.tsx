/**
 * 기업후원 안내 관리 — 섹션별 흰 카드 3개, 간격 32 (Figma 36:46024 · 푸터 관리와 동일 구조)
 */

import { useCorporateGuide } from '@/features/corporate-guide/api/hooks'
import { corporateGuideQueryKeys } from '@/features/corporate-guide/api/query-keys'
import { CORPORATE_GUIDE_CHANGED_EVENT } from '@/features/corporate-guide/api/store'
import { BannerSectionCard } from '@/features/corporate-guide/ui/banner-section'
import { MetricsSectionCard } from '@/features/corporate-guide/ui/metrics-section'
import { PartnershipSectionCard } from '@/features/corporate-guide/ui/partnership-section'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { PageContentLoading } from '@/shared/ui'

import './page.css'

export function CorporateGuidePage() {
  const query = useCorporateGuide()

  useInvalidateOnWindowEvent(CORPORATE_GUIDE_CHANGED_EVENT, corporateGuideQueryKeys.all)

  const data = query.data

  if (query.isLoading) {
    return (
      <div className="corporate-guide-page">
        <PageContentLoading variant="viewport" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="corporate-guide-page">
        <div className="admin-list-card corporate-guide-card page-content-error" role="alert">
          기업후원 안내 정보를 불러오지 못했습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="corporate-guide-page">
      <BannerSectionCard banner={data.banner} />
      <MetricsSectionCard items={data.metrics} />
      <PartnershipSectionCard items={data.partnershipSteps} />
    </div>
  )
}
