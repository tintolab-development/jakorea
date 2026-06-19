import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import type { UjatInstitutionApplicationRegionKey } from './regions'
import './region-tabs.css'

/** 프로그램 정보 > 모집 정보(`UjatProgramRecruitmentTabsRow`)와 동일한 탭 UI */
export function UjatInstitutionApplicationRegionTabs({
  activeRegion,
  onChange,
}: {
  activeRegion: UjatInstitutionApplicationRegionKey
  onChange: (region: UjatInstitutionApplicationRegionKey) => void
}) {
  const { regions } = useUjatEducationRegions()
  return (
    <CmsTextTabs
      className="ujat-institution-application-region-tabs"
      activeKey={activeRegion}
      onChange={onChange}
      wrap
      items={regions.map(region => ({
        key: region.key as UjatInstitutionApplicationRegionKey,
        label: region.label,
      }))}
    />
  )
}
