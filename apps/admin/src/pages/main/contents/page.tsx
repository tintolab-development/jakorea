/**
 * 메인 콘텐츠 관리
 */

import { useEffect } from 'react'
import {
  useImpactStoryOptions,
  useMainContents,
} from '@/features/main-content/api/hooks'
import { MAIN_CONTENTS_CHANGED_EVENT } from '@/features/main-content/api/store'
import { DonationSectionCard } from '@/features/main-content/ui/donation-section'
import { EducationSectionCard } from '@/features/main-content/ui/education-section'
import { ImpactStorySectionCard } from '@/features/main-content/ui/impact-story-section'
import { PerformanceSectionCard } from '@/features/main-content/ui/performance-section'

import './page.css'

export function ContentsPage() {
  const contentsQuery = useMainContents()
  const optionsQuery = useImpactStoryOptions()

  useEffect(() => {
    const handler = () => {
      void contentsQuery.refetch()
    }
    window.addEventListener(MAIN_CONTENTS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(MAIN_CONTENTS_CHANGED_EVENT, handler)
  }, [contentsQuery])

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
