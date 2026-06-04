import { useCallback, useMemo, type MouseEvent } from 'react'
import { Table } from 'antd'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton } from '@/shared/ui'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { buildGeneralVolunteerInterview2FilterRows } from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'
import { GENERAL_VOLUNTEER_INTERVIEW2_TABLE_SCROLL_X } from './interview2-columns'
import {
  useGeneralVolunteerApplicantDetail,
  type GeneralVolunteerApplicantDetailMetaChangeHandler,
} from './use-detail'
import { GeneralVolunteerApplicantDetailView } from './detail-view'
import { useGeneralVolunteerInterview2 } from './use-interview2'
import './volunteer-screening.css'

export function GeneralVolunteerInterview2Section({
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
    selectedRowKeys,
    setSelectedRowKeys,
    handleBulkFail,
    handleBulkPass,
    requestWithdrawActivity,
    requestInterview2Pass,
    requestInterview2Fail,
    filterRowsSource,
  } = useGeneralVolunteerInterview2({ programId })

  const filterRows = useMemo(
    () => buildGeneralVolunteerInterview2FilterRows(filterRowsSource),
    [filterRowsSource]
  )

  const { selectedApplicant, openApplicantDetail } = useGeneralVolunteerApplicantDetail({
    programId,
    list,
    variant: 'interview2',
    onRegisterApplicantCloseHandler,
    onVolunteerApplicantDetailMetaChange,
  })

  const handleRowClick = useCallback(
    (record: GeneralVolunteerApplicantRow, e: MouseEvent) => {
      if (record.interviewAssignmentStatus === 'withdrawn') return
      const target = e.target as HTMLElement
      if (
        target.closest('.ant-btn') ||
        target.closest('button') ||
        target.closest('.ant-checkbox-wrapper') ||
        target.closest('.ant-checkbox')
      ) {
        return
      }
      openApplicantDetail(record)
    },
    [openApplicantDetail]
  )

  if (selectedApplicant) {
    return (
      <GeneralVolunteerApplicantDetailView
        variant="interview2"
        applicant={selectedApplicant}
        onWithdrawActivity={() => requestWithdrawActivity(selectedApplicant)}
        onInterviewFail={() => requestInterview2Fail(selectedApplicant)}
        onInterviewPass={() => requestInterview2Pass(selectedApplicant)}
      />
    )
  }

  return (
    <div className="general-volunteer-interview2 applicant-details">
      <FilterTableLayout
        bordered={false}
        className="general-volunteer-interview2__filter-layout"
        rows={filterRows}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title={`2차 면접 대상자 (${count.toLocaleString()}건)`}
        actions={
          <div className="general-volunteer-screening__actions">
            <CmsButton type="button" variant="delete" size="large" width={160} onClick={handleBulkFail}>
              선택 불합격
            </CmsButton>
            <CmsButton type="button" variant="secondary" size="large" width={160} onClick={handleBulkPass}>
              선택 합격
            </CmsButton>
          </div>
        }
      >
        <div className="general-volunteer-interview2__table-wrap">
          <Table<GeneralVolunteerApplicantRow>
            rowKey="id"
            className="cms-data-table cms-data-table--fluid clickable-table"
            columns={columns}
            dataSource={tableData}
            pagination={false}
            tableLayout="fixed"
            scroll={{ x: GENERAL_VOLUNTEER_INTERVIEW2_TABLE_SCROLL_X }}
            rowSelection={{
              selectedRowKeys,
              onChange: keys => setSelectedRowKeys(keys),
            }}
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
