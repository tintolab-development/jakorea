/**
 * 마이페이지 메인 화면
 * Phase 5.3: 사용자가 현재 자신의 전체 상태를 즉시 이해
 * 참고 화면: U-03-01 마이페이지 메인
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Space, Typography, List, Tag, Button, Alert } from 'antd'
import { CalendarOutlined, HistoryOutlined } from '@ant-design/icons'
import { StatusDisplay, SingleCTA, GuideMessage } from '@/shared/ui'
import { getMyPageData, mockProgramsMap } from '@/data/mock/mypage'
import dayjs from 'dayjs'
import type { MyPageData, PrimaryStatus } from '@/types/domain'

const { Title, Paragraph, Text } = Typography

// 주요 상태 라벨
const primaryStatusLabels: Record<PrimaryStatus, string> = {
  APPLY_01: '신청이 접수되어 관리자 승인을 기다리고 있습니다.',
  APPLY_02: '신청이 반려되었습니다.',
  APPLY_03: '신청이 승인되었습니다.',
  SCH_01: '일정이 예정되어 있습니다.',
  SCH_02: '일정이 진행 중입니다.',
  SCH_03: '일정이 종료되었습니다.',
  LECT_03: '강의가 완료되었습니다.',
  VOL_03: '봉사가 완료되었습니다.',
  NONE: '현재 진행 중인 활동이 없습니다.',
}

// 주요 상태 색상
const primaryStatusColors: Record<PrimaryStatus, string> = {
  APPLY_01: 'processing',
  APPLY_02: 'error',
  APPLY_03: 'success',
  SCH_01: 'blue',
  SCH_02: 'processing',
  SCH_03: 'success',
  LECT_03: 'success',
  VOL_03: 'success',
  NONE: 'default',
}

export function MyPageMainPage() {
  const navigate = useNavigate()
  const [myPageData, setMyPageData] = useState<MyPageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMyPageData = () => {
      try {
        const data = getMyPageData()
        setMyPageData(data)
      } catch (error) {
        console.error('Failed to load my page data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMyPageData()
  }, [])

  if (loading || !myPageData) {
    return <div>로딩 중...</div>
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 페이지 헤더 영역 */}
        <div>
          <Title level={2} style={{ margin: 0 }}>
            마이페이지
          </Title>
          <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
            신청 현황과 일정, 이력을 한눈에 확인할 수 있습니다.
          </Paragraph>
        </div>

        {/* 상태 요약 영역 (최상단, 가장 강조) */}
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <StatusDisplay
              status={myPageData.primaryStatus}
              statusLabels={primaryStatusLabels}
              statusColors={primaryStatusColors}
            />
            {myPageData.primaryStatus === 'APPLY_01' && (
              <Alert
                message="승인 결과는 마이페이지에서 확인하실 수 있습니다."
                type="info"
                showIcon
                style={{ marginTop: 8 }}
              />
            )}
            {myPageData.primaryStatus === 'APPLY_02' && myPageData.reasonPublic && (
              <Alert
                message={myPageData.reasonPublic}
                type="warning"
                showIcon
                style={{ marginTop: 8 }}
              />
            )}
          </Space>
        </Card>

        {/* To-do 영역 */}
        <Card title="To-do">
          {myPageData.todos.length === 0 ? (
            <Paragraph style={{ margin: 0, color: '#8c8c8c', textAlign: 'center' }}>
              현재 처리하실 작업이 없습니다.
            </Paragraph>
          ) : (
            <List
              dataSource={myPageData.todos}
              renderItem={todo => (
                <List.Item
                  style={{ border: 'none', padding: '12px 0' }}
                  actions={[
                    <Button
                      type="primary"
                      key="action"
                      onClick={() => navigate(todo.targetUrl)}
                    >
                      바로 처리하기
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={todo.label}
                    description={todo.description}
                  />
                </List.Item>
              )}
            />
          )}
        </Card>

        {/* 내 일정 요약 영역 (조건부) */}
        {myPageData.upcomingSchedules && myPageData.upcomingSchedules.length > 0 && (
          <Card
            title={
              <Space>
                <CalendarOutlined />
                <span>내 일정</span>
              </Space>
            }
          >
            <List
              dataSource={myPageData.upcomingSchedules.slice(0, 3)}
              renderItem={schedule => {
                const program = mockProgramsMap.get(schedule.programId)
                const scheduleDate = dayjs(schedule.date)

                return (
                  <List.Item
                    style={{ border: 'none', padding: '12px 0', cursor: 'pointer' }}
                    onClick={() => navigate(`/schedules/${schedule.id}`)}
                  >
                    <List.Item.Meta
                      title={program?.title || '알 수 없는 프로그램'}
                      description={`${scheduleDate.format('YYYY-MM-DD')} ${schedule.startTime} - ${schedule.endTime}`}
                    />
                  </List.Item>
                )
              }}
            />
            {myPageData.upcomingSchedules.length > 3 && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Button type="link" onClick={() => navigate('/schedules/my')}>
                  전체 일정 보기
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* 내 이력 요약 영역 (조건부) */}
        {myPageData.historySummary && myPageData.historySummary.length > 0 && (
          <Card
            title={
              <Space>
                <HistoryOutlined />
                <span>내 이력</span>
              </Space>
            }
          >
            <List
              dataSource={myPageData.historySummary}
              renderItem={history => {
                const program = mockProgramsMap.get(history.programId)
                const roleLabels: Record<string, string> = {
                  INSTRUCTOR: '강사',
                  VOLUNTEER: '봉사자',
                  PARTICIPANT: '참여자',
                }
                const finalStatusLabels: Record<string, string> = {
                  COMPLETED: '완료',
                  CONFIRMED: '확정',
                  CANCELLED: '취소',
                }

                return (
                  <List.Item
                    style={{ border: 'none', padding: '12px 0', cursor: 'pointer' }}
                    onClick={() => navigate(`/histories/${history.id}`)}
                  >
                    <List.Item.Meta
                      title={program?.title || '알 수 없는 프로그램'}
                      description={
                        <Space>
                          <Tag>{roleLabels[history.role]}</Tag>
                          <Text type="secondary">
                            {dayjs(history.completedAt).format('YYYY-MM-DD')}
                          </Text>
                          <Tag color="green">{finalStatusLabels[history.finalStatus]}</Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )
              }}
            />
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <SingleCTA
                label="전체 이력 보기"
                targetUrl="/histories"
                type="primary"
              />
            </div>
          </Card>
        )}

        {/* 보조 안내 영역 */}
        <Card>
          <GuideMessage
            message="상태 변경 및 결과 안내는 서비스 알림과 함께 마이페이지에서 확인할 수 있습니다."
            type="info"
          />
        </Card>
      </Space>
    </div>
  )
}

