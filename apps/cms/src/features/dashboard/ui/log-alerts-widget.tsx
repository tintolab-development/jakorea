/**
 * MASTER 전용 로그 알림 위젯
 */
import { Card, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useDashboardLogAlerts } from '../hooks/use-dashboard-log-alerts'
import type { DashboardLogAlertItem } from '../api/admin-dashboard-service'
import { DashboardWidgetQueryError } from './dashboard-widget-query-error'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import './dashboard-widget-table.css'

const { Text } = Typography

const columns: ColumnsType<DashboardLogAlertItem> = [
  {
    title: '동작',
    dataIndex: 'actionType',
    key: 'actionType',
    ellipsis: true,
    align: 'center',
  },
  {
    title: '대상 유형',
    dataIndex: 'targetType',
    key: 'targetType',
    ellipsis: true,
    align: 'center',
  },
  {
    title: '접근 시각',
    dataIndex: 'accessedAt',
    key: 'accessedAt',
    align: 'center',
    render: (value: string) =>
      value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
  },
]

export function LogAlertsWidget() {
  const { data = [], isLoading, isError } = useDashboardLogAlerts()

  return (
    <Card
      className="dashboard-widget-table"
      title={
        <WidgetTitleWithHandle>
          <span className="widget-card-title">로그 알림</span>
          <Text type="secondary" className="dashboard-widget-table__header-total-count">
            총 {data.length}건
          </Text>
        </WidgetTitleWithHandle>
      }
    >
      {isError ? (
        <DashboardWidgetQueryError />
      ) : (
        <Table<DashboardLogAlertItem>
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={false}
          loading={isLoading}
          className="dashboard-widget-table__data"
        />
      )}
    </Card>
  )
}
