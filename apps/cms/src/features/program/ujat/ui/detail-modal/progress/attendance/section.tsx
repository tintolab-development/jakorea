import { useEffect, useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import { UjatInstitutionApplicationRegionTabs } from '../../application-institution/list/region-tabs'
import type { EducationProgressHalfKey } from '../tabs'
import {
  attendanceStatusLabel,
  formatAttendanceRemarks,
  maskAttendanceContact,
  maskAttendanceEmail,
} from './attendance-display'
import { filterAttendanceVolunteersForDisplay } from './use-list'
import { UjatAttendanceSessionGroupPanel } from './session-group-panel'
import { useUjatEducationProgressAttendance } from './use-list'
import './section.css'

type UjatAttendanceExcelRow = {
  sessionLabel: string
  no: number
  name: string
  assignedClass: string
  contact: string
  email: string
  statusLabel: string
  remarks: string
}

const UJAT_ATTENDANCE_EXCEL_COLUMNS: ColumnsType<UjatAttendanceExcelRow> = [
  { title: '교육 일정', dataIndex: 'sessionLabel', key: 'sessionLabel' },
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '봉사자명', dataIndex: 'name', key: 'name' },
  { title: '배정 학급', dataIndex: 'assignedClass', key: 'assignedClass' },
  { title: '연락처', dataIndex: 'contact', key: 'contact' },
  { title: '이메일', dataIndex: 'email', key: 'email' },
  { title: '교육 출결 현황', dataIndex: 'statusLabel', key: 'statusLabel' },
  { title: '비고', dataIndex: 'remarks', key: 'remarks' },
]

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

  const attendanceExcelRows = useMemo(() => {
    const rows: UjatAttendanceExcelRow[] = []

    for (const session of sessionGroups) {
      const volunteers = filterAttendanceVolunteersForDisplay(
        getSessionVolunteers(session.id),
        appliedFilters
      )
      const total = volunteers.length
      volunteers.forEach((volunteer, index) => {
        rows.push({
          sessionLabel: session.dateLabel,
          no: total - index,
          name: volunteer.name,
          assignedClass: volunteer.assignedClass,
          contact: maskAttendanceContact(volunteer.contact),
          email: maskAttendanceEmail(volunteer.email),
          statusLabel: attendanceStatusLabel(volunteer.status),
          remarks: formatAttendanceRemarks(volunteer),
        })
      })
    }

    return rows
  }, [appliedFilters, getSessionVolunteers, sessionGroups])

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
        title="출결 관리"
        excelExport={{
          columns: UJAT_ATTENDANCE_EXCEL_COLUMNS,
          data: attendanceExcelRows,
        }}
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
