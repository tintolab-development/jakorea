import { useState } from 'react'
import { useCmsAlert } from '@/shared/ui'
import { CmsButton } from '@/shared/ui/cms-button'
import { UjatInstitutionApplicationRegionTabs } from '../list/region-tabs'
import type { UjatInstitutionApplicationRegionKey } from '../list/regions'
import { UjatInstitutionScheduleAssignSection } from './section'
import './page.css'

export function UjatInstitutionScheduleAssignPage() {
  const { showAlert } = useCmsAlert()
  const [activeRegion, setActiveRegion] = useState<UjatInstitutionApplicationRegionKey>('seoul')

  const handleOpenScheduleSheet = () => {
    showAlert({
      title: '임시 교육 일정표',
      content: '임시 교육 일정표 확인 기능은 API 연동 후 제공됩니다.',
    })
  }

  return (
    <div className="ujat-schedule-assign-page">
      <div className="ujat-schedule-assign-page__tabs-row program-detail-fullpage-modal__tabs-row">
        <UjatInstitutionApplicationRegionTabs
          activeRegion={activeRegion}
          onChange={setActiveRegion}
        />
        <CmsButton type="button" width={180} onClick={handleOpenScheduleSheet}>
          임시 교육 일정표 확인
        </CmsButton>
      </div>

      <UjatInstitutionScheduleAssignSection key={activeRegion} regionKey={activeRegion} />
    </div>
  )
}
