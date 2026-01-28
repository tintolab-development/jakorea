/**
 * 봉사 상세 화면
 * Phase 5.8: 봉사자가 현재 봉사 상태를 즉시 이해
 * 참고 화면: U-04-02 봉사 상세
 */

import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Card, Space, Typography, Descriptions, Tag, Result, Spin, Alert } from 'antd'
import { StatusDisplay, SingleCTA, GuideMessage } from '@/shared/ui'
import { mockSchedulesMap, mockProgramsMap } from '@/data/mock'
import { mockVolunteerActivitiesMap } from '@/data/mock/activities'
import dayjs from 'dayjs'
import type { VolunteerActivity } from '@/types/domain'

const { Title, Paragraph, Text } = Typography

// 봉사 상태 라벨
const volunteerStatusLabels: Record<VolunteerActivity['status'], string> = {
  VOL_01: '봉사가 예정되어 있습니다.',
  VOL_02: '현재 봉사가 진행 중입니다.',
  VOL_03: '봉사가 완료되었습니다.',
}

// 봉사 상태 색상
const volunteerStatusColors: Record<VolunteerActivity['status'], string> = {
  VOL_01: 'blue',
  VOL_02: 'processing',
  VOL_03: 'success',
}

export function VolunteerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activity, setActivity] = useState<VolunteerActivity | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadActivity = () => {
      const fallbackActivity = Array.from(mockVolunteerActivitiesMap.values())[0]
      const activityId = id || fallbackActivity?.id
      if (!activityId) {
        setLoading(false)
        return
      }

      try {
        const found = mockVolunteerActivitiesMap.get(activityId)
        setActivity(found || null)
      } catch (error) {
        console.error('Failed to load volunteer activity:', error)
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
        title="봉사를 찾을 수 없습니다"
        subTitle="요청하신 봉사 정보가 존재하지 않거나 삭제되었습니다."
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

  if (!schedule || !program) {
    return (
      <Result
        status="404"
        title="관련 정보를 찾을 수 없습니다"
        subTitle="봉사와 관련된 일정 또는 프로그램 정보가 없습니다."
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
        {/* 페이지 헤더 영역 - Phase 5.8: FORBIDDEN 원칙 준수 (복수 주요 CTA 제거) */}
        <div>
          <Title level={2} style={{ margin: 0 }}>
            봉사 상세
          </Title>
        </div>

        {/* 봉사 상태 요약 영역 (최상단, 가장 강조) - Phase 5.8 */}
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <StatusDisplay
              status={activity.status}
              statusLabels={volunteerStatusLabels}
              statusColors={volunteerStatusColors}
            />
            {/* VOL_01 상태일 때 필수 추가 문구 - Phase 5.8 */}
            {activity.status === 'VOL_01' && (
              <Paragraph style={{ margin: 0, color: '#8c8c8c', fontSize: 14 }}>
                현재 활동은 아직 시작되지 않았습니다. 활동이 시작되면 이 화면에서 안내드립니다.
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
            <Descriptions.Item label="봉사 일자">
              {scheduleDate.format('YYYY년 MM월 DD일')}
            </Descriptions.Item>
            <Descriptions.Item label="봉사 시간">
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
          </Descriptions>
        </Card>

        {/* 봉사 역할 및 수행 안내 영역 */}
        <Card title="봉사 역할 및 수행 안내">
          <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {activity.roleDescription}
          </Paragraph>
        </Card>

        {/* 봉사시간 기준 안내 영역 (필수 고정) */}
        <Card>
          <Alert
            message="봉사시간은 프로그램 기준 고정 시간으로 인정됩니다."
            type="info"
            showIcon
          />
          {activity.volunteerHoursInfo && (
            <div style={{ marginTop: 16 }}>
              <Text strong>인정 봉사시간: 총 {activity.volunteerHoursInfo.hours}시간</Text>
            </div>
          )}
        </Card>

        {/* 다음 행동 안내 영역 (핵심) - Phase 5.8: 조건부 CTA 표시 */}
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
            {activity.nextRequiredAction.type === 'NONE' && (
              <Paragraph style={{ margin: 0, color: '#8c8c8c', fontSize: 15 }}>
                현재 추가로 하실 일은 없습니다.
              </Paragraph>
            )}
            {activity.nextRequiredAction.type === 'COMPLETE' && (
              <>
                <Paragraph style={{ margin: 0 }}>
                  봉사 종료 후 완료 처리를 진행해 주세요.
                </Paragraph>
                <SingleCTA
                  label="봉사 완료 처리"
                  targetUrl={activity.nextRequiredAction.targetUrl}
                  type="primary"
                  block
                  size="large"
                />
              </>
            )}
            {activity.nextRequiredAction.type === 'REPORT' && (
              <>
                <Paragraph style={{ margin: 0 }}>
                  교육보고서 제출이 필요합니다.
                </Paragraph>
                <SingleCTA
                  label="보고서 작성하기"
                  targetUrl={activity.nextRequiredAction.targetUrl}
                  type="primary"
                  block
                  size="large"
                />
              </>
            )}
          </Space>
        </Card>

        {/* 보조 안내 영역 */}
        <Card>
          <GuideMessage
            message="교육보고서 제출 후 봉사시간 확정 절차가 진행됩니다."
            type="info"
          />
        </Card>
      </Space>
    </div>
  )
}

