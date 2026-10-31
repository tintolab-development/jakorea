/**
 * 참여자(개인) 상세 — 정산 현황 탭 (개인 일정별 정산 심사)
 */

import { useCallback, useMemo, useState } from 'react'
import { Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { StatusBadge } from '@/shared/components'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton, ExcelButton } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { handleError } from '@/shared/utils/error-handler'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import { INDIVIDUAL_SETTLEMENT_REVIEW_EXCEL_COLUMNS } from '@/features/program/general/lib/individual-settlement-review-export'
import {
  individualSettlementReviewStatusAccent,
} from '@/features/program/general/lib/individual-settlement-review-status'
import type { IndividualSettlementReviewListRow } from '@/features/program/general/lib/map-individual-settlement-review-rows'
import { useParticipatingParticipantSettlementList } from '@/features/program/general/hooks/use-participating-participant-settlement-list'
import { useParticipatingInstructorSettlementList } from '@/features/program/general/hooks/use-participating-instructor-settlement-list'
import { participantToPaymentStatementInstructorShape } from '@/features/program/general/lib/participating-participant-payment-statement-instructor-shape'
import {
  bulkDownloadParticipatingInstructorPaymentStatements,
  filterParticipatingInstructorSettlementDownloadRows,
  getParticipatingInstructorSettlementBulkDownloadErrorMessage,
} from '@/features/program/general/lib/participating-instructor-settlement-download'
import { IndividualSettlementReviewDetailModal } from './individual-settlement-review-detail-modal'
import './participating-instructor-settlement-section.css'
import './individual-settlement-review-detail-modal.css'

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
  const participantId = participant.id?.trim() ?? ''

  const { isLoading, isError, errorMessage, rows, summary, remoteEnabled, invalidate } =
    useParticipatingParticipantSettlementList({
      programId,
      participant,
    })

  const instructorShape = useMemo(
    () => participantToPaymentStatementInstructorShape(participant),
    [participant]
  )
  const paymentStatementList = useParticipatingInstructorSettlementList({
    programId,
    instructor: instructorShape,
  })
  const downloadableRows = useMemo(
    () => filterParticipatingInstructorSettlementDownloadRows(paymentStatementList.rows),
    [paymentStatementList.rows]
  )

  const [detailApplicationId, setDetailApplicationId] = useState<number | null>(null)
  const [bulkDownloadLoading, setBulkDownloadLoading] = useState(false)

  const handleBulkDownloadPaymentStatements = useCallback(async () => {
    if (bulkDownloadLoading) return
    if (!paymentStatementList.remoteEnabled || downloadableRows.length === 0) {
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
  }, [
    bulkDownloadLoading,
    downloadableRows,
    participant.applicantName,
    paymentStatementList.remoteEnabled,
    showAlert,
  ])

  const { exportExcel, isExporting: isExcelExporting } = useTableExcelExport({
    columns: INDIVIDUAL_SETTLEMENT_REVIEW_EXCEL_COLUMNS,
    data: rows,
    filename: `정산내역_${participant.applicantName}`,
  })

  const columns = useMemo(
    (): ColumnsType<IndividualSettlementReviewListRow> => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '교육 진행 일정',
        dataIndex: 'educationScheduleLabel',
        key: 'educationScheduleLabel',
        align: 'center',
        width: 360,
        render: (value: string | undefined) => renderProgramDetailPipeSeparated(value),
      },
      {
        title: '정산 상태',
        dataIndex: 'statusLabel',
        key: 'statusLabel',
        align: 'center',
        width: 140,
        render: (_value, record) => (
          <StatusBadge
            domain="custom"
            variant="text"
            label={record.statusLabel}
            accentColor={individualSettlementReviewStatusAccent(record.status)}
          />
        ),
      },
      {
        title: '정산 금액',
        dataIndex: 'totalAmountLabel',
        key: 'totalAmountLabel',
        align: 'center',
        width: 140,
      },
      {
        title: 'Revision',
        dataIndex: 'latestRevisionNoLabel',
        key: 'latestRevisionNoLabel',
        align: 'center',
        width: 100,
      },
      {
        title: '제출일시',
        dataIndex: 'submittedAtLabel',
        key: 'submittedAtLabel',
        align: 'center',
        width: 160,
      },
      {
        title: '상세',
        key: 'detail',
        align: 'center',
        width: 140,
        render: (_value, record) => (
          <div className="participating-instructor-settlement-section__payment-statement-cell-inner">
            <CmsButton
              variant="default"
              size="h40"
              disabled={!record.canOpenDetail || !remoteEnabled}
              onClick={() => setDetailApplicationId(record.settlementApplicationId)} >
              상세
            </CmsButton>
          </div>
        ),
      },
    ],
    [remoteEnabled]
  )

  const summaryStatusLabel = isError
    ? '조회 실패'
    : summary.submitted > 0
      ? `확인 대기 중 ${summary.submitted}건`
      : summary.approved > 0
        ? `영수증 확인 완료 ${summary.approved}건`
        : summary.rejected > 0
          ? `신청 반려 ${summary.rejected}건`
          : summary.total > 0
            ? '미신청'
            : '-'

  return (
    <div className="school-detail-fullpage-view__instructor-section participating-instructor-settlement-section">
      <div className="program-detail-fullpage-modal__info-tab-block participating-instructor-settlement-section__summary">
        <DetailInfoForm title="정산 현황" mode="view">
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="정산 현황"
              view={isLoading ? '불러오는 중' : summaryStatusLabel}
              readOnlyDisplay
            />
            <DetailInfoForm.Field
              label="프로그램 진행 회차"
              view={isError ? '-' : `${summary.total}건`}
              readOnlyDisplay
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>

      <div className="table-header-actions">
        <div className="table-header-title--wrapper">
          <span className="table-title">정산 내역</span>
          <span className="table-description">{isError ? '0건' : `${rows.length}건`}</span>
        </div>
        <div className="info-section-buttons--wrapper">
          <CmsButton
            variant="secondary"
            size="h40"
            icon={<ButtonDownloadIcon />}
            disabled={bulkDownloadLoading}
            onClick={() => void handleBulkDownloadPaymentStatements()} >
            지급조서 일괄 다운로드
          </CmsButton>
          <ExcelButton
            onClick={exportExcel}
            loading={isExcelExporting}
            disabled={rows.length === 0 || isError} />
        </div>
      </div>

      <div className="participating-institutions-section__table-wrap">
        {isError ? (
          <div className="individual-settlement-review-detail-modal__empty" role="alert">
            {errorMessage}
          </div>
        ) : (
          <Spin spinning={isLoading}>
            <CmsDataTable<IndividualSettlementReviewListRow>
              className="participating-institutions-section__table cms-data-table"
              rowKey="id"
              size="middle"
              pagination={false}
              scroll={{ x: 1200 }}
              columns={columns}
              dataSource={rows}
            />
          </Spin>
        )}
      </div>

      <IndividualSettlementReviewDetailModal
        open={detailApplicationId != null}
        programId={programId}
        participantId={participantId}
        settlementApplicationId={detailApplicationId}
        onClose={() => setDetailApplicationId(null)}
        onReviewed={invalidate}
      />
    </div>
  )
}
