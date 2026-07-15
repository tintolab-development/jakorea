/**
 * 봉사자용 대기 중인 작업 목록
 * Phase: 봉사단 권한 마이그레이션
 */

import { Card, List, Tag, Typography, Empty } from 'antd'
import { RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { LoadingButton } from '@/shared/ui'
import { WIDGET_MORE_ALERT_MESSAGE } from '@/shared/constants/widget-styles'
import { formatDate } from '@/shared/utils'
import dayjs from 'dayjs'

const { Text } = Typography

interface PendingTask {
  id: string
  type: 'report'
  programId: string
  programTitle: string
  dueDate?: string
  status?: string
}

interface VolunteerPendingTasksListProps {
  reportPending: number
  reportTasks?: PendingTask[]
  loading?: boolean
}

export function VolunteerPendingTasksList({
  reportPending,
  reportTasks = [],
  loading = false,
}: VolunteerPendingTasksListProps) {
  const navigate = useNavigate()

  const handleViewAll = () => {
    window.alert(WIDGET_MORE_ALERT_MESSAGE)
  }

  const renderTaskItem = (task: PendingTask) => {
    const isOverdue = task.dueDate ? dayjs(task.dueDate).isBefore(dayjs(), 'day') : false

    return (
      <List.Item
        style={{ padding: '12px 0', cursor: 'pointer' }}
        onClick={() => navigate('/instructor/reports')}
      >
        <List.Item.Meta
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag color={isOverdue ? 'red' : 'orange'}>보고서</Tag>
              <Text strong>{task.programTitle}</Text>
            </div>
          }
          description={
            task.dueDate && (
              <Text type={isOverdue ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
                마감일: {formatDate(task.dueDate, { dateStyle: 'medium' })}
              </Text>
            )
          }
        />
      </List.Item>
    )
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>대기 중인 보고서</span>
          {reportPending > 0 && <Tag color="red">{reportPending}</Tag>}
        </div>
      }
      loading={loading}
      style={{ height: '100%' }}
    >
      {reportTasks.length === 0 ? (
        <Empty
          description="대기 중인 보고서가 없습니다"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '20px 0' }}
        />
      ) : (
        <>
          <List dataSource={reportTasks.slice(0, 5)} renderItem={renderTaskItem} />
          {reportTasks.length > 5 && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <LoadingButton type="link" size="small" onClick={handleViewAll}>
                더보기 <RightOutlined />
              </LoadingButton>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
