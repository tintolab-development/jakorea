/**
 * 참여자(개인) 상세 — 정산 현황 탭 (개인 일정별 정산 심사)
 */

import { useMemo, useState } from 'react'
import { Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { StatusBadge } from '@/shared/components'
import { CmsButton, ExcelButton } from '@/shared/ui'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { INDIVIDUAL_SETTLEMENT_REVIEW_EXCEL_COLUMNS } from '@/features/program/general/lib/individual-settlement-review-export'
import {
  individualSettlementReviewStatusAccent,
} from '@/features/program/general/lib/individual-settlement-review-status'
import type { IndividualSettlementReviewListRow } from '@/features/program/general/lib/map-individual-settlement-review-rows'
import { useParticipatingParticipantSettlementList } from '@/features/program/general/hooks/use-participating-participant-settlement-list'
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
  const programId = program.id != null ? String(program.id) : ''
  const participantId = participant.id?.trim() ?? ''

  const { isLoading, isError, errorMessage, rows, summary, remoteEnabled, invalidate } =
    useParticipatingParticipantSettlementList({
      programId,
      participant,
    })

  const [detailApplicationId, setDetailApplicationId] = useState<number | null>(null)

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
              size="medium"
              width={88}
              disabled={!record.canOpenDetail || !remoteEnabled}
              onClick={() => setDetailApplicationId(record.settlementApplicationId)}
            >
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
      ? `심사 대기 ${summary.submitted}건`
      : summary.approved > 0
        ? `승인 ${summary.approved}건`
        : summary.rejected > 0
          ? `반려 ${summary.rejected}건`
          : summary.total > 0
            ? '미신청'
            : '-'

  return (
    <div className="school-detail-fullpage-view__instructor-section participating-instructor-settlement-section">
      <div className="program-detail-fullpage-modal__info-tab-block participating-instructor-settlement-section__summary">
        <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
          <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
            <tbody>
              <tr>
                <th scope="row">정산 현황</th>
                <td>{isLoading ? '불러오는 중' : summaryStatusLabel}</td>
                <th scope="row">프로그램 진행 회차</th>
                <td>{isError ? '-' : `${summary.total}건`}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="table-header-actions">
        <div className="table-header-title--wrapper">
          <span className="table-title">정산 내역</span>
          <span className="table-description">{isError ? '0건' : `${rows.length}건`}</span>
        </div>
        <div className="info-section-buttons--wrapper">
          <ExcelButton
            onClick={exportExcel}
            loading={isExcelExporting}
            disabled={rows.length === 0 || isError}
          />
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
