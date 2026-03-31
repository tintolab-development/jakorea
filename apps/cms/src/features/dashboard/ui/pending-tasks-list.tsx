/**
 * 대기 중인 작업 목록
 * Phase 5.2.1: 강사/봉사자 대시보드
 */

import { Card, List, Tag, Typography, Button, Empty, Tabs } from 'antd'
import { RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '@/shared/utils'
import dayjs from 'dayjs'

const { Text } = Typography
const { TabPane } = Tabs

interface PendingTask {
  id: string
  type: 'report' | 'settlement'
  programId: string
  programTitle: string
  dueDate?: string
  status?: string
  matchingId?: string
}

interface PendingTasksListProps {
  reportPending: number
  settlementPending: number
  reportTasks?: PendingTask[]
  settlementTasks?: Array<{
    id: string
    programId: string
    programTitle: string
    matchingId: string
  }>
  loading?: boolean
}

export function PendingTasksList({
  reportPending,
  settlementPending,
  reportTasks = [],
  settlementTasks = [],
  loading = false,
}: PendingTasksListProps) {
  const navigate = useNavigate()

  const handleViewAll = (type: 'report' | 'settlement') => {
    if (type === 'report') {
      navigate('/instructor/reports')
    } else {
      navigate('/settlements/my')
    }
  }

  const renderTaskItem = (task: PendingTask) => {
    const isOverdue = task.dueDate ? dayjs(task.dueDate).isBefore(dayjs(), 'day') : false

    return (
      <List.Item
        style={{ padding: '12px 0', cursor: 'pointer' }}
        onClick={() => {
          if (task.type === 'report') {
            navigate('/instructor/reports')
          } else {
            const q = task.matchingId ? `?matchingId=${task.matchingId}` : ''
            navigate(`/settlements/my/submit${q}`)
          }
        }}
      >
        <List.Item.Meta
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag color={isOverdue ? 'red' : 'orange'}>
                {task.type === 'report' ? '보고서' : '정산'}
              </Tag>
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
      title="대기 중인 작업"
      loading={loading}
      style={{ height: '100%' }}
    >
      <Tabs defaultActiveKey="all" size="small">
        <TabPane
          tab={
            <span>
              전체
              {(reportPending + settlementPending) > 0 && (
                <Tag color="red" style={{ marginLeft: 4 }}>
                  {reportPending + settlementPending}
                </Tag>
              )}
            </span>
          }
          key="all"
        >
          {reportTasks.length === 0 && settlementTasks.length === 0 ? (
            <Empty
              description="대기 중인 작업이 없습니다"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: '20px 0' }}
            />
          ) : (
            <>
              {reportTasks.length > 0 && (
                <List
                  dataSource={reportTasks.slice(0, 3)}
                  renderItem={renderTaskItem}
                />
              )}
              {settlementTasks.length > 0 && (
                <List
                  dataSource={settlementTasks.slice(0, 3).map(task => ({
                    id: task.matchingId,
                    type: 'settlement' as const,
                    programId: task.programId,
                    programTitle: task.programTitle,
                    matchingId: task.matchingId,
                  }))}
                  renderItem={renderTaskItem}
                  style={{ marginTop: reportTasks.length > 0 ? 16 : 0 }}
                />
              )}
            </>
          )}
        </TabPane>
        <TabPane
          tab={
            <span>
              보고서
              {reportPending > 0 && (
                <Tag color="red" style={{ marginLeft: 4 }}>
                  {reportPending}
                </Tag>
              )}
            </span>
          }
          key="report"
        >
          {reportTasks.length === 0 ? (
            <Empty
              description="제출 대기 중인 보고서가 없습니다"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: '20px 0' }}
            />
          ) : (
            <>
              <List dataSource={reportTasks.slice(0, 5)} renderItem={renderTaskItem} />
              {reportTasks.length > 5 && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <Button type="link" size="small" onClick={() => handleViewAll('report')}>
                    더보기 <RightOutlined />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabPane>
        <TabPane
          tab={
            <span>
              정산
              {settlementPending > 0 && (
                <Tag color="red" style={{ marginLeft: 4 }}>
                  {settlementPending}
                </Tag>
              )}
            </span>
          }
          key="settlement"
        >
          {settlementTasks.length === 0 ? (
            <Empty
              description="제출 대기 중인 정산이 없습니다"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: '20px 0' }}
            />
          ) : (
            <>
              <List
                dataSource={settlementTasks.slice(0, 5).map(task => ({
                  id: task.matchingId,
                  type: 'settlement' as const,
                  programId: task.programId,
                  programTitle: task.programTitle,
                  matchingId: task.matchingId,
                }))}
                renderItem={renderTaskItem}
              />
              {settlementTasks.length > 5 && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <Button type="link" size="small" onClick={() => handleViewAll('settlement')}>
                    더보기 <RightOutlined />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabPane>
      </Tabs>
    </Card>
  )
}

