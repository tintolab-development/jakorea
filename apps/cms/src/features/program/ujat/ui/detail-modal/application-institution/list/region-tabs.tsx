import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import {
  UJAT_INSTITUTION_APPLICATION_REGIONS,
  type UjatInstitutionApplicationRegionKey,
} from './regions'
import './region-tabs.css'

/** 프로그램 정보 > 모집 정보(`UjatProgramRecruitmentTabsRow`)와 동일한 탭 UI */
export function UjatInstitutionApplicationRegionTabs({
  activeRegion,
  onChange,
}: {
  activeRegion: UjatInstitutionApplicationRegionKey
  onChange: (region: UjatInstitutionApplicationRegionKey) => void
}) {
  return (
    <CmsTextTabs
      className="ujat-institution-application-region-tabs"
      activeKey={activeRegion}
      onChange={onChange}
      wrap
      items={UJAT_INSTITUTION_APPLICATION_REGIONS.map(region => ({
        key: region.key,
        label: region.label,
      }))}
    />
  )
}
