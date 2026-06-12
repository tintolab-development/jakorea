import { useCallback, type MouseEvent } from 'react'
import { Table } from 'antd'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH } from '@/shared/ui'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { GeneralVolunteerDocumentApproveCompleteModal } from './general-volunteer-document-approve-complete-modal'
import { GeneralVolunteerDocumentApproveModal } from './general-volunteer-document-approve-modal'
import { GeneralVolunteerDocumentBulkApproveCompleteModal } from './general-volunteer-document-bulk-approve-complete-modal'
import { GeneralVolunteerDocumentBulkApproveModal } from './general-volunteer-document-bulk-approve-modal'
import { GeneralVolunteerDocumentBulkRejectCompleteModal } from './general-volunteer-document-bulk-reject-complete-modal'
import { GeneralVolunteerDocumentBulkRejectModal } from './general-volunteer-document-bulk-reject-modal'
import { GeneralVolunteerDocumentCancelApprovalModal } from './general-volunteer-document-cancel-approval-modal'
import { GeneralVolunteerDocumentCancelRejectModal } from './general-volunteer-document-cancel-reject-modal'
import { GeneralVolunteerDocumentRejectCompleteModal } from './general-volunteer-document-reject-complete-modal'
import { GeneralVolunteerDocumentRejectModal } from './general-volunteer-document-reject-modal'
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
    bulkApproveOpen,
    bulkRejectOpen,
    closeBulkApproveModal,
    closeBulkRejectModal,
    handleBulkApproveConfirm,
    handleBulkRejectConfirm,
    bulkApproveCompleteCount,
    bulkRejectCompleteCount,
    closeBulkApproveCompleteModal,
    closeBulkRejectCompleteModal,
    approveCompleteVolunteerName,
    closeApproveCompleteModal,
    rejectCompleteVolunteer,
    closeRejectCompleteModal,
    approveModalVolunteer,
    rejectModalVolunteer,
    closeApproveModal,
    closeRejectModal,
    openApproveModal,
    openRejectModal,
    handleApproveModalConfirm,
    handleRejectModalConfirm,
    cancelApprovalVolunteer,
    cancelRejectVolunteer,
    closeCancelApprovalModal,
    closeCancelRejectModal,
    openCancelApprovalModal,
    openCancelRejectModal,
    handleCancelApprovalConfirm,
    handleCancelRejectConfirm,
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

  const detailPermissionModals = (
    <>
      <GeneralVolunteerDocumentApproveModal
        open={approveModalVolunteer != null}
        volunteerName={approveModalVolunteer?.name ?? ''}
        onCancel={closeApproveModal}
        onConfirm={handleApproveModalConfirm}
      />
      <GeneralVolunteerDocumentRejectModal
        open={rejectModalVolunteer != null}
        volunteerName={rejectModalVolunteer?.name ?? ''}
        onCancel={closeRejectModal}
        onConfirm={handleRejectModalConfirm}
      />
      <GeneralVolunteerDocumentCancelApprovalModal
        open={cancelApprovalVolunteer != null}
        volunteer={cancelApprovalVolunteer}
        onCancel={closeCancelApprovalModal}
        onConfirm={handleCancelApprovalConfirm}
      />
      <GeneralVolunteerDocumentCancelRejectModal
        open={cancelRejectVolunteer != null}
        volunteer={cancelRejectVolunteer}
        onCancel={closeCancelRejectModal}
        onConfirm={handleCancelRejectConfirm}
      />
    </>
  )

  const listBulkModals = (
    <>
      <GeneralVolunteerDocumentBulkApproveModal
        open={bulkApproveOpen}
        selectionCount={selectedRowKeys.length}
        onCancel={closeBulkApproveModal}
        onConfirm={handleBulkApproveConfirm}
      />
      <GeneralVolunteerDocumentBulkRejectModal
        open={bulkRejectOpen}
        selectionCount={selectedRowKeys.length}
        onCancel={closeBulkRejectModal}
        onConfirm={handleBulkRejectConfirm}
      />
    </>
  )

  const completeModals = (
    <>
      <GeneralVolunteerDocumentApproveCompleteModal
        open={approveCompleteVolunteerName != null}
        volunteerName={approveCompleteVolunteerName ?? ''}
        onClose={closeApproveCompleteModal}
      />
      <GeneralVolunteerDocumentRejectCompleteModal
        open={rejectCompleteVolunteer != null}
        volunteerName={rejectCompleteVolunteer?.name ?? ''}
        rejectionReason={rejectCompleteVolunteer?.reason ?? ''}
        onClose={closeRejectCompleteModal}
      />
      <GeneralVolunteerDocumentBulkApproveCompleteModal
        open={bulkApproveCompleteCount != null}
        selectionCount={bulkApproveCompleteCount ?? 0}
        onClose={closeBulkApproveCompleteModal}
      />
      <GeneralVolunteerDocumentBulkRejectCompleteModal
        open={bulkRejectCompleteCount != null}
        selectionCount={bulkRejectCompleteCount ?? 0}
        onClose={closeBulkRejectCompleteModal}
      />
    </>
  )

  if (selectedApplicant) {
    return (
      <>
        {detailPermissionModals}
        {completeModals}
        <GeneralVolunteerApplicantDetailView
          variant="doc_screening"
          applicant={selectedApplicant}
          openManagerDropdown={openManagerDropdown}
          setOpenManagerDropdown={setOpenManagerDropdown}
          onManagerAEvaluationChange={onManagerAEvaluationChange}
          onManagerBEvaluationChange={onManagerBEvaluationChange}
          onDocumentReject={() => openRejectModal(selectedApplicant)}
          onDocumentApprove={() => openApproveModal(selectedApplicant)}
          onCancelDocumentApproval={() => openCancelApprovalModal(selectedApplicant)}
          onCancelDocumentRejection={() => openCancelRejectModal(selectedApplicant)}
        />
      </>
    )
  }

  return (
    <>
      {listBulkModals}
      {completeModals}
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
