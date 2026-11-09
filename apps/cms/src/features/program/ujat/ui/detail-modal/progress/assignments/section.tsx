import { useEffect, useMemo, useState } from 'react'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { getDefaultUjatEducationRegionKey } from '@/features/program/ujat/lib/ujat-education-regions'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import { UjatInstitutionApplicationRegionTabs } from '../../application-institution/list/region-tabs'
import type { EducationProgressHalfKey } from '../tabs'
import {
  UjatAssignmentSessionExcelButton,
  UjatAssignmentSessionGroupHeader,
  UjatAssignmentSessionGroupPanel,
} from './session-group-panel'
import { useUjatEducationProgressAssignments } from './use-list'
import './section.css'

export function UjatEducationProgressAssignmentsSection({
  programId,
  half,
}: {
  programId: string
  half: EducationProgressHalfKey
}) {
  const { regions } = useUjatEducationRegions()
  const [activeRegion, setActiveRegion] = useState<UjatInstitutionApplicationRegionKey>(
    getDefaultUjatEducationRegionKey
  )

  useEffect(() => {
    if (regions.length === 0) return
    if (regions.some(region => region.key === activeRegion)) return
    const next = regions[0]?.key?.trim()
    if (next) setActiveRegion(next)
  }, [activeRegion, regions])

  const {
    pendingFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    hasActiveFilters,
    resetRegionState,
    isLoading,
    isError,
    isRemote,
  } = useUjatEducationProgressAssignments(programId, half, activeRegion)

  const regionLabel = useMemo(
    () => regions.find(region => region.key === activeRegion)?.label ?? activeRegion,
    [activeRegion, regions]
  )

  const firstSession = sessionGroups[0]

  useEffect(() => {
    resetRegionState()
  }, [activeRegion, half, resetRegionState])

  return (
    <div className="ujat-education-progress-assignments">
      <UjatInstitutionApplicationRegionTabs
        activeRegion={activeRegion}
        onChange={setActiveRegion}
      />

      <FilterTableLayout
        className="ujat-education-progress-assignments__filter-layout"
        bordered={false}
        fields={filterFields}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        showFilter
        filterResponsiveWrap={false}
        hasActiveFilters={hasActiveFilters}
        title={firstSession ? <UjatAssignmentSessionGroupHeader session={firstSession} /> : null}
        hideExcelDownload
        actions={
          firstSession && (
            <UjatAssignmentSessionExcelButton session={firstSession} regionLabel={regionLabel} />
          
)
        }
        contentLoading={isLoading}
      >
        {isError ? (
          <div className="ujat-education-progress-assignments__empty" role="alert">
            과제 제출 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </div>
        ) : !isRemote ? (
          <div className="ujat-education-progress-assignments__empty">
            원격 API를 사용할 수 없어 과제 제출 목록을 표시하지 않습니다.
          </div>
        ) : sessionGroups.length === 0 ? (
          <div className="ujat-education-progress-assignments__empty">
            {hasActiveFilters ? '검색 결과가 없습니다.' : '등록된 교육 일정이 없습니다.'}
          </div>
        ) : (
          <div className="ujat-education-progress-assignments__groups">
            {sessionGroups.map((session, index) => (
              <UjatAssignmentSessionGroupPanel
                key={session.id}
                session={session}
                regionLabel={regionLabel}
                showHeader={index > 0}
              />
            ))}
          </div>
        )}
      </FilterTableLayout>
    </div>
  )
}
