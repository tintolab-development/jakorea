/**
 * JA History 관리 — 섹션별 흰 카드. 페이지 높이는 잠그지 않는다.
 */

import { useJaHistory } from '@/features/ja-history/api/hooks'
import { jaHistoryQueryKeys } from '@/features/ja-history/api/query-keys'
import { JA_HISTORY_CHANGED_EVENT } from '@/features/ja-history/api/store'
import { CtaSection } from '@/features/ja-history/ui/cta-section'
import { EraSection } from '@/features/ja-history/ui/era-section'
import { HeroSection } from '@/features/ja-history/ui/hero-section'
import { OriginSection } from '@/features/ja-history/ui/origin-section'
import { PhilosophySection } from '@/features/ja-history/ui/philosophy-section'
import { ThriveSection } from '@/features/ja-history/ui/thrive-section'
import { TimelineSection } from '@/features/ja-history/ui/timeline-section'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { PageContentLoading } from '@/shared/ui'

import '@/features/ja-history/ui/ja-history.css'
import './page.css'

export function JaHistoryPage() {
  const query = useJaHistory()

  useInvalidateOnWindowEvent(JA_HISTORY_CHANGED_EVENT, jaHistoryQueryKeys.all)

  const data = query.data

  if (query.isLoading) {
    return (
      <div className="ja-history-page">
        <PageContentLoading variant="viewport" />
      </div>
    )
  }

  if (query.isError || !data) {
    return (
      <div className="ja-history-page">
        <div className="admin-list-card page-content-error" role="alert">
          JA History 정보를 불러오지 못했습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="ja-history-page">
      <HeroSection hero={data.hero} />
      <OriginSection origin={data.origin} />
      <EraSection eras={data.eras} />
      <TimelineSection
        variant="world"
        title="글로벌 JA 교육 - 연혁"
        modalTitle="글로벌 JA 교육 - 연혁 수정"
        timeline={data.worldTimeline}
      />
      <PhilosophySection philosophy={data.philosophy} />
      <TimelineSection
        variant="korea"
        title="한국에서 시작된 JA 교육 - 연혁"
        modalTitle="한국에서 시작된 JA 교육 - 연혁 수정"
        timeline={data.koreaTimeline}
      />
      <ThriveSection thrive={data.thrive} />
      <CtaSection cta={data.cta} />
    </div>
  )
}
