import { useEffect, useState } from 'react'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import { UjatInstitutionApplicationRegionTabs } from '../../application-institution/list/region-tabs'
import type { EducationProgressHalfKey } from '../tabs'
import { UjatAttendanceSessionGroupPanel } from './session-group-panel'
import { useUjatEducationProgressAttendance } from './use-list'
import './section.css'

export function UjatEducationProgressAttendanceSection({
  half,
}: {
  half: EducationProgressHalfKey
}) {
  const [activeRegion, setActiveRegion] = useState<UjatInstitutionApplicationRegionKey>('seoul')

  const {
    pendingFilters,
    appliedFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    resetRegionState,
    saveSessionVolunteers,
    getSessionVolunteers,
  } = useUjatEducationProgressAttendance(half, activeRegion)

  useEffect(() => {
    resetRegionState()
  }, [activeRegion, half, resetRegionState])

  return (
    <div className="ujat-education-progress-attendance">
      <UjatInstitutionApplicationRegionTabs
        activeRegion={activeRegion}
        onChange={setActiveRegion}
      />

      <FilterTableLayout
        className="ujat-education-progress-attendance__filter-layout"
        bordered={false}
        fields={filterFields}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        showFilter
      >
        {sessionGroups.length === 0 ? (
          <div className="ujat-education-progress-attendance__empty">
            조회 결과가 없습니다.
          </div>
        ) : (
          <div className="ujat-education-progress-attendance__groups">
            {sessionGroups.map(session => (
              <UjatAttendanceSessionGroupPanel
                key={session.id}
                session={session}
                appliedFilters={appliedFilters}
                getSessionVolunteers={getSessionVolunteers}
                onSave={saveSessionVolunteers}
              />
            ))}
          </div>
        )}
      </FilterTableLayout>
    </div>
  )
}
