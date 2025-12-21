/**
 * 최근 활동 목록 컴포넌트
 * Phase 5: 대시보드 최근 활동 목록
 */

import { Card, List, Tag, Space, Typography, Empty, Row, Col } from 'antd'
import { useNavigate } from 'react-router-dom'
import { FileTextOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons'
import { mockApplications, mockMatchings, mockSchedules, mockProgramsMap, mockInstructorsMap } from '@/data/mock'
import dayjs from 'dayjs'

const { Text } = Typography

interface RecentActivitiesProps {
  limit?: number
}

const statusLabels: Record<string, string> = {
  submitted: '접수',
  reviewing: '검토',
  approved: '확정',
  rejected: '거절',
  cancelled: '취소',
}

const statusColors: Record<string, string> = {
  submitted: 'default',
  reviewing: 'processing',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
}

const matchingStatusLabels: Record<string, string> = {
  pending: '대기',
  confirmed: '확정',
  cancelled: '취소',
}

const matchingStatusColors: Record<string, string> = {
  pending: 'default',
  confirmed: 'success',
  cancelled: 'error',
}

export function RecentActivities({ limit = 5 }: RecentActivitiesProps) {
  const navigate = useNavigate()

  // 최근 신청 목록 (생성일 기준 내림차순)
  const recentApplications = [...mockApplications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)

  // 최근 매칭 목록 (생성일 기준 내림차순)
  const recentMatchings = [...mockMatchings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)

  // 최근 일정 목록 (일정 날짜 기준 내림차순)
  const recentSchedules = [...mockSchedules]
    .sort((a, b) => {
      const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date
      const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date
      return dateB.getTime() - dateA.getTime()
    })
    .slice(0, limit)

  const handleApplicationClick = () => {
    navigate(`/applications`)
  }

  const handleMatchingClick = () => {
    navigate(`/matchings`)
  }

  const handleScheduleClick = () => {
    navigate(`/schedules`)
  }

  return (
    <Row gutter={16}>
      {/* 최근 신청 */}
      <Col span={8}>
        <Card
          title={
            <Space>
              <FileTextOutlined />
              <span>최근 신청</span>
            </Space>
          }
          size="small"
        >
          {recentApplications.length > 0 ? (
            <List
              dataSource={recentApplications}
              renderItem={(application) => {
                const program = mockProgramsMap.get(application.programId)
                return (
                  <List.Item
                    style={{ cursor: 'pointer', padding: '8px 0' }}
                    onClick={handleApplicationClick}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{program?.title || '프로그램 없음'}</Text>
                          <Tag color={statusColors[application.status]}>{statusLabels[application.status]}</Tag>
                        </Space>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(application.createdAt).format('YYYY-MM-DD HH:mm')}
                        </Text>
                      }
                    />
                  </List.Item>
                )
              }}
            />
          ) : (
            <Empty description="최근 신청이 없습니다" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </Col>

      {/* 최근 매칭 */}
      <Col span={8}>
        <Card
          title={
            <Space>
              <TeamOutlined />
              <span>최근 매칭</span>
            </Space>
          }
          size="small"
        >
          {recentMatchings.length > 0 ? (
            <List
              dataSource={recentMatchings}
              renderItem={(matching) => {
                const program = mockProgramsMap.get(matching.programId)
                const instructor = mockInstructorsMap.get(matching.instructorId)
                return (
                  <List.Item
                    style={{ cursor: 'pointer', padding: '8px 0' }}
                    onClick={handleMatchingClick}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{program?.title || '프로그램 없음'}</Text>
                          <Tag color={matchingStatusColors[matching.status]}>
                            {matchingStatusLabels[matching.status] || matching.status}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            강사: {instructor?.name || '-'}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(matching.createdAt).format('YYYY-MM-DD HH:mm')}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )
              }}
            />
          ) : (
            <Empty description="최근 매칭이 없습니다" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </Col>

      {/* 최근 일정 */}
      <Col span={8}>
        <Card
          title={
            <Space>
              <CalendarOutlined />
              <span>최근 일정</span>
            </Space>
          }
          size="small"
        >
          {recentSchedules.length > 0 ? (
            <List
              dataSource={recentSchedules}
              renderItem={(schedule) => {
                const program = mockProgramsMap.get(schedule.programId)
                const scheduleDate = typeof schedule.date === 'string' ? dayjs(schedule.date) : dayjs(schedule.date)
                return (
                  <List.Item
                    style={{ cursor: 'pointer', padding: '8px 0' }}
                    onClick={handleScheduleClick}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{schedule.title || '일정 제목 없음'}</Text>
                          <Tag color="blue">{scheduleDate.format('YYYY-MM-DD')}</Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            프로그램: {program?.title || '-'}
                            {schedule.instructorId && (
                              <> | 강사: {mockInstructorsMap.get(schedule.instructorId)?.name || '-'}</>
                            )}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {schedule.startTime} - {schedule.endTime}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )
              }}
            />
          ) : (
            <Empty description="최근 일정이 없습니다" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </Col>
    </Row>
  )
}

