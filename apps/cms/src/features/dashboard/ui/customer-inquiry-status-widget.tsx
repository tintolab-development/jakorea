/**
 * 프로그램 별 문의 현황 위젯
 * 프로그램별 답변 대기 / 답변 완료 / 전체 건수를 테이블로 표시
 */

import { Card, Typography } from 'antd'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingButton } from '@/shared/ui'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import { DashboardWidgetQueryError } from './dashboard-widget-query-error'
import { DashboardWidgetEmpty } from './dashboard-widget-empty'
import { useDashboardSettingsStore } from '../model/dashboard-settings-store'
import { useProgramInquiryStatusList } from '../hooks/use-program-inquiry-status-list'
import type { ProgramInquiryRow } from '../api/adapters/dashboard-adapters'
import { inquiryListPath } from '../lib/dashboard-widget-links'
import '@/shared/ui/widget-more-button.css'
import './dashboard-widget-table.css'

const { Text } = Typography

const WIDGET_KEY = 'customer-inquiry-status-widget'
const EMPTY_IDS: string[] = []

export function CustomerInquiryStatusWidget({ isHalfColumn = false }: { isHalfColumn?: boolean }) {
  const navigate = useNavigate()
  const allowedProgramIds =
    useDashboardSettingsStore(s => s.widgetProgramIds[WIDGET_KEY]) ?? EMPTY_IDS
  const inquiryNotificationReadProgramKeys =
    useDashboardSettingsStore(s => s.inquiryNotificationReadProgramKeys) ?? {}

  const { data, isLoading: loading, isError, isFetched } = useProgramInquiryStatusList(
    allowedProgramIds
  )
  const rows = data ?? []
  const totalCount = isFetched ? rows.length : null
  /** 시안 100% 13192:232459 — 프로그램명 가변 + 200/200/200, 50% 12360:299676 — 가변 + 80/80/80 */
  const countColumnWidth = isHalfColumn ? 80 : 200

  const goToInquiryListForProgram = useCallback(
    (record: ProgramInquiryRow) => {
      navigate(inquiryListPath(record.programId, record.programName))
    },
    [navigate]
  )

  const handleMoreClick = useCallback(() => {
    navigate(inquiryListPath())
  }, [navigate])

  const columns: ColumnsType<ProgramInquiryRow> = useMemo(
    () => [
      {
        title: '프로그램명',
        dataIndex: 'programName',
        key: 'programName',
        ellipsis: true,
        align: 'center',
        render: (value: string) => (
          <span className="dashboard-widget-table__program-name" title={value}>
            {value}
          </span>
        ),
      },
      {
        title: '답변 대기',
        dataIndex: 'pending',
        key: 'pending',
        width: countColumnWidth,
        align: 'center',
        render: (value: number | null, record: ProgramInquiryRow) =>
          /* 시안 Status / Text / Alarm: 0건도 브랜드 색, 점은 미확인 문의가 있을 때만 */
          value != null ? (
            <span className="dashboard-widget-table__pending-btn" role="presentation">
              <span className="dashboard-widget-table__pending-inner">
                <span className="dashboard-widget-table__pending-text">{value}건</span>
                {!inquiryNotificationReadProgramKeys[record.key] &&
                  record.unreadCount != null &&
                  record.unreadCount > 0 && (
                  <span className="dashboard-widget-table__pending-dot" aria-hidden />
                )}
              </span>
            </span>
          ) : (
            <span className="dashboard-widget-table__count--muted">-</span>
          ),
      },
      {
        title: '답변 완료',
        dataIndex: 'answered',
        key: 'answered',
        width: countColumnWidth,
        align: 'center',
        render: (value: number | null) => (
          <span className="dashboard-widget-table__count--muted">
            {value == null ? '-' : `${value}건`}
          </span>
        ),
      },
      {
        title: '전체',
        dataIndex: 'total',
        key: 'total',
        width: countColumnWidth,
        align: 'center',
        render: (value: number | null) => (
          <span className="dashboard-widget-table__count--muted">
            {value == null ? '-' : `${value}건`}
          </span>
        ),
      },
    ],
    [countColumnWidth, inquiryNotificationReadProgramKeys]
  )

  return (
    <Card
      className="dashboard-widget-table dashboard-widget-table--customer-inquiry"
      title={
        <WidgetTitleWithHandle>
          <span className="widget-card-title">프로그램 별 문의 현황</span>
          <Text type="secondary" className="dashboard-widget-table__header-total-count">
            {totalCount == null ? '총 -' : `총 ${totalCount}건`}
          </Text>
        </WidgetTitleWithHandle>
      }
      extra={
        <LoadingButton type="link" size="small" onClick={handleMoreClick} className="widget-more-button">
          더보기
        </LoadingButton>
      }
    >
      {isError ? (
        <DashboardWidgetQueryError />
      ) : (
        <CmsDataTable<ProgramInquiryRow>
          /* 반폭 카드 안 표 — 공통 1080 하한 미적용, 열 합·카드 폭 기준 */
          minTableWidthFloor={0}
          columns={columns}
          dataSource={rows}
          rowKey="key"
          pagination={false}
          loading={loading}
          className="dashboard-widget-table__data cms-data-table--skip-auto-no-col"
          emptyText={<DashboardWidgetEmpty inTable />}
          onRow={record => ({
            onClick: () => goToInquiryListForProgram(record),
          })}
        />
      )}
    </Card>
  )
}
