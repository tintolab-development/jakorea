/**
 * 재능기부 소개 관리 — 단일 흰 카드 안에 배너 · 방법 · 인터뷰
 */

import { useTalentDonationIntro } from '@/features/talent-donation-intro/api/hooks'
import { talentDonationIntroQueryKeys } from '@/features/talent-donation-intro/api/query-keys'
import { TALENT_DONATION_INTRO_CHANGED_EVENT } from '@/features/talent-donation-intro/api/store'
import { BannerSectionCard } from '@/features/talent-donation-intro/ui/banner-section'
import { HowSectionCard } from '@/features/talent-donation-intro/ui/how-section'
import { InterviewSectionCard } from '@/features/talent-donation-intro/ui/interview-section'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { PageContentLoading } from '@/shared/ui'

import './page.css'

export function TalentDonationIntroPage() {
  const query = useTalentDonationIntro()

  useInvalidateOnWindowEvent(
    TALENT_DONATION_INTRO_CHANGED_EVENT,
    talentDonationIntroQueryKeys.all
  )

  const data = query.data

  if (query.isLoading) {
    return (
      <div className="talent-intro-page">
        <PageContentLoading variant="viewport" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="talent-intro-page">
        <div className="admin-list-card talent-intro-card page-content-error" role="alert">
          재능기부 소개 정보를 불러오지 못했습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="talent-intro-page">
      <div className="admin-list-card talent-intro-card">
        <BannerSectionCard banner={data.banner} />
        <HowSectionCard items={data.howItems} />
        {data.interviews.map(slot => (
          <InterviewSectionCard key={slot.id} slot={slot} />
        ))}
      </div>
    </div>
  )
}
