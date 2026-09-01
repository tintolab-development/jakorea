import { useEffect, useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { getDefaultUjatEducationRegionKey } from '@/features/program/ujat/lib/ujat-education-regions'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import { UjatInstitutionApplicationRegionTabs } from '../../application-institution/list/region-tabs'
import type { EducationProgressHalfKey } from '../tabs'
import {
  assignmentSubmissionStatusLabel,
  formatAssignmentRemarks,
  resolveAssignmentSubmissionStatus,
} from './assignment-display'
import { filterAssignmentVolunteersForDisplay } from './use-list'
import {
  UjatAssignmentSessionGroupHeader,
  UjatAssignmentSessionGroupPanel,
} from './session-group-panel'
import { useUjatEducationProgressAssignments } from './use-list'
import './section.css'

type UjatAssignmentExcelRow = {
  sessionLabel: string
  no: number
  name: string
  institutionName: string
  assignedClass: string
  submissionStatusLabel: string
  remarks: string
}

const UJAT_ASSIGNMENT_EXCEL_COLUMNS: ColumnsType<UjatAssignmentExcelRow> = [
  { title: '교육 일정', dataIndex: 'sessionLabel', key: 'sessionLabel' },
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '봉사자명', dataIndex: 'name', key: 'name' },
  { title: '배정 기관', dataIndex: 'institutionName', key: 'institutionName' },
  { title: '배정 학급', dataIndex: 'assignedClass', key: 'assignedClass' },
  { title: '제출 현황', dataIndex: 'submissionStatusLabel', key: 'submissionStatusLabel' },
  { title: '비고', dataIndex: 'remarks', key: 'remarks' },
]

export function UjatEducationProgressAssignmentsSection({
  half,
}: {
  half: EducationProgressHalfKey
}) {
  const [activeRegion, setActiveRegion] = useState<UjatInstitutionApplicationRegionKey>(
    getDefaultUjatEducationRegionKey
  )

  const {
    pendingFilters,
    appliedFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    resetRegionState,
  } = useUjatEducationProgressAssignments(half, activeRegion)

  const assignmentExcelRows = useMemo(() => {
    const rows: UjatAssignmentExcelRow[] = []

    for (const session of sessionGroups) {
      const volunteers = filterAssignmentVolunteersForDisplay(
        session.volunteers,
        appliedFilters
      )
      const total = volunteers.length
      volunteers.forEach((volunteer, index) => {
        rows.push({
          sessionLabel: session.dateLabel,
          no: total - index,
          name: volunteer.name,
          institutionName: volunteer.institutionName,
          assignedClass: volunteer.assignedClass,
          submissionStatusLabel: assignmentSubmissionStatusLabel(
            resolveAssignmentSubmissionStatus(volunteer)
          ),
          remarks: formatAssignmentRemarks(volunteer),
        })
      })
    }

    return rows
  }, [appliedFilters, sessionGroups])

  const firstSessionTitle = useMemo(() => {
    const [firstSession] = sessionGroups
    if (!firstSession) return null
    const firstSessionRows = filterAssignmentVolunteersForDisplay(
      firstSession.volunteers,
      appliedFilters
    )

    return (
      <UjatAssignmentSessionGroupHeader
        session={firstSession}
        totalCount={firstSessionRows.length}
      />
    )
  }, [appliedFilters, sessionGroups])

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
        title={firstSessionTitle}
        excelExport={{
          columns: UJAT_ASSIGNMENT_EXCEL_COLUMNS,
          data: assignmentExcelRows,
        }}
      >
        {sessionGroups.length === 0 ? (
          <div className="ujat-education-progress-assignments__empty">
            조회 결과가 없습니다.
          </div>
        ) : (
          <div className="ujat-education-progress-assignments__groups">
            {sessionGroups.map(session => (
              <UjatAssignmentSessionGroupPanel
                key={session.id}
                session={session}
                appliedFilters={appliedFilters}
                showHeader={session.id !== sessionGroups[0]?.id}
              />
            ))}
          </div>
        )}
      </FilterTableLayout>
    </div>
  )
}
