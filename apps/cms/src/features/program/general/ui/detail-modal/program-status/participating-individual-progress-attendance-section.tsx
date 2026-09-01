import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { Spin } from 'antd'
import type { Program } from '@/types/domain'
import { useParticipatingIndividualProgressAttendance } from '@/features/program/general/hooks/use-participating-individual-progress-attendance'
import { ParticipatingIndividualProgressAttendanceSessionPanel } from './participating-individual-progress-attendance-session-panel'
import '@/shared/components/detail-info-form/detail-info-form.css'
import './school-detail-attendance-section.css'
import './participating-individual-progress-attendance-section.css'

export function ParticipatingIndividualProgressAttendanceSection({ program }: { program: Program }) {
  const {
    pendingFilters,
    appliedFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    saveSessionParticipant,
    getSessionParticipants,
    loading,
  } = useParticipatingIndividualProgressAttendance(program)

  if (loading) {
    return (
      <div className="participating-individual-progress-attendance-section school-detail-attendance-section flex min-h-[200px] items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="participating-individual-progress-attendance-section school-detail-attendance-section">
      <FilterTableLayout
        className="school-detail-attendance-section__filter-layout"
        bordered={false}
        filterResponsiveWrap={false}
        fields={filterFields}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        showFilter
        showTitle={false}
        hideExcelDownload
      >
        {sessionGroups.length === 0 ? (
          <div className="school-detail-attendance-section__empty">조회 결과가 없습니다.</div>
        ) : (
          <div className="school-detail-attendance-section__groups">
            {sessionGroups.map(session => (
              <ParticipatingIndividualProgressAttendanceSessionPanel
                key={session.id}
                session={session}
                appliedFilters={appliedFilters}
                getSessionParticipants={getSessionParticipants}
                onSaveParticipant={saveSessionParticipant}
              />
            ))}
          </div>
        )}
      </FilterTableLayout>
    </div>
  )
}
