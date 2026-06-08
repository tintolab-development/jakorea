import { useMemo } from 'react'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import type { ParticipatingSchoolRow } from '@/data/mock/participating-schools'
import {
  SCHOOL_DETAIL_ATTENDANCE_EXCEL_COLUMNS,
  buildSchoolDetailAttendanceExcelRows,
} from '@/features/program/general/lib/school-detail-attendance-export'
import { useSchoolDetailAttendance } from '../../../hooks/use-school-detail-attendance'
import { SchoolDetailAttendanceSessionPanel } from './school-detail-attendance-session-panel'
import './school-detail-attendance-section.css'

export function SchoolDetailAttendanceSection({ row }: { row: ParticipatingSchoolRow }) {
  const {
    pendingFilters,
    appliedFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    saveSessionStudents,
    getSessionStudents,
  } = useSchoolDetailAttendance(row)

  const attendanceExcelRows = useMemo(
    () => buildSchoolDetailAttendanceExcelRows(sessionGroups),
    [sessionGroups]
  )

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
        title="출석 관리"
        excelExport={{
          columns: SCHOOL_DETAIL_ATTENDANCE_EXCEL_COLUMNS,
          data: attendanceExcelRows,
        }}
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
