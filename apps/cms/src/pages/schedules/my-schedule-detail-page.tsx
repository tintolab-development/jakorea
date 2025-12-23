/**
 * 일정 상세 화면
 * Phase 5.6: 사용자가 확정된 일정의 핵심 정보를 정확히 확인
 * 참고 화면: U-03-04 일정 상세
 */

import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Card, Space, Typography, Descriptions, Tag, Button, Result, Spin, Alert } from 'antd'
import { LinkOutlined } from '@ant-design/icons'
import { StatusDisplay, SingleCTA, GuideMessage } from '@/shared/ui'
import { mockSchedulesMap, mockProgramsMap, mockApplications } from '@/data/mock'
import dayjs from 'dayjs'
import type { Schedule } from '@/types/domain'

const { Title, Paragraph, Text } = Typography

// 일정 상태 타입
type ScheduleStatus = 'SCH_01' | 'SCH_02' | 'SCH_03' | 'SCH_04'

// 일정 상태 라벨
const scheduleStatusLabels: Record<ScheduleStatus | string, string> = {
  SCH_01: '일정이 예정되어 있습니다.',
  SCH_02: '현재 일정이 진행 중입니다.',
  SCH_03: '일정이 종료되었습니다.',
  SCH_04: '일정이 취소되었습니다.',
}

// 일정 상태 색상
const scheduleStatusColors: Record<ScheduleStatus | string, string> = {
  SCH_01: 'blue',
  SCH_02: 'processing',
  SCH_03: 'success',
  SCH_04: 'error',
}

export function MyScheduleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSchedule = () => {
      if (!id) {
        setLoading(false)
        return
      }

      try {
        const found = mockSchedulesMap.get(id)
        setSchedule(found || null)
      } catch (error) {
        console.error('Failed to load schedule:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSchedule()
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!schedule) {
    return (
      <Result
        status="404"
        title="일정을 찾을 수 없습니다"
        subTitle="요청하신 일정 정보가 존재하지 않거나 삭제되었습니다."
        extra={
          <SingleCTA
            label="홈으로 이동"
            targetUrl="/"
            type="primary"
          />
        }
      />
    )
  }

  const program = mockProgramsMap.get(schedule.programId)
  const programName = program?.title || '알 수 없는 프로그램'

  // 일정 상태 결정 (Mock: 날짜 기반)
  const scheduleDate = dayjs(schedule.date)
  const now = dayjs()
  let status: ScheduleStatus | 'SCH_04' = 'SCH_01'

  if (scheduleDate.isBefore(now, 'day')) {
    status = 'SCH_03' // 종료
  } else if (scheduleDate.isSame(now, 'day')) {
    status = 'SCH_02' // 진행 중
  }

  // 승인된 신청 확인
  const approvedApplication = mockApplications.find(
    app => app.programId === schedule.programId && app.status === 'approved'
  )

  // 참여 역할 결정
  const role =
    approvedApplication?.subjectType === 'instructor'
      ? '강사'
      : approvedApplication?.subjectType === 'student'
        ? '참여자'
        : '봉사자'

  // 온라인 참여 가능 여부
  const canJoinOnline = schedule.onlineLink && (status === 'SCH_01' || status === 'SCH_02')

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 페이지 헤더 영역 */}
        <div>
          <Title level={2} style={{ margin: 0 }}>
            일정 상세
          </Title>
          <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
            확정된 일정 정보만 표시됩니다.
          </Paragraph>
        </div>

        {/* 일정 상태 요약 영역 (최상단, 가장 강조) */}
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <StatusDisplay
              status={status}
              statusLabels={scheduleStatusLabels}
              statusColors={scheduleStatusColors}
            />
            {(status as string) === 'SCH_04' && (
              <Alert
                message="일정이 취소되었습니다"
                description="취소된 일정입니다. 자세한 사유는 관리자에게 문의해주세요."
                type="warning"
                showIcon
              />
            )}
          </Space>
        </Card>

        {/* 일정 핵심 정보 영역 */}
        <Card title="일정 정보">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="프로그램명">
              <Text strong>{programName}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="참여 역할">
              <Tag color="blue">{role}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="일정 제목">
              {schedule.title}
            </Descriptions.Item>
            <Descriptions.Item label="일자">
              {scheduleDate.format('YYYY년 MM월 DD일')}
            </Descriptions.Item>
            <Descriptions.Item label="시간">
              {schedule.startTime} - {schedule.endTime}
            </Descriptions.Item>
            {schedule.location && (
              <Descriptions.Item label="장소">
                <Text>{schedule.location}</Text>
              </Descriptions.Item>
            )}
            {schedule.onlineLink && (
              <Descriptions.Item label="진행 방식">
                <Tag color="green">온라인</Tag>
                {canJoinOnline && (
                  <Button
                    type="link"
                    icon={<LinkOutlined />}
                    href={schedule.onlineLink}
                    target="_blank"
                    style={{ marginLeft: 8 }}
                  >
                    참여 링크
                  </Button>
                )}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* 참여 안내 / 준비 정보 영역 (조건부) */}
        {program?.description && (
          <Card title="프로그램 안내">
            <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {program.description}
            </Paragraph>
          </Card>
        )}

        {/* 다음 행동 안내 영역 */}
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
            {canJoinOnline ? (
              <>
                <Paragraph style={{ margin: 0 }}>
                  <Text>온라인으로 참여하실 수 있습니다.</Text>
                </Paragraph>
                <Button
                  type="primary"
                  size="large"
                  icon={<LinkOutlined />}
                  href={schedule.onlineLink}
                  target="_blank"
                  style={{ minWidth: 200 }}
                >
                  온라인 참여하기
                </Button>
              </>
            ) : (
              <Paragraph style={{ margin: 0, color: '#8c8c8c' }}>
                현재 추가로 하실 일은 없습니다.
              </Paragraph>
            )}
          </Space>
        </Card>

        {/* 보조 안내 영역 */}
        <Card>
          <GuideMessage
            message="일정 변경이나 취소가 필요한 경우 관리자에게 문의해주세요."
            type="info"
          />
        </Card>
      </Space>
    </div>
  )
}

