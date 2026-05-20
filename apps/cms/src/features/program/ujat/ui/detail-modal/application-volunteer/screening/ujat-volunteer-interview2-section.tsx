import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Table } from 'antd'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton } from '@/shared/ui'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { buildUjatVolunteerInterview2FilterRows } from './ujat-volunteer-interview2-filter-fields'
import { useUjatVolunteerInterview2 } from './use-ujat-volunteer-interview2'
import { UjatVolunteerDocPassedCalendarView } from './ujat-volunteer-doc-passed-calendar-view'
import { UJAT_VOLUNTEER_INTERVIEW2_TABLE_SCROLL_X } from './ujat-volunteer-interview2-columns'
import './ujat-volunteer-interview2-section.css'
import './ujat-volunteer-doc-screening-section.css'
import '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail.css'

export interface UjatVolunteerInterview2SectionProps {
  programId: string
  half: UjatVolunteerRecruitHalf
}

export function UjatVolunteerInterview2Section({ programId, half }: UjatVolunteerInterview2SectionProps) {
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const [tableScrollX, setTableScrollX] = useState(UJAT_VOLUNTEER_INTERVIEW2_TABLE_SCROLL_X)

  const {
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    count,
    viewMode,
    handleViewCalendar,
    handleViewList,
    calendarEvents,
    selectedRowKeys,
    setSelectedRowKeys,
    handleBulkFail,
    handleBulkPass,
    interview2Confirm,
    closeInterview2Confirm,
    filterRowsSource,
  } = useUjatVolunteerInterview2({ programId, half })

  const filterRows = useMemo(
    () => buildUjatVolunteerInterview2FilterRows(filterRowsSource),
    [filterRowsSource]
  )

  useLayoutEffect(() => {
    const el = tableWrapRef.current
    if (!el) return
    const minW = UJAT_VOLUNTEER_INTERVIEW2_TABLE_SCROLL_X
    const update = () => {
      const w = el.getBoundingClientRect().width
      setTableScrollX(Math.max(minW, Math.floor(w)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const interview2ConfirmModal =
    interview2Confirm != null ? (
      <ConfirmModal
        open
        title={interview2Confirm.title}
        content={interview2Confirm.content}
        confirmText={interview2Confirm.confirmText}
        cancelText="취소"
        danger={interview2Confirm.danger}
        onConfirm={() => {
          interview2Confirm.onConfirm()
          closeInterview2Confirm()
        }}
        onCancel={closeInterview2Confirm}
      />
    ) : null

  return (
    <div className="ujat-volunteer-interview2 applicant-details">
      {interview2ConfirmModal}
      <FilterTableLayout
        bordered={false}
        className="ujat-volunteer-interview2__filter-layout"
        rows={filterRows}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title={
          <div className="ujat-volunteer-interview2__toolbar-main">
            <span className="ujat-volunteer-interview2__toolbar-title">
              봉사자 2차 면접 대상자 목록
            </span>
            <span className="ujat-volunteer-interview2__toolbar-count">{count}건</span>
          </div>
        }
        actions={
          <div className="ujat-volunteer-interview2__actions">
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              width={160}
              disabled={selectedRowKeys.length === 0}
              onClick={handleBulkFail}
            >
              선택 불합격
            </CmsButton>
            <CmsButton
              type="button"
              variant="secondary"
              size="large"
              width={160}
              disabled={selectedRowKeys.length === 0}
              onClick={handleBulkPass}
            >
              선택 합격
            </CmsButton>
            {viewMode === 'list' ? (
              <CmsButton
                type="button"
                variant="secondary"
                size="large"
                style={{ minWidth: 180 }}
                icon={<CalendarOutlined />}
                onClick={handleViewCalendar}
              >
                캘린더 뷰로 보기
              </CmsButton>
            ) : (
              <CmsButton
                type="button"
                variant="secondary"
                size="large"
                style={{ minWidth: 180 }}
                icon={<UnorderedListOutlined />}
                onClick={handleViewList}
              >
                리스트로 보기
              </CmsButton>
            )}
          </div>
        }
      >
        {viewMode === 'list' ? (
          <div ref={tableWrapRef} className="ujat-volunteer-interview2__table-wrap">
            <Table<UjatVolunteerApplicantRow>
              rowKey="id"
              className="cms-data-table cms-data-table--fluid"
              columns={columns}
              dataSource={tableData}
              pagination={false}
              scroll={{ x: tableScrollX }}
              rowSelection={{
                selectedRowKeys,
                onChange: keys => setSelectedRowKeys(keys),
              }}
            />
          </div>
        ) : (
          <div className="ujat-volunteer-interview2__calendar-container">
            <UjatVolunteerDocPassedCalendarView
              events={calendarEvents}
              onItemClick={() => undefined}
            />
          </div>
        )}
      </FilterTableLayout>
    </div>
  )
}
