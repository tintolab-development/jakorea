/**
 * 참여 강사 상세 — 정산 현황 탭 (일반 프로그램 · 개인)
 */

import { useCallback, useMemo, useState } from 'react'
import { Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
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
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import { participatingRowToApplicantFeeViewRow } from '@/features/program/general/lib/participating-instructor-detail-edit'
import {
  lectureProgressAccent,
  PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS,
} from '@/features/program/general/lib/participating-individual-instructor-lecture-report-display'
import { PARTICIPATING_INDIVIDUAL_INSTRUCTOR_SETTLEMENT_EXCEL_COLUMNS } from '@/features/program/general/lib/participating-individual-instructor-settlement-export'
import {
  formatIndividualSettlementAmount,
  shouldShowIndividualSettlementDash,
} from '@/features/program/general/lib/participating-individual-instructor-settlement-display'
import type { ParticipatingInstructorSettlementApiRow } from '@/features/program/general/lib/map-settlement-to-participating-instructor-settlement-row'
import { useParticipatingInstructorSettlementList } from '@/features/program/general/hooks/use-participating-instructor-settlement-list'
import {
  bulkDownloadParticipatingInstructorPaymentStatements,
  filterParticipatingInstructorSettlementDownloadRows,
  getParticipatingInstructorSettlementBulkDownloadErrorMessage,
} from '@/features/program/general/lib/participating-instructor-settlement-download'
import { useParticipatingInstructorPaymentStatementView } from '@/features/program/general/ui/detail-modal/program-status/participating-instructor-payment-statement-view-container'
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
  const programId = program.id != null ? String(program.id) : ''
  const programTitle = program.mainTitle?.trim() || program.title?.trim() || '개인 프로그램'

  const { isLoading, rows, settlementItems, progressSummary, remoteEnabled } =
    useParticipatingInstructorSettlementList({
      programId,
      instructor,
    })

  const paymentStatementView = useParticipatingInstructorPaymentStatementView({
    instructor,
    settlementItems,
    institutionNameOverride: programTitle,
  })

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
    columns: PARTICIPATING_INDIVIDUAL_INSTRUCTOR_SETTLEMENT_EXCEL_COLUMNS,
    data: rows,
    filename: `정산내역_${instructor.instructorName}`,
  })

  const handleBulkDownloadPaymentStatements = useCallback(async () => {
    if (bulkDownloadLoading) return
    if (!remoteEnabled) return
    if (downloadableRows.length === 0) {
      showAlert({
        title: '안내',
        content:
          '다운로드할 지급조서가 없습니다. 지급조서 확인 완료 또는 계좌 지급 완료 상태인 건만 다운로드됩니다.',
      })
      return
    }

    setBulkDownloadLoading(true)
    try {
      await bulkDownloadParticipatingInstructorPaymentStatements(
        downloadableRows,
        `지급조서_${instructor.instructorName}`
      )
    } catch (error) {
      handleError(error, {
        context: 'participatingIndividualInstructorSettlementSection.bulkDownloadPaymentStatements',
      })
      showAlert({
        title: '안내',
        content: getParticipatingInstructorSettlementBulkDownloadErrorMessage(error),
      })
    } finally {
      setBulkDownloadLoading(false)
    }
  }, [bulkDownloadLoading, downloadableRows, instructor.instructorName, remoteEnabled, showAlert])

  const columns = useMemo(
    (): ColumnsType<ParticipatingInstructorSettlementApiRow> => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '교육 진행 일정',
        dataIndex: 'educationScheduleLabel',
        key: 'educationScheduleLabel',
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
              disabled={!record.canViewPaymentStatement || !remoteEnabled}
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
                  {progressSummary.completed} / {progressSummary.total}건 (강의 진행 회차 기준)
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
            disabled={!remoteEnabled || bulkDownloadLoading || downloadableRows.length === 0}
            onClick={() => void handleBulkDownloadPaymentStatements()}
          >
            지급조서 일괄 다운로드
          </CmsButton>
          <ExcelButton onClick={exportExcel} loading={isExcelExporting} disabled={rows.length === 0} />
        </div>
      </div>

      <div className="participating-institutions-section__table-wrap">
        <Spin spinning={isLoading}>
          <Table<ParticipatingInstructorSettlementApiRow>
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
    </div>
  )
}
