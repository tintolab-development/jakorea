/**
 * 메인 콘텐츠 관리
 */

import {
  useImpactStoryOptions,
  useMainContents,
} from '@/features/main-content/api/hooks'
import { mainContentQueryKeys } from '@/features/main-content/api/query-keys'
import { MAIN_CONTENTS_CHANGED_EVENT } from '@/features/main-content/api/store'
import { DonationSectionCard } from '@/features/main-content/ui/donation-section'
import { EducationSectionCard } from '@/features/main-content/ui/education-section'
import { ImpactStorySectionCard } from '@/features/main-content/ui/impact-story-section'
import { PerformanceSectionCard } from '@/features/main-content/ui/performance-section'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'

import './page.css'

export function ContentsPage() {
  const contentsQuery = useMainContents()
  const optionsQuery = useImpactStoryOptions()

  useInvalidateOnWindowEvent(MAIN_CONTENTS_CHANGED_EVENT, mainContentQueryKeys.all)

  const data = contentsQuery.data
  const options = optionsQuery.data ?? []

  if (contentsQuery.isLoading || !data) {
    return (
      <div className="main-contents-page">
        <div className="admin-list-card">콘텐츠를 불러오는 중…</div>
      </div>
    )
  }

  return (
    <div className="main-contents-page">
      <EducationSectionCard data={data.education} />
      <ImpactStorySectionCard data={data.impactStory} options={options} />
      <PerformanceSectionCard data={data.performance} />
      <DonationSectionCard data={data.donation} />
    </div>
  )
}
