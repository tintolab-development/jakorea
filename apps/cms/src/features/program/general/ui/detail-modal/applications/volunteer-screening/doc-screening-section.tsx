import { useCallback, useMemo, type CSSProperties, type MouseEvent } from 'react'
import { Spin } from 'antd'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import {
  FilterTableToolbarButton,
} from '@/shared/ui'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import { IndividualApproveScopeModal } from '@/features/program/general/ui/detail-modal/applications/individual-approve-scope-modal'
import { ProgramApplicationRejectModal } from '@/features/program/shared/ui/detail-modal/components/program-application-reject-modal'
import { NOTIFY_TIMING_CAPABILITY } from '@/shared/lib/notify-timing-capability'
import { GeneralVolunteerApplicationBulkApproveModal } from './general-volunteer-application-bulk-approve-modal'
import { canSelectVolunteerApplicationForDecision } from './general-volunteer-application-decision-actions'
import { GeneralVolunteerDocumentApproveModal } from './general-volunteer-document-approve-modal'
import { GeneralVolunteerDocumentBulkApproveModal } from './general-volunteer-document-bulk-approve-modal'
import { GeneralVolunteerDocumentBulkRejectModal } from './general-volunteer-document-bulk-reject-modal'
import { GeneralVolunteerDocumentCancelApprovalModal } from './general-volunteer-document-cancel-approval-modal'
import { GeneralVolunteerDocumentCancelRejectModal } from './general-volunteer-document-cancel-reject-modal'
import { GeneralVolunteerDocumentRejectModal } from './general-volunteer-document-reject-modal'
import { buildGeneralVolunteerDoc1FilterFields } from '@/features/program/general/lib/volunteer-doc-screening-filter-fields'
import type { Program } from '@/types/domain'
import { resolveGeneralDocScreeningTableScrollX } from './doc-screening-columns'
import { useGeneralVolunteerDocScreening } from './use-doc-screening'
import { isDocumentScreeningPendingForBulkSelect } from '@/features/program/general/lib/application-processed-selection-alert'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import {
  useGeneralVolunteerApplicantDetail,
  type GeneralVolunteerApplicantDetailMetaChangeHandler,
} from './use-detail'
import { GeneralVolunteerApplicantDetailView } from './detail-view'
import './volunteer-screening.css'

export function GeneralVolunteerDocScreeningSection({
  program,
  programId: programIdProp,
  interviewEnabled = true,
  onRegisterApplicantCloseHandler,
  onVolunteerApplicantDetailMetaChange,
}: {
  program?: Program
  programId?: string
  interviewEnabled?: boolean
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onVolunteerApplicantDetailMetaChange?: GeneralVolunteerApplicantDetailMetaChangeHandler
}) {
  const programId = program?.id ?? programIdProp ?? ''
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
    approveModalVolunteer,
    rejectModalVolunteer,
    closeApproveModal,
    closeRejectModal,
    openApproveModal,
    openRejectModal,
    handleApproveModalConfirm,
    handleApplicationApproveConfirm,
    handleRejectModalConfirm,
    approvePreferredSchedules,
    approveConfirmLoading,
    bulkApproveSubjectName,
    bulkRejectSubjectName,
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
    updatingManagerEvaluation,
    onManagerAEvaluationChange,
    onManagerBEvaluationChange,
    applicationsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    listQuery,
  } = useGeneralVolunteerDocScreening({ programId, interviewEnabled })
  const filterFields = useMemo(
    () => buildGeneralVolunteerDoc1FilterFields({ interviewEnabled }),
    [interviewEnabled]
  )
  const tableScrollX = resolveGeneralDocScreeningTableScrollX(interviewEnabled)
  const { sentinelRef: loadMoreRef } = useGatedInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetKey: `${programId}:${JSON.stringify(listQuery)}`,
  })

  const { selectedApplicant, openApplicantDetail } = useGeneralVolunteerApplicantDetail({
    programId,
    list,
    variant: 'doc_screening',
    interviewEnabled,
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

  const approveRejectModals = interviewEnabled ? (
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
    </>
  ) : (
    <>
      {program ? (
        <IndividualApproveScopeModal
          open={approveModalVolunteer != null}
          participantName={approveModalVolunteer?.name ?? ''}
          programId={programId}
          program={program}
          preferredEducationSchedules={approvePreferredSchedules}
          confirmLoading={approveConfirmLoading}
          onCancel={closeApproveModal}
          onConfirm={handleApplicationApproveConfirm}
        />
      ) : null}
      <ProgramApplicationRejectModal
        open={rejectModalVolunteer != null}
        audience="member"
        variant="single"
        subjectName={rejectModalVolunteer?.name ?? ''}
        notifyTimingCapability={NOTIFY_TIMING_CAPABILITY.timedBulk}
        onCancel={closeRejectModal}
        onConfirm={handleRejectModalConfirm}
      />
    </>
  )

  const cancelDocumentModals = (
    <>
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

  const detailPermissionModals = (
    <>
      {approveRejectModals}
      {cancelDocumentModals}
    </>
  )

  const listBulkModals = interviewEnabled ? (
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
  ) : (
    <>
      <GeneralVolunteerApplicationBulkApproveModal
        open={bulkApproveOpen}
        subjectName={bulkApproveSubjectName}
        selectionCount={selectedRowKeys.length}
        onCancel={closeBulkApproveModal}
        onConfirm={handleBulkApproveConfirm}
      />
      <ProgramApplicationRejectModal
        open={bulkRejectOpen}
        audience="member"
        variant="bulk"
        subjectName={bulkRejectSubjectName}
        selectionCount={selectedRowKeys.length}
        notifyTimingCapability={NOTIFY_TIMING_CAPABILITY.timedBulk}
        onCancel={closeBulkRejectModal}
        onConfirm={handleBulkRejectConfirm}
      />
    </>
  )

  if (selectedApplicant) {
    return (
      <>
        {detailPermissionModals}
        <GeneralVolunteerApplicantDetailView
          variant="doc_screening"
          applicant={selectedApplicant}
          interviewEnabled={interviewEnabled}
          openManagerDropdown={openManagerDropdown}
          setOpenManagerDropdown={setOpenManagerDropdown}
          updatingManagerEvaluation={updatingManagerEvaluation}
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

  if (applicationsLoading && list.length === 0) {
    return (
      <div className="detail-fullpage-modal__loading" role="status">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <>
      {approveRejectModals}
      {listBulkModals}
      <div className="general-volunteer-screening applicant-details">
        <FilterTableLayout
          bordered={false}
          className="general-volunteer-screening__filter-layout"
          fields={filterFields}
          filters={pendingFilters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          title={
            interviewEnabled
              ? `봉사자 신청 목록 (${count.toLocaleString()})`
              : '봉사자 신청 목록'
          }
          description={
            interviewEnabled ? undefined : `총 ${count.toLocaleString()}건`
          }
          actions={
            <div className="general-volunteer-screening__actions program-application-list-toolbar">
              <FilterTableToolbarButton
                type="button"
                variant="delete"
                onClick={handleBulkReject} >
                선택 반려
              </FilterTableToolbarButton>
              <FilterTableToolbarButton
                type="button"
                variant="secondary"
                onClick={handleBulkApprove} >
                선택 승인
              </FilterTableToolbarButton>
            </div>
          }
          excelExport={excelExport}
        >
          <div
            className="general-volunteer-screening__table-wrap"
            style={
              {
                '--general-doc-screening-table-width': `${tableScrollX}px`,
              } as CSSProperties
            }
          >
            <CmsDataTable<GeneralVolunteerApplicantRow>
              rowKey="id"
              className="cms-data-table general-volunteer-screening__table clickable-table"
              columns={columns}
              dataSource={tableData}
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: tableScrollX }}
              rowSelection={{
                fixed: true,
                columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                selectedRowKeys,
                onChange: keys => setSelectedRowKeys(keys),
                getCheckboxProps: record => ({
                  disabled: interviewEnabled
                    ? !isDocumentScreeningPendingForBulkSelect(record.documentScreeningStatus)
                    : !canSelectVolunteerApplicationForDecision(record),
                }),
              }}
              onRow={record => ({
                onClick: e => handleRowClick(record, e),
                style: { cursor: 'pointer' },
              })}
            />
          </div>
          <div ref={loadMoreRef} aria-hidden style={{ height: 1 }} />
        </FilterTableLayout>
      </div>
    </>
  )
}
