import {
  UJAT_INSTITUTION_APPLICATION_REGIONS,
  type UjatInstitutionApplicationRegionKey,
} from './ujat-institution-application-regions'
import './ujat-institution-application-region-tabs.css'

/** 프로그램 정보 > 모집 정보(`UjatProgramRecruitmentTabsRow`)와 동일한 탭 UI */
export function UjatInstitutionApplicationRegionTabs({
  activeRegion,
  onChange,
}: {
  activeRegion: UjatInstitutionApplicationRegionKey
  onChange: (region: UjatInstitutionApplicationRegionKey) => void
}) {
  return (
    <div className="program-detail-fullpage-modal__tabs-row ujat-institution-application-region-tabs">
      <div className="program-detail-fullpage-modal__tabs">
        {UJAT_INSTITUTION_APPLICATION_REGIONS.map(region => (
          <button
            key={region.key}
            type="button"
            className={`program-detail-fullpage-modal__tab ${activeRegion === region.key ? 'program-detail-fullpage-modal__tab--active' : ''}`}
            onClick={() => onChange(region.key)}
          >
            <span className="program-detail-fullpage-modal__tab-label">{region.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
