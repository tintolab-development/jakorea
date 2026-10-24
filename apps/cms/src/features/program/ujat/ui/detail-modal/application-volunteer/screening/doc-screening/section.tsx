import { useCallback, useMemo, useRef, type MouseEvent } from 'react'
import { Spin } from 'antd'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import {
  CMS_APPLICATION_LIST_BULK_BUTTON_WIDTH,
  FilterTableToolbarButton,
} from '@/shared/ui'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { UJAT_ESSAY_COLUMN_DEFAULT_WIDTHS } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import { buildUjatVolunteerDocScreeningFilterFields } from './filter-fields'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import { computeDocScreeningTableScrollX } from './columns'
import { useUjatVolunteerDocScreening } from './use-list'
import { useApplicantDetail, type ApplicantDetailMetaChangeHandler } from '../applicant/use-detail'
import { ApplicantDetailView } from '../applicant/detail-view'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import './section.css'
import '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail.css'
import { CmsDataTable } from '@/shared/ui/cms-data-table'

const TABLE_SCROLL_X = computeDocScreeningTableScrollX(UJAT_ESSAY_COLUMN_DEFAULT_WIDTHS)

export interface DocScreeningSectionProps {
  programId: string
  half: UjatVolunteerRecruitHalf
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onVolunteerApplicantDetailMetaChange?: ApplicantDetailMetaChangeHandler
}

export function DocScreeningSection({
  programId,
  half,
  onRegisterApplicantCloseHandler,
  onVolunteerApplicantDetailMetaChange,
}: DocScreeningSectionProps) {
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const { labels: educationRegionLabels } = useUjatEducationRegions()
  const filterFields = useMemo(
    () => buildUjatVolunteerDocScreeningFilterFields(),
    [educationRegionLabels]
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
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    infiniteScrollResetKey,
  } = useUjatVolunteerDocScreening({
    programId,
    half,
  })
  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: infiniteScrollResetKey,
  })

  const { selectedApplicant, openApplicantDetail, handleDocumentReject, handleDocumentApprove } =
    useApplicantDetail({
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
        <ApplicantDetailView
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
          fields={filterFields}
          filters={pendingFilters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          title={`봉사자 신청 목록 (${count.toLocaleString()})`}
          actions={
            <div className="ujat-volunteer-doc-screening__actions program-application-list-toolbar">
              <FilterTableToolbarButton
                type="button"
                variant="delete"
                className="cms-button--application-list-bulk"
                width={CMS_APPLICATION_LIST_BULK_BUTTON_WIDTH}
                onClick={handleBulkReject}
              >
                선택 반려
              </FilterTableToolbarButton>
              <FilterTableToolbarButton
                type="button"
                variant="secondary"
                className="cms-button--application-list-bulk"
                width={CMS_APPLICATION_LIST_BULK_BUTTON_WIDTH}
                onClick={handleBulkApprove}
              >
                선택 승인
              </FilterTableToolbarButton>
            </div>
          }
          excelExport={excelExport}
        >
          <div ref={tableWrapRef} className="ujat-volunteer-doc-screening__table-wrap">
            <CmsDataTable<UjatVolunteerApplicantRow>
              rowKey="id"
              className="cms-data-table ujat-volunteer-doc-screening__table clickable-table"
              columns={columns}
              dataSource={tableData}
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: TABLE_SCROLL_X }}
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
            <div ref={loadMoreRef} aria-hidden={!isFetchingNextPage} style={{ minHeight: 1 }}>
              {isFetchingNextPage ? <Spin size="small" /> : null}
            </div>
          </div>
        </FilterTableLayout>
      </div>
    </>
  )
}
