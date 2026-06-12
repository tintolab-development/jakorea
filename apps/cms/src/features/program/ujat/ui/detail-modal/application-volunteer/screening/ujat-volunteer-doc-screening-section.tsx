import { useCallback, useRef, useState, type MouseEvent } from 'react'
import type { UjatEssayColumnKey } from './ujat-volunteer-doc-screening-columns'
import { Table } from 'antd'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH } from '@/shared/ui'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { buildUjatVolunteerDocScreeningFilterRows } from './ujat-volunteer-doc-screening-filter-fields'
import { UjatVolunteerDocScreeningResizableTitle } from './ujat-volunteer-doc-screening-resizable-title'
import { useUjatVolunteerDocScreeningColumnWidths } from './use-ujat-volunteer-doc-screening-column-widths'
import { useUjatVolunteerDocScreening } from './use-ujat-volunteer-doc-screening'
import {
  useUjatVolunteerApplicantDetail,
  type UjatVolunteerApplicantDetailMetaChangeHandler,
} from './use-ujat-volunteer-applicant-detail'
import { UjatVolunteerApplicantDetailView } from './ujat-volunteer-applicant-detail-view'
import './ujat-volunteer-doc-screening-section.css'
import '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail.css'

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
  onVolunteerApplicantDetailMetaChange?: UjatVolunteerApplicantDetailMetaChangeHandler
}

export function UjatVolunteerDocScreeningSection({
  programId,
  half,
  onRegisterApplicantCloseHandler,
  onVolunteerApplicantDetailMetaChange,
}: UjatVolunteerDocScreeningSectionProps) {
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const {
    essayColumnWidths,
    handleEssayColumnResizeStart,
    handleEssayColumnResizeStop,
    minTableScrollX,
  } = useUjatVolunteerDocScreeningColumnWidths()
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
    excelExport,
    showDocumentScreeningConfirm,
    documentScreeningConfirm,
    closeDocumentScreeningConfirm,
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
    detailVariant: 'doc_screening',
    applyDocumentScreeningStatus,
    onRegisterApplicantCloseHandler,
    onVolunteerApplicantDetailMetaChange,
    showDocumentScreeningConfirm,
  })

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
          variant="doc_screening"
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
              <CmsButton
                type="button"
                variant="delete"
                size="large"
                className="cms-button--action"
                width={CMS_ACTION_BUTTON_WIDTH}
                onClick={handleBulkReject}
              >
                선택 반려
              </CmsButton>
              <CmsButton
                type="button"
                variant="secondary"
                size="large"
                className="cms-button--action"
                width={CMS_ACTION_BUTTON_WIDTH}
                onClick={handleBulkApprove}
              >
                선택 승인
              </CmsButton>
            </div>
          }
          excelExport={excelExport}
        >
          <div
            ref={tableWrapRef}
            className={`ujat-volunteer-doc-screening__table-wrap${isResizing ? ' ujat-volunteer-doc-screening__table-wrap--resizing' : ''}`}
          >
            <Table<UjatVolunteerApplicantRow>
              rowKey="id"
              className="cms-data-table ujat-volunteer-doc-screening__table clickable-table"
              columns={columns}
              components={tableComponents}
              dataSource={tableData}
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: minTableScrollX }}
              rowSelection={{
                fixed: true,
                selectedRowKeys,
                onChange: keys => setSelectedRowKeys(keys),
              }}
              onRow={record => ({
                onClick: e => handleRowClick(record, e),
                style: { cursor: 'pointer' },
              })}
            />
          </div>
        </FilterTableLayout>
      </div>
    </>
  )
}
