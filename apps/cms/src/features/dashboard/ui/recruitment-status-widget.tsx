/**
 * 모집 신청 현황 위젯
 * 프로그램별 모집 현황 테이블: 프로그램명, 모집 신청 현황, 참여자 모집 현황, 봉사자 모집 현황
 * td: 지원자수/전체수 nn/nn 형식 (건 단위 없음)
 * 모집 신청 현황 컬럼: dashboard recruitments.recruitmentStatus 라벨 (lifecycle 매핑 없음)
 */

import { Card, Typography } from 'antd'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingButton } from '@/shared/ui'
import { StatusBadge } from '@/shared/components/status-badge'
import { PROGRAM_RECRUITMENT_APPLICATION_TEXT_COLORS } from '@/shared/constants/status'
import {
  formatDashboardHeaderTotalCount,
  formatRecruitmentCount,
  formatRecruitmentWindowStatus,
  type DashboardRecruitmentRow,
} from '../api/adapters/dashboard-adapters'
import { useDashboardSettingsStore } from '../model/dashboard-settings-store'
import { useRecruitmentStatusList } from '../hooks/use-recruitment-status-list'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import { DashboardWidgetQueryError } from './dashboard-widget-query-error'
import { DashboardWidgetEmpty } from './dashboard-widget-empty'
import {
  RECRUITMENT_STATUS_MORE_PATH,
  recruitmentProgramDetailPath,
} from '../lib/dashboard-widget-links'
import '@/shared/ui/widget-more-button.css'
import './dashboard-widget-table.css'

const { Text } = Typography

const WIDGET_KEY = 'recruitment-status-widget'

/** 시안 톤: 모집 예정 green · 모집 중 blue · 그 외 기본 (모집 신청 현황 색 정본 재사용) */
function recruitmentWindowAccentColor(status?: string | null): string {
  const upper = status?.trim().toUpperCase() ?? ''
  if (upper === 'SCHEDULED' || upper === 'PLANNED') {
    return PROGRAM_RECRUITMENT_APPLICATION_TEXT_COLORS.scheduled
  }
  if (upper === 'OPEN' || upper === 'RECRUITING' || upper.startsWith('RECRUITING_')) {
    return PROGRAM_RECRUITMENT_APPLICATION_TEXT_COLORS.recruiting
  }
  return PROGRAM_RECRUITMENT_APPLICATION_TEXT_COLORS.completed
}
const EMPTY_IDS: string[] = []

export function RecruitmentStatusWidget({ isHalfColumn = false }: { isHalfColumn?: boolean }) {
  const navigate = useNavigate()
  const allowedProgramIds =
    useDashboardSettingsStore(s => s.widgetProgramIds[WIDGET_KEY]) ?? EMPTY_IDS
  const { data, isLoading: loading, isError } = useRecruitmentStatusList(allowedProgramIds)
  const programs = data?.rows ?? []
  /** 시안 100% 13192:232449 — 프로그램명 가변 + 200/200/200, 50% 12360:299527 — 가변 + 180/120/120 */
  const statusColumnWidth = isHalfColumn ? 180 : 200
  const countColumnWidth = isHalfColumn ? 120 : 200

  const totalCountLabel = formatDashboardHeaderTotalCount(data?.totalCount ?? null)

  const columns: ColumnsType<DashboardRecruitmentRow> = useMemo(
    () => [
      {
        title: '프로그램명',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        align: 'center',
        render: (value: string) => (
          <span className="dashboard-widget-table__program-name" title={value}>
            {value}
          </span>
        ),
      },
      {
        title: '모집 신청 현황',
        key: 'recruitmentWindowStatus',
        width: statusColumnWidth,
        align: 'center',
        className: 'dashboard-widget-table__cell--status',
        render: (_: unknown, record: DashboardRecruitmentRow) =>
          (
            <StatusBadge
              domain="custom"
              variant="text"
              label={formatRecruitmentWindowStatus(record.recruitmentWindowStatus)}
              accentColor={recruitmentWindowAccentColor(record.recruitmentWindowStatus)}
            />
          ),
      },
      {
        title: '참여자 모집 현황',
        key: 'studentRecruitment',
        width: countColumnWidth,
        align: 'center',
        render: (_: unknown, record: DashboardRecruitmentRow) =>
          formatRecruitmentCount(record.participantApplied, record.participantCapacity),
      },
      {
        title: '봉사자 모집 현황',
        key: 'instructorRecruitment',
        width: countColumnWidth,
        align: 'center',
        render: (_: unknown, record: DashboardRecruitmentRow) =>
          formatRecruitmentCount(record.volunteerApplied, record.volunteerCapacity),
      },
    ],
    [statusColumnWidth, countColumnWidth]
  )

  return (
    <Card
      className="dashboard-widget-table dashboard-widget-table--recruitment"
      title={
        <WidgetTitleWithHandle>
          <span className="widget-card-title">모집 신청 현황</span>
          <Text type="secondary" className="dashboard-widget-table__header-total-count">
            {totalCountLabel}
          </Text>
        </WidgetTitleWithHandle>
      }
      extra={
        <LoadingButton
          type="link"
          size="small"
          onClick={() => navigate(RECRUITMENT_STATUS_MORE_PATH)}
          className="widget-more-button"
        >
          더보기
        </LoadingButton>
      }
    >
      {isError ? (
        <DashboardWidgetQueryError />
      ) : (
        <CmsDataTable<DashboardRecruitmentRow>
          /* 반폭 카드 안 표 — 공통 1080 하한 미적용, 열 합·카드 폭 기준 */
          minTableWidthFloor={0}
          columns={columns}
          dataSource={programs}
          rowKey="id"
          pagination={false}
          loading={loading}
          className="dashboard-widget-table__data cms-data-table--skip-auto-no-col"
          emptyText={<DashboardWidgetEmpty inTable />}
          onRow={record => ({
            onClick: () => {
              navigate(recruitmentProgramDetailPath(record.id, record.programType))
            },
          })}
        />
      )}
    </Card>
  )
}
