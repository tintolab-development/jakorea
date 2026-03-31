/**
 * 통합 활동 피드
 * Phase 1: 대시보드 고도화
 * 최근 신청/매칭/일정/정산을 시간순으로 통합 표시
 */

import { Card, List, Tag, Space, Typography, Empty, Pagination } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import {
  FileTextOutlined,
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { mockApplications, mockMatchings, mockSchedules, mockSettlements } from '@/data/mock'
import { programService } from '@/entities/program/api/program-service'
import { instructorService } from '@/entities/instructor/api/instructor-service'
import dayjs from 'dayjs'
import {
  applicationStatusStatusConfig,
  commonStatusStatusConfig,
  settlementStatusStatusConfig,
  getApplicationStatusLabel,
  getCommonStatusLabel,
  getSettlementStatusLabel,
} from '@/shared/constants/status'
import { domainColorsHex } from '@/shared/constants/colors'

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
    const recentApplications: ActivityItem[] = [...mockApplications]
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

    // 최근 매칭
    const recentMatchings: ActivityItem[] = [...mockMatchings]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(matching => {
        const program = programService.getByIdSync(matching.programId)
        const instructor = instructorService.getByIdSync(matching.instructorId)
        return {
          id: matching.id,
          type: 'matching' as const,
          action: '매칭 확정',
          programName: program?.title || '프로그램 없음',
          details: {
            status: matching.status,
            instructorName: instructor?.name || '-',
          },
          createdAt: typeof matching.createdAt === 'string' ? matching.createdAt : matching.createdAt.toISOString(),
          icon: <TeamOutlined />,
          color: commonStatusStatusConfig[matching.status]?.color || 'default',
          path: '/programs/education/instructor-recruitment',
        }
      })

    // 최근 일정
    const recentSchedules: ActivityItem[] = [...mockSchedules]
      .sort((a, b) => {
        const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date
        const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date
        return dateB.getTime() - dateA.getTime()
      })
      .map(schedule => {
        const program = programService.getByIdSync(schedule.programId)
        const scheduleDate = typeof schedule.date === 'string' ? dayjs(schedule.date) : dayjs(schedule.date)
        return {
          id: schedule.id,
          type: 'schedule' as const,
          action: '일정 등록',
          programName: program?.title || '프로그램 없음',
          details: {
            title: schedule.title,
            date: scheduleDate.format('YYYY-MM-DD'),
            time: `${schedule.startTime} - ${schedule.endTime}`,
            instructorName: schedule.instructorId
              ? instructorService.getNameById(schedule.instructorId)
              : undefined,
          },
          createdAt: typeof schedule.createdAt === 'string' ? schedule.createdAt : schedule.createdAt.toISOString(),
          icon: <CalendarOutlined />,
          color: domainColorsHex.schedule.primary,
          path: '/schedules/my',
        }
      })

    // 최근 정산
    const recentSettlements: ActivityItem[] = [...mockSettlements]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(settlement => {
        const program = programService.getByIdSync(settlement.programId)
        return {
          id: settlement.id,
          type: 'settlement' as const,
          action: '정산 승인',
          programName: program?.title || '프로그램 없음',
          details: {
            status: settlement.status,
            amount: settlement.totalAmount,
          },
          createdAt: typeof settlement.createdAt === 'string' ? settlement.createdAt : settlement.createdAt.toISOString(),
          icon: <DollarOutlined />,
          color: settlementStatusStatusConfig[settlement.status]?.color || 'default',
          path: '/programs/education/enrollment',
        }
      })

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
        <Empty description="최근 활동이 없습니다" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  )
}

