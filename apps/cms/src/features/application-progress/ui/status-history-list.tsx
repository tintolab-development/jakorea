/**
 * 상태 변경 이력 목록
 * Phase 4.6: 상태 운영 관리
 */

import { List, Tag, Typography, Space } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { StatusChangeLog } from '@/entities/application-progress/api/status-change-service'
import { PROGRESS_STATUS_LABELS, PROGRESS_STATUS_COLORS } from '@/types/application-progress'
import dayjs from 'dayjs'

const { Text } = Typography

interface StatusHistoryListProps {
  history: StatusChangeLog[]
  loading?: boolean
}

export function StatusHistoryList({ history, loading = false }: StatusHistoryListProps) {
  if (history.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        <Text type="secondary">상태 변경 이력이 없습니다</Text>
      </div>
    )
  }

  return (
    <List
      dataSource={history}
      loading={loading}
      renderItem={(log, index) => (
        <List.Item>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Space>
              <Text strong>{index + 1}.</Text>
              <Tag color={PROGRESS_STATUS_COLORS[log.fromStatus]}>
                {PROGRESS_STATUS_LABELS[log.fromStatus]}
              </Tag>
              <Text type="secondary">→</Text>
              <Tag color={PROGRESS_STATUS_COLORS[log.toStatus]}>
                {PROGRESS_STATUS_LABELS[log.toStatus]}
              </Tag>
            </Space>
            <Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(log.changedAt).format('YYYY-MM-DD HH:mm')}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                변경자: {log.changedBy}
              </Text>
              {log.notificationSent ? (
                <Tag icon={<CheckCircleOutlined />} color="green" style={{ fontSize: 11 }}>
                  알림 발송 완료
                </Tag>
              ) : (
                <Tag icon={<ClockCircleOutlined />} color="default" style={{ fontSize: 11 }}>
                  알림 미발송
                </Tag>
              )}
            </Space>
            {log.reason && (
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 24 }}>
                사유: {log.reason}
              </Text>
            )}
          </Space>
        </List.Item>
      )}
    />
  )
}
