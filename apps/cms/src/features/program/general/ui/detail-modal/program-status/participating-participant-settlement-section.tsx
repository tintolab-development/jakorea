import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { Spin } from 'antd'
import type { Program } from '@/types/domain'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import {
  formatIndividualSettlementAmount,
  INDIVIDUAL_SETTLEMENT_REVIEW_STATUS_LABELS,
  type IndividualSettlementReviewRow,
  type IndividualSettlementReviewRowStatus,
} from '@/features/program/general/lib/map-individual-settlement-review-rows'
import { useParticipatingParticipantSettlementList } from '@/features/program/general/hooks/use-participating-participant-settlement-list'
import { StatusBadge } from '@/shared/components'
import { CmsButton, ExcelButton } from '@/shared/ui'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { IndividualSettlementReviewDetailModal } from './individual-settlement-review-detail-modal'
import './participating-instructor-settlement-section.css'

export interface ParticipatingParticipantSettlementSectionProps {
  program: Program
  participant: ParticipatingIndividualParticipantRow
}

function statusAccent(status: IndividualSettlementReviewRowStatus): string {
  if (status === 'REJECTED') return 'var(--color-red, #c32f4a)'
  if (status === 'SUBMITTED') return 'var(--color-orange, #d77b00)'
  if (status === 'APPROVED') return 'var(--color-green, #1e8c29)'
  return 'var(--default-BK, #3d3d3d)'
}

function submittedAtLabel(value?: string | null): string {
  if (!value) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY.MM.DD HH:mm') : value
}

const EXCEL_COLUMNS: ColumnsType<IndividualSettlementReviewRow> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '교육 진행 일정', dataIndex: 'scheduleLabel', key: 'scheduleLabel' },
  {
    title: '정산 상태',
    key: 'status',
    render: (_value, row) => INDIVIDUAL_SETTLEMENT_REVIEW_STATUS_LABELS[row.status],
  },
  { title: '최신 Revision', dataIndex: 'latestRevisionNo', key: 'latestRevisionNo' },
  {
    title: '신청 금액',
    key: 'totalAmount',
    render: (_value, row) => formatIndividualSettlementAmount(row.totalAmount),
  },
  {
    title: '제출 일시',
    key: 'submittedAt',
    render: (_value, row) => submittedAtLabel(row.submittedAt),
  },
]

export function ParticipatingParticipantSettlementSection({
  program,
  participant,
}: ParticipatingParticipantSettlementSectionProps) {
  const programId = program.id != null ? String(program.id) : ''
  const [activeSettlementApplicationId, setActiveSettlementApplicationId] = useState<number>()
  const {
    isLoading,
    isError,
    rows: rawRows,
    progressSummary,
    remoteEnabled,
    invalidate,
  } = useParticipatingParticipantSettlementList({
    programId,
    participant,
  })

  const rows = useMemo(
    () => rawRows.map((row, index) => ({ ...row, no: index + 1 })),
    [rawRows]
  )
  const { exportExcel, isExporting: isExcelExporting } = useTableExcelExport({
    columns: EXCEL_COLUMNS,
    data: rows,
    filename: `개인정산_${participant.applicantName}`,
  })

  const columns = useMemo(
    (): ColumnsType<IndividualSettlementReviewRow & { no: number }> => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 70, align: 'center' },
      {
        title: '교육 진행 일정',
        dataIndex: 'scheduleLabel',
        key: 'scheduleLabel',
        align: 'center',
        width: 360,
        render: (value: string) => formatCmsScheduleDisplayLabel(value || '-'),
      },
      {
        title: '정산 상태',
        key: 'status',
        align: 'center',
        width: 140,
        render: (_value, row) => (
          <StatusBadge
            domain="custom"
            label={INDIVIDUAL_SETTLEMENT_REVIEW_STATUS_LABELS[row.status]}
            accentColor={statusAccent(row.status)}
            variant="text"
          />
        ),
      },
      {
        title: '최신 Revision',
        dataIndex: 'latestRevisionNo',
        key: 'latestRevisionNo',
        align: 'center',
        width: 120,
        render: (value: number | null) => value ?? '-',
      },
      {
        title: '신청 금액',
        key: 'totalAmount',
        align: 'right',
        width: 150,
        render: (_value, row) => formatIndividualSettlementAmount(row.totalAmount),
      },
      {
        title: '제출 일시',
        key: 'submittedAt',
        align: 'center',
        width: 160,
        render: (_value, row) => submittedAtLabel(row.submittedAt),
      },
      {
        title: '상세·심사',
        key: 'detail',
        align: 'center',
        width: 140,
        render: (_value, row) => (
          <CmsButton
            variant="default"
            size="small"
            disabled={!remoteEnabled || row.settlementApplicationId == null}
            onClick={() => setActiveSettlementApplicationId(row.settlementApplicationId)}
          >
            상세 보기
          </CmsButton>
        ),
      },
    ],
    [remoteEnabled]
  )

  return (
    <div className="school-detail-fullpage-view__instructor-section participating-instructor-settlement-section">
      <div className="program-detail-fullpage-modal__info-tab-block participating-instructor-settlement-section__summary">
        <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
          <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
            <tbody>
              <tr>
                <th scope="row">개인 정산 신청 현황</th>
                <td>
                  총 {progressSummary.total}건 · 심사 대기 {progressSummary.submitted}건 · 승인{' '}
                  {progressSummary.approved}건 · 반려 {progressSummary.rejected}건
                </td>
                <th scope="row">제출 합계</th>
                <td>{formatIndividualSettlementAmount(rows.reduce((sum, row) => sum + (row.totalAmount ?? 0), 0) || null)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="table-header-actions">
        <div className="table-header-title--wrapper">
          <span className="table-title">개인 일정별 정산</span>
          <span className="table-description">{rows.length}건</span>
        </div>
        <div className="info-section-buttons--wrapper">
          <ExcelButton onClick={exportExcel} loading={isExcelExporting} disabled={rows.length === 0} />
        </div>
      </div>

      <div className="participating-institutions-section__table-wrap">
        <Spin spinning={isLoading}>
          {isError ? (
            <div role="alert">개인 정산 심사 목록을 불러오지 못했습니다.</div>
          ) : (
            <CmsDataTable<IndividualSettlementReviewRow & { no: number }>
              className="participating-institutions-section__table cms-data-table"
              rowKey="id"
              size="middle"
              pagination={false}
              scroll={{ x: 1200 }}
              columns={columns}
              dataSource={rows}
            />
          )}
        </Spin>
      </div>

      <IndividualSettlementReviewDetailModal
        open={activeSettlementApplicationId != null}
        settlementApplicationId={activeSettlementApplicationId}
        onClose={() => setActiveSettlementApplicationId(undefined)}
        onChanged={invalidate}
      />
    </div>
  )
}
