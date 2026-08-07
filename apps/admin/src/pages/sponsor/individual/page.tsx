/**
 * 개인후원 관리 — 단일 흰 카드 안에 3개 항목 테이블
 */

import { useIndividualDonation } from '@/features/individual-donation/api/hooks'
import { individualDonationQueryKeys } from '@/features/individual-donation/api/query-keys'
import { INDIVIDUAL_DONATION_CHANGED_EVENT } from '@/features/individual-donation/api/store'
import { BannerSectionCard } from '@/features/individual-donation/ui/banner-section'
import { DonateCtaSectionCard } from '@/features/individual-donation/ui/donate-cta-section'
import { UsageGuideSectionCard } from '@/features/individual-donation/ui/usage-guide-section'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { PageContentLoading } from '@/shared/ui'

import './page.css'

export function IndividualDonationPage() {
  const query = useIndividualDonation()

  useInvalidateOnWindowEvent(
    INDIVIDUAL_DONATION_CHANGED_EVENT,
    individualDonationQueryKeys.all
  )

  const data = query.data

  if (query.isLoading) {
    return (
      <div className="individual-donation-page">
        <PageContentLoading variant="viewport" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="individual-donation-page">
        <div className="admin-list-card individual-donation-card page-content-error" role="alert">
          개인후원 정보를 불러오지 못했습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="individual-donation-page">
      <div className="admin-list-card individual-donation-card">
        <BannerSectionCard banner={data.banner} />
        <UsageGuideSectionCard items={data.usageGuideItems} />
        <DonateCtaSectionCard donateCta={data.donateCta} />
      </div>
    </div>
  )
}
