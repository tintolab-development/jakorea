import { useCallback, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import type { UjatEssayColumnKey } from './ujat-volunteer-doc-screening-columns'
import { Table } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { AppButton } from '@/shared/ui/app-button'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import type { UjatVolunteerRecruitHalf } from '@/features/program/model/ujat-volunteer-screening-constants'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { buildUjatVolunteerDocScreeningFilterRows } from './ujat-volunteer-doc-screening-filter-fields'
import { UjatVolunteerDocScreeningResizableTitle } from './ujat-volunteer-doc-screening-resizable-title'
import { useUjatVolunteerDocScreeningColumnWidths } from './use-ujat-volunteer-doc-screening-column-widths'
import { useUjatVolunteerDocScreening } from './use-ujat-volunteer-doc-screening'
import { useUjatVolunteerApplicantDetail } from './use-ujat-volunteer-applicant-detail'
import { UjatVolunteerApplicantDetailView } from './ujat-volunteer-applicant-detail-view'
import './ujat-volunteer-doc-screening-section.css'
import '@/features/program/program-detail/ui/applicant-list/applicants-detail.css'

const FILTER_ROWS = buildUjatVolunteerDocScreeningFilterRows()

const tableComponents = {
  header: {
    cell: UjatVolunteerDocScreeningResizableTitle,
  },
}

export interface UjatVolunteerDocScreeningSectionProps {
  programId: string
  half: UjatVolunteerRecruitHalf
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onVolunteerApplicantDetailTitleChange?: (title: string | null) => void
}

export function UjatVolunteerDocScreeningSection({
  programId,
  half,
  onRegisterApplicantCloseHandler,
  onVolunteerApplicantDetailTitleChange,
}: UjatVolunteerDocScreeningSectionProps) {
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const {
    essayColumnWidths,
    handleEssayColumnResizeStart,
    handleEssayColumnResizeStop,
    minTableScrollX,
    isResizingRef,
  } = useUjatVolunteerDocScreeningColumnWidths()
  const [tableScrollX, setTableScrollX] = useState(minTableScrollX)
  const [isResizing, setIsResizing] = useState(false)

  const onEssayColumnResizeStart = useCallback(() => {
    handleEssayColumnResizeStart()
    setIsResizing(true)
  }, [handleEssayColumnResizeStart])

  const onEssayColumnResizeStop = useCallback(
    (key: UjatEssayColumnKey, width: number) => {
      handleEssayColumnResizeStop(key, width)
      setIsResizing(false)
    },
    [handleEssayColumnResizeStop]
  )

  const {
    list,
    applyDocumentScreeningStatus,
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    selectedRowKeys,
    setSelectedRowKeys,
    handleBulkReject,
    handleBulkApprove,
    handleExportExcel,
    showDocumentScreeningConfirm,
    documentScreeningConfirm,
    closeDocumentScreeningConfirm,
    isExporting,
    count,
    openManagerDropdown,
    setOpenManagerDropdown,
    onManagerAEvaluationChange,
    onManagerBEvaluationChange,
  } = useUjatVolunteerDocScreening({
    programId,
    half,
    essayColumnWidths,
    onEssayColumnResizeStart,
    onEssayColumnResizeStop,
    tableWrapRef,
  })

  const {
    selectedApplicant,
    openApplicantDetail,
    handleDocumentReject,
    handleDocumentApprove,
  } = useUjatVolunteerApplicantDetail({
    programId,
    half,
    list,
    applyDocumentScreeningStatus,
    onRegisterApplicantCloseHandler,
    onVolunteerApplicantDetailTitleChange,
    showDocumentScreeningConfirm,
  })

  useLayoutEffect(() => {
    const el = tableWrapRef.current
    if (!el) return
    const update = () => {
      if (isResizingRef.current) return
      const w = el.getBoundingClientRect().width
      setTableScrollX(Math.max(minTableScrollX, Math.floor(w)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [minTableScrollX, isResizingRef])

  useLayoutEffect(() => {
    if (isResizingRef.current) return
    const el = tableWrapRef.current
    if (!el) return
    const w = el.getBoundingClientRect().width
    setTableScrollX(Math.max(minTableScrollX, Math.floor(w)))
  }, [minTableScrollX, isResizingRef])

  const scrollConfig = useMemo(() => ({ x: tableScrollX }), [tableScrollX])

  const handleRowClick = useCallback(
    (record: UjatVolunteerApplicantRow, e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest('.ant-table-selection-column') ||
        target.closest('.ant-checkbox-wrapper') ||
        target.closest('.status-dropdown-cell__status-trigger') ||
        target.closest('.react-resizable-handle')
      ) {
        return
      }
      openApplicantDetail(record)
    },
    [openApplicantDetail]
  )

  const documentScreeningConfirmModal =
    documentScreeningConfirm != null ? (
      <ConfirmModal
        open
        title={documentScreeningConfirm.title}
        content={documentScreeningConfirm.content}
        confirmText={documentScreeningConfirm.confirmText}
        cancelText="취소"
        danger={documentScreeningConfirm.danger}
        onConfirm={() => {
          documentScreeningConfirm.onConfirm()
          closeDocumentScreeningConfirm()
        }}
        onCancel={closeDocumentScreeningConfirm}
      />
    ) : null

  if (selectedApplicant) {
    return (
      <>
        {documentScreeningConfirmModal}
        <UjatVolunteerApplicantDetailView
          applicant={selectedApplicant}
          onDocumentReject={handleDocumentReject}
          onDocumentApprove={handleDocumentApprove}
          openManagerDropdown={openManagerDropdown}
          setOpenManagerDropdown={setOpenManagerDropdown}
          onManagerAEvaluationChange={onManagerAEvaluationChange}
          onManagerBEvaluationChange={onManagerBEvaluationChange}
        />
      </>
    )
  }

  return (
    <>
      {documentScreeningConfirmModal}
      <div className="ujat-volunteer-doc-screening applicant-details">
      <FilterTableLayout
        bordered={false}
        className="ujat-volunteer-doc-screening__filter-layout"
        rows={FILTER_ROWS}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title={`봉사자 신청 목록 (${count.toLocaleString()})`}
        actions={
          <div className="ujat-volunteer-doc-screening__actions">
            <AppButton
              variant="danger"
              size="filter"
              disabled={selectedRowKeys.length === 0}
              onClick={handleBulkReject}
            >
              선택 반려
            </AppButton>
            <AppButton
              variant="cancel"
              size="filter"
              disabled={selectedRowKeys.length === 0}
              onClick={handleBulkApprove}
            >
              선택 승인
            </AppButton>
            <AppButton
              variant="primary"
              size="filter"
              icon={<DownloadOutlined />}
              className="ujat-volunteer-doc-screening__btn-excel"
              loading={isExporting}
              disabled={tableData.length === 0}
              onClick={handleExportExcel}
            >
              엑셀 다운로드
            </AppButton>
          </div>
        }
      >
        <div
          ref={tableWrapRef}
          className={`ujat-volunteer-doc-screening__table-wrap${isResizing ? ' ujat-volunteer-doc-screening__table-wrap--resizing' : ''}`}
        >
          <Table<UjatVolunteerApplicantRow>
            rowKey="id"
            className="cms-data-table cms-data-table--fluid clickable-table"
            columns={columns}
            components={tableComponents}
            dataSource={tableData}
            pagination={false}
            scroll={scrollConfig}
            rowSelection={{
              selectedRowKeys,
              onChange: keys => setSelectedRowKeys(keys),
            }}
            onRow={record => ({
              onClick: e => handleRowClick(record, e),
            })}
          />
        </div>
      </FilterTableLayout>
      </div>
    </>
  )
}
