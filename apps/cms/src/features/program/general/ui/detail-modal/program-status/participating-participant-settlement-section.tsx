/**
 * 참여자(개인) 상세 — 정산 현황 탭 (개인 일정별 정산 신청)
 */

import { useMemo, useState } from 'react'
import { Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { StatusBadge } from '@/shared/components'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton, ExcelButton } from '@/shared/ui'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import { PARTICIPATING_PARTICIPANT_SETTLEMENT_EXCEL_COLUMNS } from '@/features/program/general/lib/participating-individual-instructor-settlement-export'
import {
  lectureProgressAccent,
  PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS,
} from '@/features/program/general/lib/participating-individual-instructor-lecture-report-display'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import {
  individualSettlementReviewStatusAccent,
  individualSettlementTableProcessingLabel,
  resolveIndividualSettlementReviewUiStatus,
} from '@/features/program/general/lib/individual-settlement-review-status'
import type { IndividualSettlementReviewListRow } from '@/features/program/general/lib/map-individual-settlement-review-rows'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import { getInstructorSettlementStatusLabel } from '@/shared/constants/instructor-settlement-status'
import { useParticipatingParticipantSettlementList } from '@/features/program/general/hooks/use-participating-participant-settlement-list'
import { formatBusinessPeriodDisplay } from '@/features/settlement-management/api/shared/map-frontend-fields'
import { formatDateDotWithWeekday } from '@/shared/utils/date'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { PAYMENT_STATEMENT_VIEW_UNAVAILABLE_ALERT } from '@/features/settlement/lib/payment-statement-view-unavailable-alert'
import { IndividualSettlementReviewDetailModal } from './individual-settlement-review-detail-modal'
import './participating-instructor-settlement-section.css'
import './individual-settlement-review-detail-modal.css'

export interface ParticipatingParticipantSettlementSectionProps {
  program: Program
  participant: ParticipatingIndividualParticipantRow
  assignedSessions?: ReadonlyArray<ParticipatingSchoolSession>
  assignedSessionsLoading?: boolean
}

export function ParticipatingParticipantSettlementSection({
  program,
  participant,
  assignedSessions = [],
  assignedSessionsLoading = false,
}: ParticipatingParticipantSettlementSectionProps) {
  const { showAlert } = useCmsAlert()
  const programId = program.id != null ? String(program.id) : ''
  const participantId = participant.id?.trim() ?? ''

  const { isLoading, isError, errorMessage, rows, summary, remoteEnabled, invalidate } =
    useParticipatingParticipantSettlementList({
      programId,
      participant,
      assignedSessions,
    })

  const [detailApplicationId, setDetailApplicationId] = useState<number | null>(null)

  const { exportExcel, isExporting: isExcelExporting } = useTableExcelExport({
    columns: PARTICIPATING_PARTICIPANT_SETTLEMENT_EXCEL_COLUMNS,
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
        key: 'status',
        align: 'center',
        width: 160,
        render: (_value, record) => {
          if (record.settlementApplicationId == null) {
            return <InstructorSettlementStatusText status="none" />
          }
          const uiStatus = resolveIndividualSettlementReviewUiStatus(record.status)
          if (uiStatus) return <InstructorSettlementStatusText status={uiStatus} />
          return (
            <StatusBadge
              domain="custom"
              variant="text"
              label={individualSettlementTableProcessingLabel(record.status)}
              accentColor={individualSettlementReviewStatusAccent(record.status)}
            />
          )
        },
      },
      {
        title: '정산 예정 금액',
        dataIndex: 'totalAmountLabel',
        key: 'totalAmountLabel',
        align: 'center',
        width: 140,
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
              size="h32"
              style={{ width: '100%' }}
              disabled={!remoteEnabled}
              onClick={() => {
                if (!record.canOpenDetail || record.settlementApplicationId == null) {
                  showAlert(PAYMENT_STATEMENT_VIEW_UNAVAILABLE_ALERT)
                  return
                }
                setDetailApplicationId(record.settlementApplicationId)
              }}
            >
              상세 보기
            </CmsButton>
          </div>
        ),
      },
    ],
    [remoteEnabled, showAlert]
  )

  const completedCount = rows.filter(row => row.lectureProgress === 'completed').length
  const programSessionProgressDisplay =
    isError || rows.length === 0 ? undefined : `${completedCount} / ${rows.length}`
  const businessPeriodStart =
    typeof program.startDate === 'string' ? program.startDate : program.startDate?.toISOString()
  const businessPeriodEnd =
    typeof program.endDate === 'string' ? program.endDate : program.endDate?.toISOString()
  const businessPeriodDisplay = formatBusinessPeriodDisplay({
    businessPeriodStart,
    businessPeriodEnd,
    formatDate: iso => formatDateDotWithWeekday(iso),
  })

  const summaryStatusLabel = isError
    ? '조회 실패'
    : summary.submitted > 0 && (summary.approved > 0 || summary.rejected > 0)
      ? '확인 진행 중'
      : summary.submitted > 0
        ? '확인 대기 중'
        : summary.approved > 0
          ? getInstructorSettlementStatusLabel('payment_statement_verified')
          : summary.rejected > 0
            ? '신청 반려'
            : summary.total > 0
              ? '해당 없음'
              : '-'

  return (
    <div className="school-detail-fullpage-view__instructor-section participating-instructor-settlement-section">
      <div className="program-detail-fullpage-modal__info-tab-block participating-instructor-settlement-section__summary">
        <DetailInfoForm title="정산 현황" mode="view">
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="지급조서 처리 현황"
              view={isLoading ? '불러오는 중' : summaryStatusLabel}
              readOnlyDisplay
            />
            <DetailInfoForm.Field
              label="프로그램 진행 회차"
              view={isError ? '-' : `${completedCount} / ${rows.length}건 (강의 진행 회차 기준)`}
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
            onClick={() =>
              showAlert({
                title: '안내',
                content:
                  '다운로드할 지급조서가 없습니다. 개인 참여자 정산은 일정별 정산 신청이며, 지급조서 일괄 다운로드 대상이 아닙니다.',
              })
            }
          >
            지급조서 일괄 다운로드
          </CmsButton>
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
          <Spin spinning={isLoading || assignedSessionsLoading}>
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
        programSessionProgressDisplay={programSessionProgressDisplay}
        businessPeriodDisplay={businessPeriodDisplay}
        onClose={() => setDetailApplicationId(null)}
        onReviewed={invalidate}
      />
    </div>
  )
}
