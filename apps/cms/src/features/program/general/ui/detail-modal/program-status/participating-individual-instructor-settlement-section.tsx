/**
 * 참여 강사 상세 — 정산 현황 탭 (일반 프로그램 · 개인)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import type { Program } from '@/types/domain'
import { StatusBadge } from '@/shared/components'
import { CmsButton, ExcelButton } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { handleError } from '@/shared/utils/error-handler'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import {
  BusinessIncomeView,
  LectureFeeBasisView,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-general-instructor-fee-fields'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import { participatingRowToApplicantFeeViewRow } from '@/features/program/general/lib/participating-instructor-detail-edit'
import {
  buildParticipatingInstructorPaymentStatementViewOptions,
  buildPaymentStatementIssuancePreviewContext,
  buildPaymentStatementIssuancePreviewFileName,
  type PaymentStatementIssuancePreviewContext,
} from '@/features/program/general/lib/participating-instructor-payment-statement-issuance-view'
import {
  lectureProgressAccent,
  PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS,
} from '@/features/program/general/lib/participating-individual-instructor-lecture-report-display'
import { PARTICIPATING_INDIVIDUAL_INSTRUCTOR_SETTLEMENT_EXCEL_COLUMNS } from '@/features/program/general/lib/participating-individual-instructor-settlement-export'
import {
  formatIndividualSettlementAmount,
  isIndividualInstructorSettlementEligibleForPaymentStatementDownload,
  shouldShowIndividualSettlementDash,
} from '@/features/program/general/lib/participating-individual-instructor-settlement-display'
import {
  getParticipatingIndividualInstructorSettlementRows,
  PARTICIPATING_INDIVIDUAL_INSTRUCTOR_PROGRAM_LECTURE_ROUND_TOTAL,
} from '@/features/program/general/lib/participating-individual-instructor-settlement-mock'
import type { ParticipatingIndividualInstructorSettlementRow } from '@/features/program/general/lib/participating-individual-instructor-settlement-types'
import { downloadLectureReportPdfFiles } from '@/features/program/general/lib/download-lecture-reports-bulk-pdf'
import { FormCertificatePdfExportOverlay } from '@/pages/templates/form-certificate-pdf-export-overlay'
import { PaymentStatementIssuanceViewModal } from '@/features/program/shared/ui/payment-statement-issuance-view-modal'
import { PaymentStatementIssuanceBulkPdfExportHost } from './payment-statement-issuance-bulk-pdf-export-host'
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
  const rows = useMemo(
    () => getParticipatingIndividualInstructorSettlementRows(instructor, program),
    [instructor, program]
  )

  const tableData = useMemo(
    () =>
      rows.map((row, index) => ({
        ...row,
        no: rows.length - index,
      })),
    [rows]
  )

  const programTitle = program.mainTitle?.trim() || program.title?.trim() || '개인 프로그램'

  const [paymentStatementViewOpen, setPaymentStatementViewOpen] = useState(false)
  const [paymentStatementViewRow, setPaymentStatementViewRow] =
    useState<ParticipatingIndividualInstructorSettlementRow | null>(null)

  const [bulkExportQueue, setBulkExportQueue] = useState<PaymentStatementIssuancePreviewContext[]>(
    []
  )
  const [bulkExportActive, setBulkExportActive] = useState(false)
  const bulkExportResultsRef = useRef<Array<{ fileName: string; blob: Blob }>>([])
  const bulkExportStartedRef = useRef(false)

  const downloadableRows = useMemo(
    () => rows.filter(isIndividualInstructorSettlementEligibleForPaymentStatementDownload),
    [rows]
  )

  const toSettlementContext = useCallback(
    (row: ParticipatingIndividualInstructorSettlementRow) => ({
      id: row.id,
      schoolName: programTitle,
      educationScheduleLabel: row.scheduleLabel,
      scheduledSettlementAmount: row.scheduledSettlementAmount,
    }),
    [programTitle]
  )

  const paymentStatementViewOptions = useMemo(() => {
    if (!paymentStatementViewRow) return undefined
    return buildParticipatingInstructorPaymentStatementViewOptions(
      instructor,
      toSettlementContext(paymentStatementViewRow)
    )
  }, [instructor, paymentStatementViewRow, toSettlementContext])

  const paymentStatementViewFileName = useMemo(() => {
    if (!paymentStatementViewRow) return undefined
    return buildPaymentStatementIssuancePreviewFileName(
      buildPaymentStatementIssuancePreviewContext(
        instructor,
        toSettlementContext(paymentStatementViewRow)
      )
    )
  }, [instructor, paymentStatementViewRow, toSettlementContext])

  const feeViewRow = useMemo(
    () => participatingRowToApplicantFeeViewRow(instructor) as ApplicantInstructorRow,
    [instructor]
  )

  const completedLectureCount = useMemo(
    () => rows.filter(row => row.lectureProgress === 'completed').length,
    [rows]
  )

  const { exportExcel, isExporting: isExcelExporting } = useTableExcelExport({
    columns: PARTICIPATING_INDIVIDUAL_INSTRUCTOR_SETTLEMENT_EXCEL_COLUMNS,
    data: tableData,
    filename: `정산내역_${instructor.instructorName}`,
  })

  const handleOpenPaymentStatement = useCallback(
    (row: ParticipatingIndividualInstructorSettlementRow) => {
      setPaymentStatementViewRow(row)
      setPaymentStatementViewOpen(true)
    },
    []
  )

  const handleClosePaymentStatementView = useCallback(() => {
    setPaymentStatementViewOpen(false)
    setPaymentStatementViewRow(null)
  }, [])

  const buildRowPreviewContext = useCallback(
    (row: ParticipatingIndividualInstructorSettlementRow) =>
      buildPaymentStatementIssuancePreviewContext(instructor, toSettlementContext(row)),
    [instructor, toSettlementContext]
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
          context: 'participatingIndividualInstructorSettlementSection.bulkDownloadPaymentStatements',
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
    (): ColumnsType<ParticipatingIndividualInstructorSettlementRow & { no: number }> => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '교육 진행 일정',
        dataIndex: 'scheduleLabel',
        key: 'scheduleLabel',
        align: 'center',
        width: 400,
        render: (value: string | undefined) => renderProgramDetailPipeSeparated(value),
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
            label={PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS[record.lectureProgress]}
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
                  {completedLectureCount} / {PARTICIPATING_INDIVIDUAL_INSTRUCTOR_PROGRAM_LECTURE_ROUND_TOTAL}건
                  (강의 진행 회차 기준)
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
        <Table<ParticipatingIndividualInstructorSettlementRow & { no: number }>
          className="participating-institutions-section__table cms-data-table"
          rowKey="id"
          size="middle"
          pagination={false}
          scroll={{ x: 1200 }}
          columns={columns}
          dataSource={tableData}
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
