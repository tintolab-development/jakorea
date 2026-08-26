/**
 * 참여 강사 상세 — 정산 현황 탭
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import type { Program } from '@/types/domain'
import { StatusBadge } from '@/shared/components'
import { CmsButton, ExcelButton } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { handleError } from '@/shared/utils/error-handler'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import { getInstructorSettlementStatusLabel } from '@/shared/constants/instructor-settlement-status'
import {
  BusinessIncomeView,
  LectureFeeBasisView,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-general-instructor-fee-fields'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import { participatingRowToApplicantFeeViewRow } from '@/features/program/general/lib/participating-instructor-detail-edit'
import {
  buildParticipatingInstructorPaymentStatementViewOptions,
  buildPaymentStatementIssuancePreviewContext,
  buildPaymentStatementIssuancePreviewFileName,
  isParticipatingInstructorSettlementEligibleForPaymentStatementDownload,
  type PaymentStatementIssuancePreviewContext,
} from '@/features/program/general/lib/participating-instructor-payment-statement-issuance-view'
import { downloadLectureReportPdfFiles } from '@/features/program/general/lib/download-lecture-reports-bulk-pdf'
import { FormCertificatePdfExportOverlay } from '@/pages/templates/form-certificate-pdf-export-overlay'
import { PaymentStatementIssuanceViewModal } from '@/features/program/shared/ui/payment-statement-issuance-view-modal'
import { PaymentStatementIssuanceBulkPdfExportHost } from './payment-statement-issuance-bulk-pdf-export-host'
import './participating-instructor-settlement-section.css'

/** 프로그램 전체 강의 회차 수 (mock — API 연동 시 program 기준) */
const PROGRAM_LECTURE_ROUND_TOTAL = 7

interface ParticipatingInstructorSettlementRow {
  id: string
  no: number
  schoolName: string
  educationGrade: string
  educationScheduleLabel: string
  lectureProgressLabel: '진행 완료' | '진행 예정'
  /** false이면 미신청 — 지급조서 처리현황 `-` */
  hasPaymentStatementApplication: boolean
  paymentStatementStatus: InstructorSettlementUiStatus
  scheduledSettlementAmount: number | null
  canViewPaymentStatement: boolean
}

function buildParticipatingInstructorSettlementRows(): ParticipatingInstructorSettlementRow[] {
  return [
    {
      id: '5',
      no: 5,
      schoolName: '강서초등학교',
      educationGrade: '3학년',
      educationScheduleLabel: '2026. 01. 09(금) 09:20 ~ 11:20 | 1회차',
      lectureProgressLabel: '진행 완료',
      hasPaymentStatementApplication: true,
      paymentStatementStatus: 'payment_statement_verified',
      scheduledSettlementAmount: 915_000,
      canViewPaymentStatement: true,
    },
    {
      id: '4',
      no: 4,
      schoolName: '강서초등학교',
      educationGrade: '5학년',
      educationScheduleLabel: '2026. 01. 16(금) 09:20 ~ 11:20 | 2회차',
      lectureProgressLabel: '진행 완료',
      hasPaymentStatementApplication: true,
      paymentStatementStatus: 'account_paid',
      scheduledSettlementAmount: 880_000,
      canViewPaymentStatement: true,
    },
    {
      id: '3',
      no: 3,
      schoolName: '서울등현초등학교',
      educationGrade: '5학년',
      educationScheduleLabel: '2026. 01. 23(금) 09:20 ~ 11:20 | 3회차',
      lectureProgressLabel: '진행 완료',
      hasPaymentStatementApplication: true,
      paymentStatementStatus: 'payment_correction_requested',
      scheduledSettlementAmount: null,
      canViewPaymentStatement: true,
    },
    {
      id: '2',
      no: 2,
      schoolName: '서울등현초등학교',
      educationGrade: '5학년',
      educationScheduleLabel: '2026. 01. 30(금) 09:20 ~ 11:20 | 4회차',
      lectureProgressLabel: '진행 완료',
      hasPaymentStatementApplication: false,
      paymentStatementStatus: 'none',
      scheduledSettlementAmount: null,
      canViewPaymentStatement: false,
    },
    {
      id: '1',
      no: 1,
      schoolName: '서울등현초등학교',
      educationGrade: '5학년',
      educationScheduleLabel: '2026. 02. 06(금) 09:20 ~ 11:20 | 5회차',
      lectureProgressLabel: '진행 예정',
      hasPaymentStatementApplication: false,
      paymentStatementStatus: 'none',
      scheduledSettlementAmount: null,
      canViewPaymentStatement: false,
    },
  ]
}

const STATUS_ACCENT_DEFAULT = 'var(--default-BK, #3d3d3d)'
const STATUS_ACCENT_SCHEDULED = 'var(--color-green, #1e8c29)'

function lectureProgressAccent(
  label: ParticipatingInstructorSettlementRow['lectureProgressLabel']
): string {
  return label === '진행 완료' ? STATUS_ACCENT_DEFAULT : STATUS_ACCENT_SCHEDULED
}

function formatSettlementAmount(amount: number | null): string {
  if (amount == null) return '-'
  return `${amount.toLocaleString('ko-KR')}원`
}

/** 강의 미진행·미신청 건은 `-`, 그 외 신청된 처리현황 문구 표시 */
function renderPaymentStatementProcessingStatus(row: ParticipatingInstructorSettlementRow) {
  if (row.lectureProgressLabel === '진행 예정' || !row.hasPaymentStatementApplication) {
    return '-'
  }
  return <InstructorSettlementStatusText status={row.paymentStatementStatus} />
}

function resolvePaymentStatementExportLabel(row: ParticipatingInstructorSettlementRow): string {
  if (row.lectureProgressLabel === '진행 예정' || !row.hasPaymentStatementApplication) {
    return '-'
  }
  return getInstructorSettlementStatusLabel(row.paymentStatementStatus)
}

const settlementExportColumns: ColumnsType<ParticipatingInstructorSettlementRow> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '기관명', dataIndex: 'schoolName', key: 'schoolName' },
  { title: '교육 학년', dataIndex: 'educationGrade', key: 'educationGrade' },
  { title: '교육 진행 일정', dataIndex: 'educationScheduleLabel', key: 'educationScheduleLabel' },
  { title: '강의 진행 여부', dataIndex: 'lectureProgressLabel', key: 'lectureProgressLabel' },
  {
    title: '지급조서 처리현황',
    key: 'paymentStatementStatus',
    render: (_: unknown, record) => resolvePaymentStatementExportLabel(record),
  },
  {
    title: '정산 예정 금액',
    key: 'scheduledSettlementAmount',
    render: (_: unknown, record) => formatSettlementAmount(record.scheduledSettlementAmount),
  },
]

export interface ParticipatingInstructorSettlementSectionProps {
  instructor: ParticipatingInstructorRow
  program?: Program | null
}

export function ParticipatingInstructorSettlementSection({
  instructor,
  program: _program,
}: ParticipatingInstructorSettlementSectionProps) {
  const { showAlert } = useCmsAlert()
  const rows = useMemo(() => buildParticipatingInstructorSettlementRows(), [])

  const [paymentStatementViewOpen, setPaymentStatementViewOpen] = useState(false)
  const [paymentStatementViewRow, setPaymentStatementViewRow] =
    useState<ParticipatingInstructorSettlementRow | null>(null)

  const [bulkExportQueue, setBulkExportQueue] = useState<PaymentStatementIssuancePreviewContext[]>(
    []
  )
  const [bulkExportActive, setBulkExportActive] = useState(false)
  const bulkExportResultsRef = useRef<Array<{ fileName: string; blob: Blob }>>([])
  const bulkExportStartedRef = useRef(false)

  const downloadableRows = useMemo(
    () => rows.filter(isParticipatingInstructorSettlementEligibleForPaymentStatementDownload),
    [rows]
  )

  const paymentStatementViewOptions = useMemo(() => {
    if (!paymentStatementViewRow) return undefined
    return buildParticipatingInstructorPaymentStatementViewOptions(
      instructor,
      paymentStatementViewRow
    )
  }, [instructor, paymentStatementViewRow])

  const paymentStatementViewFileName = useMemo(() => {
    if (!paymentStatementViewRow) return undefined
    return buildPaymentStatementIssuancePreviewFileName(
      buildPaymentStatementIssuancePreviewContext(instructor, paymentStatementViewRow)
    )
  }, [instructor, paymentStatementViewRow])

  const feeViewRow = useMemo(
    () => participatingRowToApplicantFeeViewRow(instructor) as ApplicantInstructorRow,
    [instructor]
  )

  const completedLectureCount = useMemo(
    () => rows.filter(row => row.lectureProgressLabel === '진행 완료').length,
    [rows]
  )

  const { exportExcel, isExporting: isExcelExporting } = useTableExcelExport({
    columns: settlementExportColumns,
    data: rows,
    filename: '정산 내역',
  })

  const handleOpenPaymentStatement = useCallback((row: ParticipatingInstructorSettlementRow) => {
    setPaymentStatementViewRow(row)
    setPaymentStatementViewOpen(true)
  }, [])

  const handleClosePaymentStatementView = useCallback(() => {
    setPaymentStatementViewOpen(false)
    setPaymentStatementViewRow(null)
  }, [])

  const buildRowPreviewContext = useCallback(
    (row: ParticipatingInstructorSettlementRow) =>
      buildPaymentStatementIssuancePreviewContext(instructor, row),
    [instructor]
  )

  const handleBulkExportItemComplete = useCallback(
    (result: { fileName: string; blob: Blob } | null) => {
      if (result != null) {
        bulkExportResultsRef.current.push(result)
      }
      setBulkExportQueue(prev => prev.slice(1))
    },
    []
  )

  const handleBulkDownloadPaymentStatements = useCallback(() => {
    if (bulkExportActive) return
    if (downloadableRows.length === 0) {
      showAlert({
        title: '안내',
        content:
          '다운로드할 지급조서가 없습니다. 지급조서 확인 완료 또는 계좌 지급 완료 상태인 건만 다운로드됩니다.',
      })
      return
    }

    bulkExportResultsRef.current = []
    bulkExportStartedRef.current = true
    setBulkExportQueue(downloadableRows.map(buildRowPreviewContext))
    setBulkExportActive(true)
  }, [bulkExportActive, buildRowPreviewContext, downloadableRows, showAlert])

  useEffect(() => {
    if (!bulkExportActive || !bulkExportStartedRef.current || bulkExportQueue.length > 0) {
      return
    }

    bulkExportStartedRef.current = false
    const files = bulkExportResultsRef.current

    void (async () => {
      try {
        if (files.length === 0) {
          showAlert({
            title: '안내',
            content: 'PDF 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
          })
          return
        }
        await downloadLectureReportPdfFiles(files)
      } catch (error) {
        handleError(error, {
          context: 'participatingInstructorSettlementSection.bulkDownloadPaymentStatements',
        })
        showAlert({
          title: '안내',
          content: '지급조서 일괄 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      } finally {
        bulkExportResultsRef.current = []
        setBulkExportActive(false)
      }
    })()
  }, [bulkExportActive, bulkExportQueue.length, showAlert])

  const currentBulkExportContext = bulkExportQueue[0] ?? null

  const columns = useMemo(
    (): ColumnsType<ParticipatingInstructorSettlementRow> => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 64, align: 'center' },
      { title: '기관명', dataIndex: 'schoolName', key: 'schoolName', width: 140, align: 'center' },
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
        render: (label: string) => renderProgramDetailPipeSeparated(label),
      },
      {
        title: '강의 진행 여부',
        dataIndex: 'lectureProgressLabel',
        key: 'lectureProgressLabel',
        align: 'center',
        width: 120,
        render: (label: ParticipatingInstructorSettlementRow['lectureProgressLabel']) => (
          <StatusBadge
            domain="custom"
            label={label}
            accentColor={lectureProgressAccent(label)}
            variant="text"
          />
        ),
      },
      {
        title: '지급조서 처리현황',
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
            {formatSettlementAmount(record.scheduledSettlementAmount)}
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
              size="medium"
              width={140}
              disabled={!record.canViewPaymentStatement}
              onClick={() => handleOpenPaymentStatement(record)}
            >
              지급조서 보기
            </CmsButton>
          </div>
        ),
      },
    ],
    [handleOpenPaymentStatement]
  )

  return (
    <div className="school-detail-fullpage-view__instructor-section participating-instructor-settlement-section">
      <FormCertificatePdfExportOverlay visible={bulkExportActive} />
      <div className="program-detail-fullpage-modal__info-tab-block participating-instructor-settlement-section__summary">
        <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
          <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
            <tbody>
              <tr>
                <th scope="row">지급조서 처리현황</th>
                <td>
                  <InstructorSettlementStatusText status={instructor.settlementStatus} />
                </td>
                <th scope="row">프로그램 진행 회차</th>
                <td>
                  {completedLectureCount} / {PROGRAM_LECTURE_ROUND_TOTAL}건 (강의 진행 회차 기준)
                </td>
              </tr>
              <tr>
                <th scope="row">강의비 책정 기준</th>
                <td>
                  <LectureFeeBasisView instructor={feeViewRow} />
                </td>
                <th scope="row">사업소득자 여부</th>
                <td>
                  <BusinessIncomeView instructor={feeViewRow} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="table-header-actions">
        <div className="table-header-title--wrapper">
          <span className="table-title">정산 내역</span>
          <span className="table-description">{rows.length}건</span>
        </div>
        <div className="info-section-buttons--wrapper">
          <CmsButton
            variant="secondary"
            size="large"
            width={220}
            icon={<DownloadOutlined />}
            disabled={bulkExportActive || downloadableRows.length === 0}
            onClick={() => void handleBulkDownloadPaymentStatements()}
          >
            지급조서 일괄 다운로드
          </CmsButton>
          <ExcelButton onClick={exportExcel} loading={isExcelExporting} />
        </div>
      </div>

      <div className="participating-institutions-section__table-wrap">
        <Table<ParticipatingInstructorSettlementRow>
          className="participating-institutions-section__table cms-data-table"
          rowKey="id"
          size="middle"
          pagination={false}
          scroll={{ x: 1400 }}
          columns={columns}
          dataSource={rows}
        />
      </div>

      <PaymentStatementIssuanceViewModal
        open={paymentStatementViewOpen && Boolean(paymentStatementViewOptions)}
        onClose={handleClosePaymentStatementView}
        paragraphBodyOptions={paymentStatementViewOptions}
        fileName={paymentStatementViewFileName}
      />
      {currentBulkExportContext != null ? (
        <PaymentStatementIssuanceBulkPdfExportHost
          key={currentBulkExportContext.settlementRow.id}
          context={currentBulkExportContext}
          onComplete={handleBulkExportItemComplete}
        />
      ) : null}
    </div>
  )
}
