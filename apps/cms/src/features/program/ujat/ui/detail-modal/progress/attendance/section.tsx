import { useEffect, useMemo, useState } from 'react'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { ExcelButton, FilterTableToolbarButton } from '@/shared/ui'
import { getDefaultUjatEducationRegionKey } from '@/features/program/ujat/lib/ujat-education-regions'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import { UjatInstitutionApplicationRegionTabs } from '../../application-institution/list/region-tabs'
import type { EducationProgressHalfKey } from '../tabs'
import {
  UJAT_ATTENDANCE_SESSION_EXCEL_COLUMNS,
  buildUjatAttendanceSessionExcelRows,
  resolveUjatAttendanceSessionExcelFilename,
} from './attendance-excel'
import { filterAttendanceVolunteersForDisplay } from './use-list'
import {
  UjatAttendanceSessionGroupHeader,
  UjatAttendanceSessionGroupPanel,
} from './session-group-panel'
import { useUjatEducationProgressAttendance } from './use-list'
import './section.css'

export function UjatEducationProgressAttendanceSection({
  programId,
  half,
}: {
  programId: string
  half: EducationProgressHalfKey
}) {
  const [activeRegion, setActiveRegion] = useState<UjatInstitutionApplicationRegionKey>(
    getDefaultUjatEducationRegionKey
  )
  const [openFirstSessionCorrection, setOpenFirstSessionCorrection] = useState<(() => void) | null>(
    null
  )

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
  } = useUjatEducationProgressAttendance(programId, half, activeRegion)

  const firstSession = sessionGroups[0]

  const firstSessionDisplayRows = useMemo(() => {
    if (!firstSession) return []
    return filterAttendanceVolunteersForDisplay(
      getSessionVolunteers(firstSession.id),
      appliedFilters
    )
  }, [appliedFilters, firstSession, getSessionVolunteers])

  const firstSessionExcelRows = useMemo(
    () => buildUjatAttendanceSessionExcelRows(firstSessionDisplayRows),
    [firstSessionDisplayRows]
  )

  const { exportExcel: exportFirstSessionExcel, isExporting: isFirstSessionExporting } =
    useTableExcelExport({
      columns: UJAT_ATTENDANCE_SESSION_EXCEL_COLUMNS,
      data: firstSessionExcelRows,
      filename: firstSession ? resolveUjatAttendanceSessionExcelFilename(firstSession) : '출석관리',
    })

  const firstSessionTitle = useMemo(() => {
    if (!firstSession) return null

    return (
      <UjatAttendanceSessionGroupHeader
        session={firstSession}
        totalCount={firstSessionDisplayRows.length}
      />
    )
  }, [firstSession, firstSessionDisplayRows])

  useEffect(() => {
    resetRegionState()
  }, [activeRegion, half, resetRegionState])

  useEffect(() => {
    setOpenFirstSessionCorrection(null)
  }, [activeRegion, half])

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
        title={firstSessionTitle}
        hideExcelDownload
        actions={
          firstSessionTitle != null ? (
            <div className="program-application-list-toolbar">
              <FilterTableToolbarButton
                type="button"
                variant="secondary"
                onClick={() => openFirstSessionCorrection?.()} >
                출결 정정
              </FilterTableToolbarButton>
              <ExcelButton loading={isFirstSessionExporting} onClick={exportFirstSessionExcel} />
            </div>
          ) : null
        }
      >
        {sessionGroups.length === 0 ? (
          <div className="ujat-education-progress-attendance__empty">조회 결과가 없습니다.</div>
        ) : (
          <div className="ujat-education-progress-attendance__groups">
            {sessionGroups.map(session => (
              <UjatAttendanceSessionGroupPanel
                key={session.id}
                session={session}
                appliedFilters={appliedFilters}
                getSessionVolunteers={getSessionVolunteers}
                onSave={saveSessionVolunteers}
                showHeader={session.id !== sessionGroups[0]?.id}
                onBindOpenCorrection={
                  session.id === sessionGroups[0]?.id
                    ? openCorrection => setOpenFirstSessionCorrection(() => openCorrection)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </FilterTableLayout>
    </div>
  )
}
