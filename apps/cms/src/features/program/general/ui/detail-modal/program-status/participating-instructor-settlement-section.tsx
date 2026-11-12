/**
 * 참여 강사 상세 — 정산 현황 탭 (일반 프로그램 · 기관)
 */

import {
  PROGRAM_API_UNAVAILABLE_TITLE,
  buildProgramApiUnavailableContent,
} from '@/features/program/shared/lib/program-api-unavailable'
import { useCallback, useMemo, useState } from 'react'
import { Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { Program } from '@/types/domain'
import { StatusBadge } from '@/shared/components'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton, ConfirmModal, ExcelButton } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { handleError } from '@/shared/utils/error-handler'
import { formatNumberDisplay } from '@/shared/utils'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import { getInstructorSettlementStatusLabel } from '@/shared/constants/instructor-settlement-status'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  BusinessIncomeView,
  LectureFeeBasisView,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-general-instructor-fee-fields'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import { participatingRowToApplicantFeeViewRow } from '@/features/program/general/lib/participating-instructor-detail-edit'
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
} from '@/features/program/general/ui/detail-modal/program-status/participating-instructor-payment-statement-view-container'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import { useIsInstitutionProgramSurface } from '@/features/program/general/hooks/use-institution-program-surface'
import { useProtectedFileDownload } from '@/shared/lib/use-protected-file-download'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import { getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'
import {
  SETTLEMENT_APPLICATION_ACTIONS,
  type SettlementApplicationActionKind,
} from '@/features/program/general/api/settlement-application-actions-remote'
import { useSettlementApplicationActions } from '@/features/program/general/hooks/use-settlement-application-actions'
import { SettlementApplicationReasonModal } from './settlement-application-reason-modal'
import './participating-instructor-settlement-section.css'

const STATUS_ACCENT_DEFAULT = 'var(--default-BK, #3d3d3d)'
const STATUS_ACCENT_SCHEDULED = 'var(--color-green, #1e8c29)'

function lectureProgressAccent(
  label: ParticipatingInstructorSettlementApiRow['lectureProgressLabel']
): string {
  return label === '진행 예정' ? STATUS_ACCENT_SCHEDULED : STATUS_ACCENT_DEFAULT
}

/** 일반 기관형 Figma 06-2/11 — 확인 처리되지 않은 항목만 있을 때 지급조서 일괄 다운로드 */
export const PAYMENT_STATEMENT_ISSUE_BLOCKED_ALERT = {
  title: '지급조서 발급 불가 안내',
  content: '지급조서 확인 처리가 되지 않은 항목은 지급조서 발급이 불가합니다.',
} as const

function isPaymentStatementNotApplicable(row: ParticipatingInstructorSettlementApiRow): boolean {
  return (
    row.isNotApplied ||
    row.lectureProgressLabel === '진행 예정' ||
    !row.hasPaymentStatementApplication
  )
}

/** 미신청 행·진행 예정 행은 [지급조서 보기]를 비활성화한다 */
function isPaymentStatementViewDisabled(row: ParticipatingInstructorSettlementApiRow): boolean {
  return row.isNotApplied || row.lectureProgressLabel === '진행 예정'
}

function formatSettlementAmount(amount: number | null): string {
  if (amount == null) return '-'
  return `${formatNumberDisplay(amount)}원`
}

/** 미신청 행·진행 예정 행은 정산 예정 금액을 '-'로 표시한다 */
function formatRowSettlementAmount(row: ParticipatingInstructorSettlementApiRow): string {
  if (isPaymentStatementViewDisabled(row)) return '-'
  return formatSettlementAmount(row.scheduledSettlementAmount)
}

/** 미신청·진행 예정 행 처리 현황은 기관형·개인형 모두 '-' (기획 2026-11-12) */
function renderPaymentStatementProcessingStatus(row: ParticipatingInstructorSettlementApiRow) {
  if (isPaymentStatementNotApplicable(row)) {
    return '-'
  }
  return <InstructorSettlementStatusText status={row.paymentStatementStatus} />
}

function resolvePaymentStatementExportLabel(row: ParticipatingInstructorSettlementApiRow): string {
  if (isPaymentStatementNotApplicable(row)) {
    return '-'
  }
  return getInstructorSettlementStatusLabel(row.paymentStatementStatus)
}

const SETTLEMENT_APPLICATION_ACTION_BUTTONS: Array<{
  kind: SettlementApplicationActionKind
  label: string
  variant: 'primary' | 'default'
}> = [
  { kind: 'confirm', label: '승인', variant: 'primary' },
  { kind: 'reject', label: '반려', variant: 'default' },
  { kind: 'requestCorrection', label: '보정 요청', variant: 'default' },
]

function hasSettlementApplicationAction(
  row: ParticipatingInstructorSettlementApiRow,
  kind: SettlementApplicationActionKind
): boolean {
  return row.availableActions.includes(SETTLEMENT_APPLICATION_ACTIONS[kind])
}

function formatInstructorSessionProgress(
  summary: { completed: number; total: number } | null
): string | null {
  if (!summary) return null
  return `${summary.completed} / ${summary.total}건 (강의 진행 회차 기준)`
}

/** 기관형은 시안 라벨 「지급조서 처리 현황」, 그 외 유형은 기존 표기 */
function buildSettlementExportColumns(
  isInstitution: boolean
): ColumnsType<ParticipatingInstructorSettlementApiRow> {
  return [
    { title: 'No.', dataIndex: 'no', key: 'no' },
    { title: '기관명', dataIndex: 'institutionName', key: 'institutionName' },
    { title: '교육 학년', dataIndex: 'educationGrade', key: 'educationGrade' },
    { title: '교육 진행 일정', dataIndex: 'educationScheduleLabel', key: 'educationScheduleLabel' },
    { title: '강의 진행 여부', dataIndex: 'lectureProgressLabel', key: 'lectureProgressLabel' },
    {
      title: isInstitution ? '지급조서 처리 현황' : '지급조서 처리현황',
      key: 'paymentStatementStatus',
      render: (_: unknown, record) => resolvePaymentStatementExportLabel(record),
    },
    {
      title: '정산 예정 금액',
      key: 'scheduledSettlementAmount',
      render: (_: unknown, record) => formatRowSettlementAmount(record),
    },
  ]
}

export interface ParticipatingInstructorSettlementSectionProps {
  instructor: ParticipatingInstructorRow
  program?: Program | null
}

export function ParticipatingInstructorSettlementSection({
  instructor,
  program,
}: ParticipatingInstructorSettlementSectionProps) {
  const { showAlert } = useCmsAlert()
  /** 일반 기관형 — Figma 06-2/10·11 (라벨 띄어쓰기, 보기 비활성, 발급 불가 안내) */
  const isInstitutionSurface = useIsInstitutionProgramSurface(program)
  const processingStatusLabel = isInstitutionSurface ? '지급조서 처리 현황' : '지급조서 처리현황'
  const settlementExportColumns = useMemo(
    () => buildSettlementExportColumns(isInstitutionSurface),
    [isInstitutionSurface]
  )
  const { runProtectedDownload, filePasswordModal } = useProtectedFileDownload()
  const programId = program?.id != null ? String(program.id) : ''
  const { isLoading, rows, settlementItems, progressSummary, remoteEnabled } =
    useParticipatingInstructorSettlementList({
      programId,
      instructor,
    })

  const instructorMemberId = instructor.memberId?.trim() ?? ''
  const applicationAction = useSettlementApplicationActions({ programId, instructorMemberId })
  const [pendingAction, setPendingAction] = useState<{
    kind: SettlementApplicationActionKind
    settlementApplicationId: number
  } | null>(null)

  const closePendingAction = useCallback(() => {
    if (applicationAction.isPending) return
    setPendingAction(null)
  }, [applicationAction.isPending])

  const paymentStatementView = useParticipatingInstructorPaymentStatementView({
    instructor,
    settlementItems,
    programId,
    programName: program?.mainTitle?.trim() || program?.title?.trim(),
    onApplicationAction: (kind, settlementApplicationId) =>
      setPendingAction({ kind, settlementApplicationId }),
    applicationActionPending: applicationAction.isPending,
  })
  const closePaymentStatementView = paymentStatementView.handleClose

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
    accessLog: { downloadKind: 'PROGRAM_SETTLEMENT_EXPORT', containedPiiTypes: [] },
    columns: settlementExportColumns,
    data: rows,
    filename: '정산 내역',
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
      showAlert(
        isInstitutionSurface
          ? PAYMENT_STATEMENT_ISSUE_BLOCKED_ALERT
          : {
              title: '안내',
              content:
                '다운로드할 지급조서가 없습니다. 지급조서 확인 완료 또는 계좌 지급 완료 상태인 건만 다운로드됩니다.',
            }
      )
      return
    }

    runProtectedDownload({
      kind: 'PAYMENT_STATEMENT',
      download: async password => {
        setBulkDownloadLoading(true)
        try {
          await bulkDownloadParticipatingInstructorPaymentStatements(
            downloadableRows,
            '지급조서_일괄',
            {
              password,
            }
          )
        } catch (error) {
          handleError(error, {
            context: 'participatingInstructorSettlementSection.bulkDownloadPaymentStatements',
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
    isInstitutionSurface,
    remoteEnabled,
    runProtectedDownload,
    showAlert,
  ])

  const columns = useMemo(
    (): ColumnsType<ParticipatingInstructorSettlementApiRow> => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
        width: 140,
        align: 'center',
      },
      {
        title: '교육 학년',
        dataIndex: 'educationGrade',
        key: 'educationGrade',
        width: 96,
        align: 'center',
      },
      {
        title: '교육 진행 일정',
        dataIndex: 'educationScheduleLabel',
        key: 'educationScheduleLabel',
        align: 'center',
        width: 320,
        render: (label: string) =>
          renderProgramDetailPipeSeparated(label ? formatCmsScheduleDisplayLabel(label) : label),
      },
      {
        title: '강의 진행 여부',
        dataIndex: 'lectureProgressLabel',
        key: 'lectureProgressLabel',
        align: 'center',
        width: 120,
        render: (label: ParticipatingInstructorSettlementApiRow['lectureProgressLabel']) => (
          <StatusBadge
            domain="custom"
            label={label}
            accentColor={lectureProgressAccent(label)}
            variant="text"
          />
        ),
      },
      {
        title: processingStatusLabel,
        key: 'paymentStatementStatus',
        align: 'center',
        width: 160,
        render: (_: unknown, record) => renderPaymentStatementProcessingStatus(record),
      },
      {
        title: '정산 예정 금액',
        key: 'scheduledSettlementAmount',
        align: 'center',
        width: 140,
        render: (_: unknown, record) => (
          <span className="participating-instructor-settlement-section__amount-dash">
            {formatRowSettlementAmount(record)}
          </span>
        ),
      },
      {
        title: '지급조서',
        key: 'paymentStatement',
        align: 'center',
        width: 180,
        render: (_: unknown, record) => (
          <div className="participating-instructor-settlement-section__payment-statement-cell-inner">
            <CmsButton
              variant="default"
              style={{ width: '100%' }}
              size="h32"
              disabled={
                !remoteEnabled ||
                isPaymentStatementViewDisabled(record) ||
                (isInstitutionSurface && isPaymentStatementNotApplicable(record))
              }
              onClick={() => paymentStatementView.handleOpen(record)}
            >
              지급조서 보기
            </CmsButton>
          </div>
        ),
      },
      {
        title: '신청서 처리',
        key: 'settlementApplicationActions',
        align: 'center',
        width: 260,
        render: (_: unknown, record) => {
          const applicationId = record.settlementApplicationId
          if (!record.isPendingApplication || applicationId == null) return null
          // 진행 예정 행은 지급조서 상태를 보여 주지 않으므로 신청서 처리 버튼도 숨긴다 (기획 2026-11-12)
          if (record.lectureProgressLabel === '진행 예정') return null
          const buttons = SETTLEMENT_APPLICATION_ACTION_BUTTONS.filter(button =>
            hasSettlementApplicationAction(record, button.kind)
          )
          if (buttons.length === 0) return null
          return (
            <div className="participating-instructor-settlement-section__application-actions">
              {buttons.map(button => (
                <CmsButton
                  key={button.kind}
                  variant={button.variant}
                  size="h40"
                  disabled={!remoteEnabled || applicationAction.isPending}
                  onClick={() =>
                    setPendingAction({ kind: button.kind, settlementApplicationId: applicationId })
                  }
                >
                  {button.label}
                </CmsButton>
              ))}
            </div>
          )
        },
      },
    ],
    [
      applicationAction.isPending,
      isInstitutionSurface,
      paymentStatementView.handleOpen,
      processingStatusLabel,
      remoteEnabled,
    ]
  )

  return (
    <div className="school-detail-fullpage-view__instructor-section participating-instructor-settlement-section">
      <div className="program-detail-fullpage-modal__info-tab-block participating-instructor-settlement-section__summary">
        <DetailInfoForm title="정산 현황" mode="view">
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label={processingStatusLabel}
              view={<InstructorSettlementStatusText status={instructor.settlementStatus} />}
            />
            <DetailInfoForm.Field
              label="프로그램 진행 회차"
              view={formatInstructorSessionProgress(progressSummary)}
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
            scroll={{ x: 1660 }}
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
        kind={pendingAction?.kind === 'requestCorrection' ? 'requestCorrection' : 'reject'}
        open={pendingAction?.kind === 'reject' || pendingAction?.kind === 'requestCorrection'}
        confirming={applicationAction.isPending}
        onCancel={closePendingAction}
        onConfirm={reason => submitPendingAction(reason)}
        zIndex={PARTICIPATING_INSTRUCTOR_CALCULATION_STATEMENT_NESTED_Z_INDEX}
      />
    </div>
  )
}
