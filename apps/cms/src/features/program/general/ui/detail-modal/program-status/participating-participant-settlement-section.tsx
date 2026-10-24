/**
 * 참여자(개인) 상세 — 정산 현황 탭
 */

import { useCallback, useMemo, useState } from 'react'
import { Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { StatusBadge } from '@/shared/components'
import { CmsButton, ExcelButton } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { handleError } from '@/shared/utils/error-handler'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  lectureProgressAccent,
  PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS,
} from '@/features/program/general/lib/participating-individual-instructor-lecture-report-display'
import { PARTICIPATING_PARTICIPANT_SETTLEMENT_EXCEL_COLUMNS } from '@/features/program/general/lib/participating-individual-instructor-settlement-export'
import {
  formatIndividualSettlementAmount,
  shouldShowIndividualSettlementDash,
} from '@/features/program/general/lib/participating-individual-instructor-settlement-display'
import type { ParticipatingInstructorSettlementApiRow } from '@/features/program/general/lib/map-settlement-to-participating-instructor-settlement-row'
import { useParticipatingParticipantSettlementList } from '@/features/program/general/hooks/use-participating-participant-settlement-list'
import {
  bulkDownloadParticipatingInstructorPaymentStatements,
  filterParticipatingInstructorSettlementDownloadRows,
  getParticipatingInstructorSettlementBulkDownloadErrorMessage,
} from '@/features/program/general/lib/participating-instructor-settlement-download'
import { useParticipatingInstructorPaymentStatementView } from '@/features/program/general/ui/detail-modal/program-status/participating-instructor-payment-statement-view-container'
import { participantToPaymentStatementInstructorShape } from '@/features/program/general/lib/participating-participant-payment-statement-instructor-shape'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import './participating-instructor-settlement-section.css'

export interface ParticipatingParticipantSettlementSectionProps {
  program: Program
  participant: ParticipatingIndividualParticipantRow
}

export function ParticipatingParticipantSettlementSection({
  program,
  participant,
}: ParticipatingParticipantSettlementSectionProps) {
  const { showAlert } = useCmsAlert()
  const programId = program.id != null ? String(program.id) : ''
  const programTitle = program.mainTitle?.trim() || program.title?.trim() || ''

  const {
    isLoading,
    rows,
    settlementItems,
    progressSummary,
    paymentStatementSummaryStatus,
    remoteEnabled,
  } = useParticipatingParticipantSettlementList({
    programId,
    participant,
  })

  const instructorShape = useMemo(
    () => participantToPaymentStatementInstructorShape(participant),
    [participant]
  )

  const paymentStatementView = useParticipatingInstructorPaymentStatementView({
    instructor: instructorShape,
    settlementItems,
    institutionNameOverride: programTitle || undefined,
  })

  const [bulkDownloadLoading, setBulkDownloadLoading] = useState(false)

  const downloadableRows = useMemo(
    () => filterParticipatingInstructorSettlementDownloadRows(rows),
    [rows]
  )

  const { exportExcel, isExporting: isExcelExporting } = useTableExcelExport({
    columns: PARTICIPATING_PARTICIPANT_SETTLEMENT_EXCEL_COLUMNS,
    data: rows,
    filename: `정산내역_${participant.applicantName}`,
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
        `지급조서_${participant.applicantName}`
      )
    } catch (error) {
      handleError(error, {
        context: 'participatingParticipantSettlementSection.bulkDownloadPaymentStatements',
      })
      showAlert({
        title: '안내',
        content: getParticipatingInstructorSettlementBulkDownloadErrorMessage(error),
      })
    } finally {
      setBulkDownloadLoading(false)
    }
  }, [bulkDownloadLoading, downloadableRows, participant.applicantName, remoteEnabled, showAlert])

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
        title: '교육 진행 현황',
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
        title: '지급조서 처리 현황',
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
                <th scope="row">지급조서 처리 현황</th>
                <td>
                  <InstructorSettlementStatusText status={paymentStatementSummaryStatus} />
                </td>
                <th scope="row">프로그램 진행 회차</th>
                <td>
                  {progressSummary.completed} / {progressSummary.total}건 (강의 진행 회차 기준)
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
            size="h40"
            icon={<ButtonDownloadIcon />}
            disabled={!remoteEnabled || bulkDownloadLoading || downloadableRows.length === 0}
            onClick={() => void handleBulkDownloadPaymentStatements()}
          >
            지급조서 일괄 다운로드
          </CmsButton>
          <ExcelButton
            onClick={exportExcel}
            loading={isExcelExporting}
            disabled={rows.length === 0}
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
    </div>
  )
}
