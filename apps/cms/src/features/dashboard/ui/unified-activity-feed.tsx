/**
 * 통합 활동 피드
 * Phase 1: 대시보드 고도화
 * 최근 신청/매칭/일정/정산을 시간순으로 통합 표시
 */

import { Card, List, Tag, Space, Typography, Pagination } from 'antd'
import { EmptyState } from '@/shared/ui'
import { useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { FileTextOutlined, CalendarOutlined } from '@ant-design/icons'
import { programService } from '@/entities/program/api/program-service'
import { applicationService } from '@/entities/application/api/application-service'
import dayjs from 'dayjs'
import {
  applicationStatusStatusConfig,
  getApplicationStatusLabel,
  getCommonStatusLabel,
  getSettlementStatusLabel,
} from '@/shared/constants/status'

const { Text } = Typography

interface ActivityItem {
  id: string
  type: 'application' | 'matching' | 'schedule' | 'settlement'
  action: string
  programName: string
  details: Record<string, any>
  createdAt: string
  icon: React.ReactNode
  color: string
  path: string
}

interface UnifiedActivityFeedProps {
  pageSize?: number
}

export function UnifiedActivityFeed({ pageSize = 10 }: UnifiedActivityFeedProps) {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)

  // 모든 활동 데이터 준비 (페이지네이션 전 전체 데이터)
  const allActivities: ActivityItem[] = useMemo(() => {
    // 최근 신청
    const recentApplications: ActivityItem[] = [...applicationService.getAllSync()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(application => {
        const program = programService.getByIdSync(application.programId)
        return {
          id: application.id,
          type: 'application' as const,
          action: '신청 접수',
          programName: program?.title || '프로그램 없음',
          details: {
            status: application.status,
            subjectType: application.subjectType,
          },
          createdAt: typeof application.createdAt === 'string' ? application.createdAt : application.createdAt.toISOString(),
          icon: <FileTextOutlined />,
          color: applicationStatusStatusConfig[application.status]?.color || 'default',
          path: '/programs/education/enrollment',
        }
      })

    const recentMatchings: ActivityItem[] = []
    const recentSchedules: ActivityItem[] = []
    const recentSettlements: ActivityItem[] = []

    // 모든 활동을 시간순으로 통합
    return [
      ...recentApplications,
      ...recentMatchings,
      ...recentSchedules,
      ...recentSettlements,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [])

  // 페이지네이션 적용
  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return allActivities.slice(startIndex, endIndex)
  }, [allActivities, currentPage, pageSize])

  const handleActivityClick = (activity: ActivityItem) => {
    navigate(activity.path)
  }

  const getActivityDescription = (activity: ActivityItem): string => {
    switch (activity.type) {
      case 'application':
        return `주체: ${activity.details.subjectType === 'school' ? '학교' : activity.details.subjectType === 'instructor' ? '강사' : '학생'} | 상태: ${getApplicationStatusLabel(activity.details.status)}`
      case 'matching':
        return `강사: ${activity.details.instructorName} | 상태: ${getCommonStatusLabel(activity.details.status)}`
      case 'schedule':
        return `일시: ${activity.details.date} ${activity.details.time}${activity.details.instructorName ? ` | 강사: ${activity.details.instructorName}` : ''}`
      case 'settlement':
        return `금액: ${activity.details.amount.toLocaleString()}원 | 상태: ${getSettlementStatusLabel(activity.details.status)}`
      default:
        return ''
    }
  }

  const getTimeAgo = (createdAt: string): string => {
    const now = dayjs()
    const created = dayjs(createdAt)
    
    // 미래 시간이거나 유효하지 않은 경우 처리
    if (!created.isValid() || created.isAfter(now)) {
      return created.format('YYYY-MM-DD')
    }

    const diffSeconds = now.diff(created, 'second')
    const diffMinutes = now.diff(created, 'minute')
    const diffHours = now.diff(created, 'hour')
    const diffDays = now.diff(created, 'day')

    // 1분 미만: 방금 전
    if (diffSeconds < 60) {
      return '방금 전'
    }
    // 1시간 미만: N분 전
    else if (diffMinutes < 60) {
      return `${diffMinutes}분 전`
    }
    // 24시간 미만: N시간 전
    else if (diffHours < 24) {
      return `${diffHours}시간 전`
    }
    // 7일 미만: N일 전
    else if (diffDays < 7) {
      return `${diffDays}일 전`
    }
    // 그 외: 날짜 형식
    else {
      return created.format('YYYY-MM-DD')
    }
  }

  return (
    <Card
      title={
        <Space>
          <CalendarOutlined />
          <span>최근 활동</span>
        </Space>
      }
      style={{ height: '100%' }}
    >
      {allActivities.length > 0 ? (
        <>
          <List
            dataSource={paginatedActivities}
            renderItem={(activity) => (
              <List.Item
                style={{ cursor: 'pointer', padding: '12px 0' }}
                onClick={() => handleActivityClick(activity)}
              >
                <List.Item.Meta
                  avatar={
                    <Space>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: `${activity.color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: activity.color,
                        }}
                      >
                        {activity.icon}
                      </div>
                    </Space>
                  }
                  title={
                    <Space>
                      <Text strong>{activity.programName}</Text>
                      <Tag color={activity.color}>{activity.action}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {getTimeAgo(activity.createdAt)}
                      </Text>
                    </Space>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {getActivityDescription(activity)}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
          {allActivities.length > pageSize && (
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Pagination
                current={currentPage}
                total={allActivities.length}
                pageSize={pageSize}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                showTotal={(total) => `총 ${total}개`}
              />
            </div>
          )}
        </>
      ) : (
        <EmptyState description="최근 활동이 없습니다" />
      )}
    </Card>
  )
}

