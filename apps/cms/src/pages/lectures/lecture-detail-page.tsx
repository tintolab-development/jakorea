/**
 * 강의 상세 화면
 * Phase 5.7: 강사가 현재 강의 상태를 즉시 이해
 * 참고 화면: U-04-01 강의 상세
 */

import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Card, Space, Typography, Descriptions, Tag, Result, Spin } from 'antd'
import { StatusDisplay, SingleCTA, GuideMessage } from '@/shared/ui'
import {
  mockLectureActivitiesMap,
  mockSchedulesMap,
  mockProgramsMap,
  mockInstructorsMap,
} from '@/data/mock'
import dayjs from 'dayjs'
import type { LectureActivity } from '@/types/domain'

const { Title, Paragraph, Text } = Typography

// 강의 상태 라벨
const lectureStatusLabels: Record<LectureActivity['status'], string> = {
  LECT_01: '강의가 예정되어 있습니다.',
  LECT_02: '현재 강의가 진행 중입니다.',
  LECT_03: '강의가 완료되었습니다.',
}

// 강의 상태 색상
const lectureStatusColors: Record<LectureActivity['status'], string> = {
  LECT_01: 'blue',
  LECT_02: 'processing',
  LECT_03: 'success',
}

export function LectureDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activity, setActivity] = useState<LectureActivity | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadActivity = () => {
      if (!id) {
        setLoading(false)
        return
      }

      try {
        const found = mockLectureActivitiesMap.get(id)
        setActivity(found || null)
      } catch (error) {
        console.error('Failed to load lecture activity:', error)
      } finally {
        setLoading(false)
      }
    }

    loadActivity()
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!activity) {
    return (
      <Result
        status="404"
        title="강의를 찾을 수 없습니다"
        subTitle="요청하신 강의 정보가 존재하지 않거나 삭제되었습니다."
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

  const schedule = mockSchedulesMap.get(activity.scheduleId)
  const program = mockProgramsMap.get(activity.programId)
  const instructor = mockInstructorsMap.get(activity.instructorId)

  if (!schedule || !program) {
    return (
      <Result
        status="404"
        title="관련 정보를 찾을 수 없습니다"
        subTitle="강의와 관련된 일정 또는 프로그램 정보가 없습니다."
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

  const scheduleDate = dayjs(schedule.date)
  const isOnline = !!schedule.onlineLink

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 페이지 헤더 영역 */}
        <div>
          <Title level={2} style={{ margin: 0 }}>
            강의 상세
          </Title>
        </div>

        {/* 강의 상태 요약 영역 (최상단, 가장 강조) */}
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <StatusDisplay
              status={activity.status}
              statusLabels={lectureStatusLabels}
              statusColors={lectureStatusColors}
            />
            {activity.status === 'LECT_01' && (
              <Paragraph style={{ margin: 0, color: '#8c8c8c' }}>
                강의 일정이 확정되었습니다. 준비해주세요.
              </Paragraph>
            )}
          </Space>
        </Card>

        {/* 프로그램 및 일정 정보 영역 */}
        <Card title="프로그램 및 일정 정보">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="프로그램명">
              <Text strong>{program.title}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="강의 일자">
              {scheduleDate.format('YYYY년 MM월 DD일')}
            </Descriptions.Item>
            <Descriptions.Item label="강의 시간">
              {schedule.startTime} - {schedule.endTime}
            </Descriptions.Item>
            <Descriptions.Item label="진행 방식">
              {isOnline ? <Tag color="green">온라인</Tag> : <Tag>오프라인</Tag>}
            </Descriptions.Item>
            {schedule.location && (
              <Descriptions.Item label="장소">
                <Text>{schedule.location}</Text>
              </Descriptions.Item>
            )}
            {schedule.onlineLink && (
              <Descriptions.Item label="참여 링크">
                <Text type="secondary" copyable>
                  {schedule.onlineLink}
                </Text>
              </Descriptions.Item>
            )}
            {instructor && (
              <Descriptions.Item label="강사">
                <Text>{instructor.name}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* 역할 및 수행 안내 영역 */}
        <Card title="역할 및 수행 안내">
          <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {activity.roleDescription}
          </Paragraph>
        </Card>

        {/* 다음 행동 안내 영역 (핵심) */}
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
            {activity.nextRequiredAction.type === 'NONE' && (
              <Paragraph style={{ margin: 0, color: '#8c8c8c' }}>
                현재 추가로 하실 일은 없습니다.
              </Paragraph>
            )}
            {activity.nextRequiredAction.type === 'COMPLETE' && (
              <>
                <Paragraph style={{ margin: 0 }}>
                  강의 종료 후 완료 처리를 진행해 주세요.
                </Paragraph>
                <SingleCTA
                  label="강의 완료 처리"
                  targetUrl={activity.nextRequiredAction.targetUrl}
                  type="primary"
                />
              </>
            )}
            {activity.nextRequiredAction.type === 'REPORT' && (
              <>
                <Paragraph style={{ margin: 0 }}>
                  강의보고서 제출이 필요합니다.
                </Paragraph>
                <SingleCTA
                  label="보고서 작성하기"
                  targetUrl={activity.nextRequiredAction.targetUrl}
                  type="primary"
                />
              </>
            )}
          </Space>
        </Card>

        {/* 보조 안내 영역 */}
        <Card>
          <GuideMessage
            message="강의 완료 후 보고서 제출 및 정산 절차가 진행됩니다."
            type="info"
          />
        </Card>
      </Space>
    </div>
  )
}

