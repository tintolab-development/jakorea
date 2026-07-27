import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Table } from 'antd'
import type { Application } from '@/types/domain'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { EmptyState } from '@/shared/ui'
import { useTablePage } from '@/shared/components/table-system/model/use-table-page'
import { userProgramsEnrollmentStubTableConfig } from '../user-programs-stub-table.config'
import { createProgramHistoryColumns } from '../detail-info/user-detail-program-history-columns'
import type { RendererProps } from '../user-programs-view-renderer'

export function EnrollmentTableView(props: RendererProps) {
  const {
    programsHistoryConfig,
    enrollmentTableRows,
    loading,
    onProgressStatusChange,
    onOpenLectureAttendance,
    onOpenAssignment,
    onRowClick,
  } = props
  const { enrollmentSectionTitle, enrollmentEmptyDescription } = programsHistoryConfig
  const [searchParams, setSearchParams] = useSearchParams()
  const enrollmentTableContext = useMemo(() => ({} as const), [])

  const { handleFilterChange, applySearch: handleEnrollmentSearchStub, displayedCount } =
    useTablePage(userProgramsEnrollmentStubTableConfig, {
      data: enrollmentTableRows,
      searchParams,
      setSearchParams,
      context: enrollmentTableContext,
    })

  const programHistoryColumns = useMemo(
    () =>
      createProgramHistoryColumns({
        onProgressStatusChange,
        onOpenLectureAttendance,
        onOpenAssignmentSubmission: onOpenAssignment,
      }),
    [onProgressStatusChange, onOpenLectureAttendance, onOpenAssignment]
  )

  return (
    <FilterTableLayout
      bordered={false}
      className="user-detail-fullpage-modal__enrollment-layout"
      fields={[]}
      filters={{}}
      onFilterChange={handleFilterChange}
      onSearch={handleEnrollmentSearchStub}
      title={enrollmentSectionTitle}
      description={`총 ${displayedCount.toLocaleString()}건`}
      excelExport={{
        columns: programHistoryColumns,
        data: enrollmentTableRows,
      }}
    >
      <div className="user-detail-modal__program-tab">
        {loading ? (
          <div className="user-detail-modal__loading">로딩 중...</div>
        ) : enrollmentTableRows.length > 0 ? (
          <Table
            className="cms-data-table"
            columns={programHistoryColumns}
            dataSource={enrollmentTableRows}
            rowKey="id"
            pagination={false}
            onRow={(record: Application) => ({
              onClick: e => {
                const target = e.target as HTMLElement
                if (
                  target.closest('.user-detail-modal__progress-cell') ||
                  target.closest('.user-detail-modal__attendance-link') ||
                  target.closest('.user-detail-modal__assignment-cell')
                )
                  return
                onRowClick(record)
              },
              style: { cursor: 'pointer' },
            })}
          />
        ) : (
          <div className="user-detail-modal__program-tab-empty">
            <EmptyState description={enrollmentEmptyDescription} />
          </div>
        )}
      </div>
    </FilterTableLayout>
  )
}
