import { useState } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import { UjatInstitutionApplicationRegionTabs } from '../list/region-tabs'
import type { UjatInstitutionApplicationRegionKey } from '../list/regions'
import { UjatInstitutionScheduleAssignSection } from './section'
import { UjatInstitutionScheduleSheetPreviewModal } from './schedule-sheet-preview-modal'
import './page.css'

export function UjatInstitutionScheduleAssignPage() {
  const [activeRegion, setActiveRegion] = useState<UjatInstitutionApplicationRegionKey>('seoul')
  const [scheduleSheetOpen, setScheduleSheetOpen] = useState(false)
  const [scheduleSheetRefreshKey, setScheduleSheetRefreshKey] = useState(0)

  const handleOpenScheduleSheet = () => {
    setScheduleSheetRefreshKey(key => key + 1)
    setScheduleSheetOpen(true)
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

      <UjatInstitutionScheduleSheetPreviewModal
        open={scheduleSheetOpen}
        refreshKey={scheduleSheetRefreshKey}
        onCancel={() => setScheduleSheetOpen(false)}
      />
    </div>
  )
}
