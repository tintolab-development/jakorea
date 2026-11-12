/**
 * 참여 강사 상세 — 정산 현황 탭 (일반 프로그램 · 개인)
 */

import {
  PROGRAM_API_UNAVAILABLE_TITLE,
  buildProgramApiUnavailableContent,
} from '@/features/program/shared/lib/program-api-unavailable'
import { useCallback, useMemo, useState } from 'react'
import { Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import type { Program } from '@/types/domain'
import { StatusBadge } from '@/shared/components'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton, ConfirmModal, ExcelButton } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { handleError } from '@/shared/utils/error-handler'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  BusinessIncomeView,
  LectureFeeBasisView,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-general-instructor-fee-fields'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import { participatingRowToApplicantFeeViewRow } from '@/features/program/general/lib/participating-instructor-detail-edit'
import {
  lectureProgressAccent,
  PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS,
} from '@/features/program/general/lib/participating-individual-instructor-lecture-report-display'
import { PARTICIPATING_INDIVIDUAL_INSTRUCTOR_SETTLEMENT_EXCEL_COLUMNS } from '@/features/program/general/lib/participating-individual-instructor-settlement-export'
import {
  formatIndividualSettlementAmount,
  isIndividualInstructorPaymentStatementViewDisabled,
  shouldShowIndividualSettlementDash,
} from '@/features/program/general/lib/participating-individual-instructor-settlement-display'
import type { ParticipatingInstructorSettlementApiRow } from '@/features/program/general/lib/map-settlement-to-participating-instructor-settlement-row'
import { useParticipatingInstructorSettlementList } from '@/features/program/general/hooks/use-participating-instructor-settlement-list'
import {
  bulkDownloadParticipatingInstructorPaymentStatements,
  filterParticipatingInstructorSettlementDownloadRows,
  getParticipatingInstructorSettlementBulkDownloadErrorMessage,
} from '@/features/program/general/lib/participating-instructor-settlement-download'
import {
  PARTICIPATING_INSTRUCTOR_CALCULATION_STATEMENT_NESTED_Z_INDEX,
  useParticipatingInstructorPaymentStatementView,
  type ParticipatingInstructorApplicationActionKind,
} from '@/features/program/general/ui/detail-modal/program-status/participating-instructor-payment-statement-view-container'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import { getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'
import { useSettlementApplicationActions } from '@/features/program/general/hooks/use-settlement-application-actions'
import { SettlementApplicationReasonModal } from './settlement-application-reason-modal'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import { useProtectedFileDownload } from '@/shared/lib/use-protected-file-download'
import './participating-instructor-settlement-section.css'

export interface ParticipatingIndividualInstructorSettlementSectionProps {
  instructor: ParticipatingInstructorRow
  program: Program
}

export function ParticipatingIndividualInstructorSettlementSection({
  instructor,
  program,
}: ParticipatingIndividualInstructorSettlementSectionProps) {
  const { showAlert } = useCmsAlert()
  const { runProtectedDownload, filePasswordModal } = useProtectedFileDownload()
  const programId = program.id != null ? String(program.id) : ''
  const programTitle = program.mainTitle?.trim() || program.title?.trim() || '개인 프로그램'

  const { isLoading, rows, settlementItems, progressSummary, remoteEnabled } =
    useParticipatingInstructorSettlementList({
      programId,
      instructor,
    })

  const applicationAction = useSettlementApplicationActions({
    programId,
    instructorMemberId: instructor.memberId?.trim() ?? '',
  })
  const [pendingAction, setPendingAction] = useState<{
    kind: ParticipatingInstructorApplicationActionKind
    settlementApplicationId: number
  } | null>(null)

  const paymentStatementView = useParticipatingInstructorPaymentStatementView({
    instructor,
    settlementItems,
    programId,
    programName: programTitle,
    hideInstitutionColumn: true,
    onApplicationAction: (kind, settlementApplicationId) =>
      setPendingAction({ kind, settlementApplicationId }),
    applicationActionPending: applicationAction.isPending,
  })
  const closePaymentStatementView = paymentStatementView.handleClose

  const closePendingAction = useCallback(() => {
    if (applicationAction.isPending) return
    setPendingAction(null)
  }, [applicationAction.isPending])

  const submitPendingAction = useCallback(
    async (reason?: string) => {
      if (!pendingAction || applicationAction.isPending) return
      try {
        await applicationAction.mutateAsync({ ...pendingAction, reason })
        setPendingAction(null)
        closePaymentStatementView()
      } catch (error) {
        if (getApiErrorHttpStatus(error) === 409) setPendingAction(null)
        showAlert({
          title: '안내',
          content: getSettlementApiErrorMessage(error, '정산 신청서를 처리하지 못했습니다.'),
        })
      }
    },
    [applicationAction, closePaymentStatementView, pendingAction, showAlert]
  )

  const [bulkDownloadLoading, setBulkDownloadLoading] = useState(false)

  const downloadableRows = useMemo(
    () => filterParticipatingInstructorSettlementDownloadRows(rows),
    [rows]
  )

  const feeViewRow = useMemo(
    () => participatingRowToApplicantFeeViewRow(instructor) as ApplicantInstructorRow,
    [instructor]
  )

  const { exportExcel, isExporting: isExcelExporting } = useTableExcelExport({
    accessLog: { downloadKind: 'PROGRAM_SETTLEMENT_EXPORT', containedPiiTypes: ['NAME'] },
    columns: PARTICIPATING_INDIVIDUAL_INSTRUCTOR_SETTLEMENT_EXCEL_COLUMNS,
    data: rows,
    filename: `정산내역_${instructor.instructorName}`,
  })

  const handleBulkDownloadPaymentStatements = useCallback(async () => {
    if (bulkDownloadLoading) return
    // 버튼은 항상 활성화한다. 원격 API가 꺼진 환경·대상 없음은 누를 때 안내한다.
    if (!remoteEnabled) {
      showAlert({
        title: PROGRAM_API_UNAVAILABLE_TITLE,
        content: buildProgramApiUnavailableContent('지급조서 일괄 다운로드'),
      })
      return
    }
    if (downloadableRows.length === 0) {
      showAlert({
        title: '안내',
        content:
          '다운로드할 지급조서가 없습니다. 지급조서 확인 완료 또는 계좌 지급 완료 상태인 건만 다운로드됩니다.',
      })
      return
    }

    runProtectedDownload({
      kind: 'PAYMENT_STATEMENT',
      download: async password => {
        setBulkDownloadLoading(true)
        try {
          await bulkDownloadParticipatingInstructorPaymentStatements(
            downloadableRows,
            `지급조서_${instructor.instructorName}`,
            { password }
          )
        } catch (error) {
          handleError(error, {
            context:
              'participatingIndividualInstructorSettlementSection.bulkDownloadPaymentStatements',
          })
          showAlert({
            title: '안내',
            content: getParticipatingInstructorSettlementBulkDownloadErrorMessage(error),
          })
          throw error
        } finally {
          setBulkDownloadLoading(false)
        }
      },
    })
  }, [
    bulkDownloadLoading,
    downloadableRows,
    instructor.instructorName,
    remoteEnabled,
    runProtectedDownload,
    showAlert,
  ])

  const columns = useMemo(
    (): ColumnsType<ParticipatingInstructorSettlementApiRow> => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '교육 진행 일정',
        dataIndex: 'educationScheduleLabel',
        key: 'educationScheduleLabel',
        align: 'center',
        width: 400,
        render: (value: string | undefined) =>
          renderProgramDetailPipeSeparated(value ? formatCmsScheduleDisplayLabel(value) : value),
      },
      {
        title: '강의 진행 여부',
        dataIndex: 'lectureProgress',
        key: 'lectureProgress',
        align: 'center',
        width: 120,
        render: (_value, record) => (
          <StatusBadge
            domain="custom"
            label={
              PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS[record.lectureProgress]
            }
            accentColor={lectureProgressAccent(record.lectureProgress)}
            variant="text"
          />
        ),
      },
      {
        title: '지급조서 처리현황',
        key: 'paymentStatementStatus',
        align: 'center',
        width: 160,
        render: (_value, record) =>
          shouldShowIndividualSettlementDash(record) ? (
            '-'
          ) : (
            <InstructorSettlementStatusText status={record.paymentStatementStatus} />
          ),
      },
      {
        title: '정산 예정 금액',
        key: 'scheduledSettlementAmount',
        align: 'center',
        width: 140,
        render: (_value, record) => (
          <span className="participating-instructor-settlement-section__amount-dash">
            {shouldShowIndividualSettlementDash(record)
              ? '-'
              : formatIndividualSettlementAmount(record.scheduledSettlementAmount)}
          </span>
        ),
      },
      {
        title: '지급조서',
        key: 'paymentStatement',
        align: 'center',
        width: 180,
        render: (_value, record) => (
          <div className="participating-instructor-settlement-section__payment-statement-cell-inner">
            <CmsButton
              variant="default"
              style={{ width: '100%' }}
              size="h32"
              disabled={
                !remoteEnabled || isIndividualInstructorPaymentStatementViewDisabled(record)
              }
              onClick={() => paymentStatementView.handleOpen(record)}
            >
              지급조서 보기
            </CmsButton>
          </div>
        ),
      },
    ],
    [paymentStatementView.handleOpen, remoteEnabled]
  )

  return (
    <div className="school-detail-fullpage-view__instructor-section participating-instructor-settlement-section">
      <div className="program-detail-fullpage-modal__info-tab-block participating-instructor-settlement-section__summary">
        <DetailInfoForm title="정산 현황" mode="view">
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="지급조서 처리현황"
              view={<InstructorSettlementStatusText status={instructor.settlementStatus} />}
            />
            <DetailInfoForm.Field
              label="프로그램 진행 회차"
              view={
                progressSummary
                  ? `${progressSummary.completed} / ${progressSummary.total}건 (강의 진행 회차 기준)`
                  : null
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="강사비 책정 기준"
              view={<LectureFeeBasisView instructor={feeViewRow} />}
            />
            <DetailInfoForm.Field
              label="사업소득자 여부"
              view={<BusinessIncomeView instructor={feeViewRow} />}
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>

      <div className="table-header-actions">
        <div className="table-header-title--wrapper">
          <span className="table-title">정산 내역</span>
          <span className="table-description">{rows.length}건</span>
        </div>
        <div className="info-section-buttons--wrapper">
          <CmsButton
            variant="secondary"
            size="h40"
            icon={<ButtonDownloadIcon />}
            loading={bulkDownloadLoading}
            onClick={() => void handleBulkDownloadPaymentStatements()}
          >
            지급조서 일괄 다운로드
          </CmsButton>
          <ExcelButton
            onClick={exportExcel}
            loading={isExcelExporting}
          />
        </div>
      </div>

      <div className="participating-institutions-section__table-wrap">
        <Spin spinning={isLoading}>
          <CmsDataTable<ParticipatingInstructorSettlementApiRow>
            className="participating-institutions-section__table cms-data-table"
            rowKey="id"
            size="middle"
            pagination={false}
            scroll={{ x: 1200 }}
            columns={columns}
            dataSource={rows}
          />
        </Spin>
      </div>

      {paymentStatementView.modal}
      {filePasswordModal}
      <ConfirmModal
        open={pendingAction?.kind === 'confirm'}
        title="정산 신청서 승인"
        content="선택한 정산 신청서를 승인하시겠습니까?"
        confirmText="승인"
        cancelText="취소"
        onConfirm={() => void submitPendingAction()}
        onCancel={closePendingAction}
        confirmLoading={applicationAction.isPending}
        zIndex={PARTICIPATING_INSTRUCTOR_CALCULATION_STATEMENT_NESTED_Z_INDEX}
      />
      <SettlementApplicationReasonModal
        kind="reject"
        open={pendingAction?.kind === 'reject'}
        confirming={applicationAction.isPending}
        onCancel={closePendingAction}
        onConfirm={reason => submitPendingAction(reason)}
        zIndex={PARTICIPATING_INSTRUCTOR_CALCULATION_STATEMENT_NESTED_Z_INDEX}
      />
    </div>
  )
}
