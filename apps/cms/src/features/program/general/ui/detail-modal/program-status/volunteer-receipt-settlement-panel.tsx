/**
 * 봉사자 상세 — 정산 현황 (일정별 영수증 정산 심사, applicationType=VOLUNTEER)
 *
 * 일반 참여 봉사자 상세와 UJAT 봉사자 상세가 같이 쓴다. 표·심사 모달은 참여자 정산 현황과 같은 흐름이다.
 * - 일반: 배정 일정 기준 행 + 봉사 진행 현황(기본값)
 * - UJAT: 배정 일정을 넘기지 않으므로 정산 신청 건만 그리고, 진행 현황 열·회차 요약은 끈다(`showProgress=false`)
 */

import { useMemo, useState } from 'react'
import { Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { VolunteerReceiptSettlementTarget } from '@/features/program/general/api/volunteer-settlement-review-remote'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { StatusBadge } from '@/shared/components'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton, ExcelButton } from '@/shared/ui'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
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
import {
  resolveIndividualSettlementReviewSummaryLabel,
  type IndividualSettlementReviewListRow,
} from '@/features/program/general/lib/map-individual-settlement-review-rows'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import { useVolunteerReceiptSettlementList } from '@/features/program/general/hooks/use-volunteer-receipt-settlement-list'
import { formatBusinessPeriodDisplay } from '@/features/settlement-management/api/shared/map-frontend-fields'
import { formatDateDotWithWeekday } from '@/shared/utils/date'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { PAYMENT_STATEMENT_VIEW_UNAVAILABLE_ALERT } from '@/features/settlement/lib/payment-statement-view-unavailable-alert'
import { IndividualSettlementReviewDetailModal } from './individual-settlement-review-detail-modal'
import './participating-instructor-settlement-section.css'
import './individual-settlement-review-detail-modal.css'

const VOLUNTEER_RECEIPT_BULK_DOWNLOAD_ALERT = {
  title: '안내',
  content:
    '다운로드할 지급조서가 없습니다. 봉사자 정산은 일정별 영수증 정산이며, 지급조서 일괄 다운로드 대상이 아닙니다.',
} as const

function buildExcelColumns(showProgress: boolean): ColumnsType<IndividualSettlementReviewListRow> {
  return [
    { title: 'No.', dataIndex: 'no', key: 'no' },
    { title: '담당 봉사 진행 일정', dataIndex: 'educationScheduleLabel', key: 'educationScheduleLabel' },
    ...(showProgress
      ? [
          {
            title: '봉사 진행 현황',
            key: 'lectureProgress',
            render: (_value: unknown, record: IndividualSettlementReviewListRow) =>
              PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS[record.lectureProgress],
          },
        ]
      : []),
    {
      title: '지급조서 처리 현황',
      key: 'status',
      render: (_value: unknown, record: IndividualSettlementReviewListRow) =>
        individualSettlementTableProcessingLabel(record.status),
    },
    { title: '정산 예정 금액', dataIndex: 'totalAmountLabel', key: 'totalAmountLabel' },
  ]
}

export interface VolunteerReceiptSettlementPanelProps {
  program: Program
  target: VolunteerReceiptSettlementTarget
  /** 일반 참여 봉사자 — 배정 일정(`resolvedScheduleId`) */
  assignedSessions?: ReadonlyArray<ParticipatingSchoolSession>
  /** 봉사 진행 현황 열·회차 요약. 배정 일정을 주지 않는 화면은 끈다 */
  showProgress?: boolean
  unavailableNoticeKey: string
}

export function VolunteerReceiptSettlementPanel({
  program,
  target,
  assignedSessions,
  showProgress = true,
  unavailableNoticeKey,
}: VolunteerReceiptSettlementPanelProps) {
  const { showAlert } = useCmsAlert()
  const programId = program.id != null ? String(program.id) : ''

  const { isLoading, isError, errorMessage, rows, summary, remoteEnabled, reviewKey, invalidate } =
    useVolunteerReceiptSettlementList({
      programId,
      target,
      assignedSessions,
      unavailableNoticeKey,
    })

  const [detailApplicationId, setDetailApplicationId] = useState<number | null>(null)

  const excelColumns = useMemo(() => buildExcelColumns(showProgress), [showProgress])
  const { exportExcel, isExporting: isExcelExporting } = useTableExcelExport({
    accessLog: { downloadKind: 'PROGRAM_SETTLEMENT_EXPORT', containedPiiTypes: [] },
    columns: excelColumns,
    data: rows,
    filename: '정산 내역',
  })

  const columns = useMemo(
    (): ColumnsType<IndividualSettlementReviewListRow> => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '담당 봉사 진행 일정',
        dataIndex: 'educationScheduleLabel',
        key: 'educationScheduleLabel',
        align: 'center',
        width: 400,
        render: (value: string | undefined) =>
          renderProgramDetailPipeSeparated(value ? formatCmsScheduleDisplayLabel(value) : value),
      },
      ...(showProgress
        ? [
            {
              title: '봉사 진행 현황',
              dataIndex: 'lectureProgress',
              key: 'lectureProgress',
              align: 'center' as const,
              width: 120,
              render: (_value: unknown, record: IndividualSettlementReviewListRow) => (
                <StatusBadge
                  domain="custom"
                  label={
                    PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS[
                      record.lectureProgress
                    ]
                  }
                  accentColor={lectureProgressAccent(record.lectureProgress)}
                  variant="text"
                />
              ),
            },
          ]
        : []),
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
    [remoteEnabled, showAlert, showProgress]
  )

  const completedCount = rows.filter(row => row.lectureProgress === 'completed').length
  const programSessionProgressDisplay =
    !showProgress || isError || rows.length === 0 ? undefined : `${completedCount} / ${rows.length}`
  const businessPeriodStart =
    typeof program.startDate === 'string' ? program.startDate : program.startDate?.toISOString()
  const businessPeriodEnd =
    typeof program.endDate === 'string' ? program.endDate : program.endDate?.toISOString()
  const businessPeriodDisplay = formatBusinessPeriodDisplay({
    businessPeriodStart,
    businessPeriodEnd,
    formatDate: iso => formatDateDotWithWeekday(iso),
  })
  const summaryStatusView = isLoading
    ? '불러오는 중'
    : resolveIndividualSettlementReviewSummaryLabel(summary, isError)

  return (
    <div className="school-detail-fullpage-view__instructor-section participating-instructor-settlement-section">
      <div className="program-detail-fullpage-modal__info-tab-block participating-instructor-settlement-section__summary">
        <DetailInfoForm title="정산 현황" mode="view">
          {showProgress ? (
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="지급조서 처리 현황"
                view={summaryStatusView}
                readOnlyDisplay
              />
              <DetailInfoForm.Field
                label="프로그램 진행 회차"
                view={isError ? '-' : `${completedCount} / ${rows.length}건 (봉사 진행 회차 기준)`}
                readOnlyDisplay
              />
            </DetailInfoForm.Row>
          ) : (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="지급조서 처리 현황"
                fullRow
                view={summaryStatusView}
                readOnlyDisplay
              />
            </DetailInfoForm.Row>
          )}
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
            onClick={() => showAlert(VOLUNTEER_RECEIPT_BULK_DOWNLOAD_ALERT)}
          >
            지급조서 일괄 다운로드
          </CmsButton>
          <ExcelButton onClick={exportExcel} loading={isExcelExporting} />
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
        participantId={reviewKey}
        settlementApplicationId={detailApplicationId}
        programSessionProgressDisplay={programSessionProgressDisplay}
        businessPeriodDisplay={businessPeriodDisplay}
        onClose={() => setDetailApplicationId(null)}
        onReviewed={invalidate}
      />
    </div>
  )
}
