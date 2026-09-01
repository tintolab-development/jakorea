/**
 * 채용 안내 관리
 */

import { useRecruitGuide } from '@/features/recruit-guide/api/hooks'
import { recruitGuideQueryKeys } from '@/features/recruit-guide/api/query-keys'
import { RECRUIT_GUIDE_CHANGED_EVENT } from '@/features/recruit-guide/api/store'
import { BannerSectionCard } from '@/features/recruit-guide/ui/banner-section'
import { CultureSectionCard } from '@/features/recruit-guide/ui/culture-section'
import { InterviewSectionCard } from '@/features/recruit-guide/ui/interview-section'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { PageContentLoading } from '@/shared/ui'

import './page.css'

export function RecruitGuidePage() {
  const query = useRecruitGuide()

  useInvalidateOnWindowEvent(RECRUIT_GUIDE_CHANGED_EVENT, recruitGuideQueryKeys.all)

  const data = query.data

  if (query.isLoading) {
    return (
      <div className="recruit-guide-page">
        <PageContentLoading variant="viewport" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="recruit-guide-page">
        <div className="admin-list-card recruit-guide-card page-content-error" role="alert">
          채용 안내 정보를 불러오지 못했습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="recruit-guide-page">
      <div className="admin-list-card recruit-guide-card">
        <BannerSectionCard banner={data.banner} />
        <CultureSectionCard items={data.cultureItems} />
        <InterviewSectionCard items={data.interviews} />
      </div>
    </div>
  )
}
