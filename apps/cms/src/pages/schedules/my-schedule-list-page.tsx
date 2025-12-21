/**
 * 내 일정 목록 화면
 * Phase 5.5: 사용자가 승인 완료된 자신의 참여 일정을 한눈에 확인
 * 참고 화면: U-03-03 내 일정 목록
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Space, Typography, List, Tag, Button } from 'antd'
import { CalendarOutlined, EyeOutlined } from '@ant-design/icons'
import { EmptyState, StatusDisplay } from '@/shared/ui'
import { mockSchedules, mockProgramsMap, mockApplications } from '@/data/mock'
import dayjs from 'dayjs'
import type { Schedule } from '@/types/domain'

const { Title, Paragraph, Text } = Typography

// 일정 상태 타입 (Mock 데이터 기반, 실제로는 서버에서 제공)
type ScheduleStatus = 'SCH_01' | 'SCH_02' | 'SCH_03' | 'SCH_04' // 예정, 진행, 종료, 취소

// 일정 상태 라벨
const scheduleStatusLabels: Record<ScheduleStatus, string> = {
  SCH_01: '예정',
  SCH_02: '진행 중',
  SCH_03: '종료',
  SCH_04: '취소',
}

// 일정 상태 색상
const scheduleStatusColors: Record<ScheduleStatus, string> = {
  SCH_01: 'blue',
  SCH_02: 'processing',
  SCH_03: 'success',
  SCH_04: 'error',
}

// 참여 역할 타입
type ParticipationRole = 'INSTRUCTOR' | 'VOLUNTEER' | 'PARTICIPANT'

// 참여 역할 라벨
const roleLabels: Record<ParticipationRole, string> = {
  INSTRUCTOR: '강사',
  VOLUNTEER: '봉사자',
  PARTICIPANT: '참여자',
}

interface UserSchedule {
  schedule: Schedule
  programName: string
  role: ParticipationRole
  status: ScheduleStatus
}

export function MyScheduleListPage() {
  const navigate = useNavigate()
  const [schedules, setSchedules] = useState<UserSchedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock: 승인 완료된 신청을 기반으로 사용자 일정 생성
    const loadUserSchedules = () => {
      try {
        // 승인 완료된 신청만 필터링
        const approvedApplications = mockApplications.filter(
          app => app.status === 'approved'
        )

        // 각 승인된 신청에 대해 일정 찾기
        const userSchedules: UserSchedule[] = []
        approvedApplications.forEach(app => {
          const programSchedules = mockSchedules.filter(
            s => s.programId === app.programId
          )

          programSchedules.forEach(schedule => {
            // 일정 상태 결정 (Mock: 날짜 기반)
            const scheduleDate = dayjs(schedule.date)
            const now = dayjs()
            let status: ScheduleStatus = 'SCH_01'

            if (scheduleDate.isBefore(now, 'day')) {
              status = 'SCH_03' // 종료
            } else if (scheduleDate.isSame(now, 'day')) {
              status = 'SCH_02' // 진행 중
            }

            // 참여 역할 결정 (Mock: subjectType 기반)
            const role: ParticipationRole =
              app.subjectType === 'instructor'
                ? 'INSTRUCTOR'
                : app.subjectType === 'student'
                  ? 'PARTICIPANT'
                  : 'VOLUNTEER'

            const program = mockProgramsMap.get(schedule.programId)
            if (program) {
              userSchedules.push({
                schedule,
                programName: program.title,
                role,
                status,
              })
            }
          })
        })

        // 날짜순 정렬 (가까운 일정부터)
        userSchedules.sort((a, b) => {
          const dateA = dayjs(a.schedule.date)
          const dateB = dayjs(b.schedule.date)
          return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0
        })

        setSchedules(userSchedules)
      } catch (error) {
        console.error('Failed to load schedules:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserSchedules()
  }, [])

  const handleViewDetail = (schedule: Schedule) => {
    navigate(`/schedules/${schedule.id}`)
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 페이지 헤더 영역 */}
        <div>
          <Title level={2} style={{ margin: 0 }}>
            내 일정
          </Title>
          <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
            승인된 프로그램 일정만 표시됩니다.
          </Paragraph>
        </div>

        {/* 일정 리스트 영역 (핵심) */}
        {loading ? (
          <div>로딩 중...</div>
        ) : schedules.length === 0 ? (
          <EmptyState
            description="현재 승인된 일정이 없습니다."
            cta={{
              label: '프로그램 보기',
              targetUrl: '/programs',
              type: 'primary',
            }}
          />
        ) : (
          <List
            dataSource={schedules}
            loading={loading}
            itemLayout="vertical"
            renderItem={item => {
              const { schedule, programName, role, status } = item
              const scheduleDate = dayjs(schedule.date)

              return (
                <List.Item
                  style={{
                    padding: '16px',
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    marginBottom: '16px',
                  }}
                >
                  <Card
                    style={{ width: '100%' }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      {/* 프로그램명 및 상태 */}
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space>
                          <CalendarOutlined style={{ color: '#1890ff' }} />
                          <Text strong style={{ fontSize: 16 }}>
                            {programName}
                          </Text>
                        </Space>
                        <StatusDisplay
                          status={status}
                          statusLabels={scheduleStatusLabels}
                          statusColors={scheduleStatusColors}
                        />
                      </Space>

                      {/* 일정 정보 */}
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div>
                          <Text type="secondary">참여 역할: </Text>
                          <Tag color="blue">{roleLabels[role]}</Tag>
                        </div>
                        <div>
                          <Text type="secondary">일정: </Text>
                          <Text>
                            {scheduleDate.format('YYYY년 MM월 DD일')} {schedule.startTime} - {schedule.endTime}
                          </Text>
                        </div>
                        {schedule.location && (
                          <div>
                            <Text type="secondary">장소: </Text>
                            <Text>{schedule.location}</Text>
                          </div>
                        )}
                        {schedule.onlineLink && !schedule.location && (
                          <div>
                            <Text type="secondary">진행 방식: </Text>
                            <Tag color="green">온라인</Tag>
                          </div>
                        )}
                        {schedule.title && (
                          <div>
                            <Text type="secondary">제목: </Text>
                            <Text>{schedule.title}</Text>
                          </div>
                        )}
                      </Space>

                      {/* 일정 상세 이동 영역 */}
                      <div style={{ textAlign: 'right' }}>
                        <Button
                          type="primary"
                          icon={<EyeOutlined />}
                          onClick={() => handleViewDetail(schedule)}
                        >
                          일정 상세 보기
                        </Button>
                      </div>
                    </Space>
                  </Card>
                </List.Item>
              )
            }}
          />
        )}
      </Space>
    </div>
  )
}

