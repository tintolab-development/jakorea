import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import type { ParticipatingSchoolRow } from '@/data/mock/participating-schools'
import type { Program } from '@/types/domain'
import { useSchoolDetailAttendance } from '../../../hooks/use-school-detail-attendance'
import { SchoolDetailAttendanceSessionPanel } from './school-detail-attendance-session-panel'
import '@/shared/components/detail-info-form/detail-info-form.css'
import './school-detail-attendance-section.css'

export function SchoolDetailAttendanceSection({
  row,
  program,
}: {
  row: ParticipatingSchoolRow
  program: Program
}) {
  const {
    pendingFilters,
    appliedFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    saveSessionStudents,
    getSessionStudents,
  } = useSchoolDetailAttendance(row, program)

  return (
    <div className="school-detail-attendance-section">
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
              <SchoolDetailAttendanceSessionPanel
                key={session.id}
                session={session}
                appliedFilters={appliedFilters}
                getSessionStudents={getSessionStudents}
                onSave={saveSessionStudents}
              />
            ))}
          </div>
        )}
      </FilterTableLayout>
    </div>
  )
}
