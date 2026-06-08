import { useCallback, type MouseEvent } from 'react'
import { Table } from 'antd'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton } from '@/shared/ui'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { buildGeneralVolunteerDoc1FilterRows } from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'
import { GENERAL_DOC_SCREENING_TABLE_SCROLL_X } from './doc-screening-columns'
import { useGeneralVolunteerDocScreening } from './use-doc-screening'
import {
  useGeneralVolunteerApplicantDetail,
  type GeneralVolunteerApplicantDetailMetaChangeHandler,
} from './use-detail'
import { GeneralVolunteerApplicantDetailView } from './detail-view'
import './volunteer-screening.css'

const FILTER_ROWS = buildGeneralVolunteerDoc1FilterRows()

export function GeneralVolunteerDocScreeningSection({
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
    selectedRowKeys,
    setSelectedRowKeys,
    handleBulkReject,
    handleBulkApprove,
    excelExport,
    count,
    confirmRequest,
    closeConfirm,
    showConfirm,
    applyDocumentScreeningStatus,
    openManagerDropdown,
    setOpenManagerDropdown,
    onManagerAEvaluationChange,
    onManagerBEvaluationChange,
  } = useGeneralVolunteerDocScreening({ programId })

  const { selectedApplicant, openApplicantDetail } = useGeneralVolunteerApplicantDetail({
    programId,
    list,
    variant: 'doc_screening',
    onRegisterApplicantCloseHandler,
    onVolunteerApplicantDetailMetaChange,
  })

  const handleRowClick = useCallback(
    (record: GeneralVolunteerApplicantRow, e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest('.ant-table-selection-column') ||
        target.closest('.ant-checkbox-wrapper') ||
        target.closest('.status-dropdown-cell__status-trigger')
      ) {
        return
      }
      openApplicantDetail(record)
    },
    [openApplicantDetail]
  )

  const confirmModal = confirmRequest ? (
    <ConfirmModal
      open
      title={confirmRequest.title}
      content={confirmRequest.content}
      confirmText={confirmRequest.confirmText}
      cancelText="취소"
      danger={confirmRequest.danger}
      onConfirm={() => {
        confirmRequest.onConfirm()
        closeConfirm()
      }}
      onCancel={closeConfirm}
    />
  ) : null

  if (selectedApplicant) {
    return (
      <>
        {confirmModal}
        <GeneralVolunteerApplicantDetailView
          variant="doc_screening"
          applicant={selectedApplicant}
          openManagerDropdown={openManagerDropdown}
          setOpenManagerDropdown={setOpenManagerDropdown}
          onManagerAEvaluationChange={onManagerAEvaluationChange}
          onManagerBEvaluationChange={onManagerBEvaluationChange}
          onDocumentReject={() =>
            showConfirm({
              title: '서류 반려',
              content: `${selectedApplicant.name} 봉사자를 서류 반려 처리하시겠습니까?`,
              confirmText: '서류 반려',
              danger: true,
              onConfirm: () => applyDocumentScreeningStatus([selectedApplicant.id], 'fail'),
            })
          }
          onDocumentApprove={() =>
            showConfirm({
              title: '서류 승인',
              content: `${selectedApplicant.name} 봉사자를 서류 승인 처리하시겠습니까?`,
              confirmText: '서류 승인',
              onConfirm: () => applyDocumentScreeningStatus([selectedApplicant.id], 'pass'),
            })
          }
        />
      </>
    )
  }

  return (
    <>
      {confirmModal}
      <div className="general-volunteer-screening applicant-details">
        <FilterTableLayout
          bordered={false}
          className="general-volunteer-screening__filter-layout"
          rows={FILTER_ROWS}
          filters={pendingFilters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          title={`봉사자 신청 목록 (${count.toLocaleString()})`}
          actions={
            <div className="general-volunteer-screening__actions">
              <CmsButton type="button" variant="delete" size="large" width={160} onClick={handleBulkReject}>
                선택 반려
              </CmsButton>
              <CmsButton type="button" variant="secondary" size="large" width={160} onClick={handleBulkApprove}>
                선택 승인
              </CmsButton>
            </div>
          }
          excelExport={excelExport}
        >
          <div className="general-volunteer-screening__table-wrap">
            <Table<GeneralVolunteerApplicantRow>
              rowKey="id"
              className="cms-data-table general-volunteer-screening__table clickable-table"
              columns={columns}
              dataSource={tableData}
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: GENERAL_DOC_SCREENING_TABLE_SCROLL_X }}
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
