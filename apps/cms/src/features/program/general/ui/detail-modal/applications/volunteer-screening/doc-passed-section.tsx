import { useCallback, type MouseEvent } from 'react'
import { Table } from 'antd'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { buildGeneralVolunteerDocPassedFilterRows } from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'
import {
  useGeneralVolunteerApplicantDetail,
  type GeneralVolunteerApplicantDetailMetaChangeHandler,
} from './use-detail'
import { GeneralVolunteerApplicantDetailView } from './detail-view'
import { useGeneralVolunteerDocPassed } from './use-doc-passed'
import './volunteer-screening.css'

const FILTER_ROWS = buildGeneralVolunteerDocPassedFilterRows()

export function GeneralVolunteerDocPassedSection({
  programId,
  onRegisterApplicantCloseHandler,
  onVolunteerApplicantDetailMetaChange,
}: {
  programId: string
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onVolunteerApplicantDetailMetaChange?: GeneralVolunteerApplicantDetailMetaChangeHandler
}) {
  const {
    list,
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    count,
    handleAssignInterview,
    requestWithdrawActivity,
  } = useGeneralVolunteerDocPassed({ programId })

  const { selectedApplicant, openApplicantDetail } = useGeneralVolunteerApplicantDetail({
    programId,
    list,
    variant: 'doc_passed',
    onRegisterApplicantCloseHandler,
    onVolunteerApplicantDetailMetaChange,
  })

  const handleRowClick = useCallback(
    (record: GeneralVolunteerApplicantRow, e: MouseEvent) => {
      if (record.interviewAssignmentStatus === 'withdrawn') return
      const target = e.target as HTMLElement
      if (target.closest('.ant-btn') || target.closest('button')) return
      openApplicantDetail(record)
    },
    [openApplicantDetail]
  )

  if (selectedApplicant) {
    return (
      <GeneralVolunteerApplicantDetailView
        variant="doc_passed"
        applicant={selectedApplicant}
        onAssignInterview={() => handleAssignInterview(selectedApplicant)}
        onWithdrawActivity={() => requestWithdrawActivity(selectedApplicant)}
      />
    )
  }

  return (
    <div className="general-volunteer-doc-passed applicant-details">
      <FilterTableLayout
        bordered={false}
        className="general-volunteer-doc-passed__filter-layout"
        rows={FILTER_ROWS}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="1차 서류 합격자"
        description={`${count.toLocaleString()}건`}
      >
        <div className="general-volunteer-doc-passed__table-wrap">
          <Table<GeneralVolunteerApplicantRow>
            rowKey="id"
            className="cms-data-table cms-data-table--fluid clickable-table general-volunteer-doc-passed__table"
            columns={columns}
            dataSource={tableData}
            pagination={false}
            tableLayout="fixed"
            onRow={record => ({
              onClick: e => handleRowClick(record, e),
              style: {
                cursor: record.interviewAssignmentStatus === 'withdrawn' ? 'default' : 'pointer',
              },
            })}
          />
        </div>
      </FilterTableLayout>
    </div>
  )
}
