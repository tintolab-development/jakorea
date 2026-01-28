/**
 * 신청 진행상황 조회 페이지
 * Phase 0.2.4: 진행상황 조회 (FR-D01)
 * 8단계 상태 타임라인 및 상태별 안내 문구 표시
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Timeline, Typography, Space, Tag, Button, Spin, Alert, Empty } from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useApplicationStore } from '@/features/application/model/application-store'
import { useStatusTimeline } from '@/features/auth/hooks/use-status-timeline'
import { APPLICATION_STATUS } from '@/shared/constants/application-status'
import { applicationStatusStatusConfig } from '@/shared/constants/status'
import { StatusBadge } from '@/shared/ui/status-badge'
import { useProgramService } from '@/features/program/hooks/use-program-service'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { APPLICATION_PROGRESS_ORDER, type ApplicationProgressStatus } from '@/types/application-progress'
import dayjs from 'dayjs'

const { Title, Text } = Typography

// Phase 0.2.4: 상태별 안내 문구 (FR-D01)
const STATUS_MESSAGES: Record<ApplicationProgressStatus, string> = {
  RECEIVED: '신청이 접수되었습니다. 관리자 검토 중입니다.',
  MATCHING_IN_PROGRESS: '강사 매칭이 진행 중입니다.',
  MATCHING_COMPLETED: '강사 매칭이 완료되었습니다. 담당 강사 정보를 확인하세요.',
  MATERIAL_PREPARING: '교재 배송을 준비 중입니다.',
  MATERIAL_SHIPPED: '교재가 발송되었습니다. 배송 조회를 확인하세요.',
  IN_PROGRESS: '교육이 진행 중입니다.',
  SURVEY_SUBMITTED: '만족도 조사가 제출되었습니다.',
  REPORT_SUBMITTED: '모든 과정이 완료되었습니다.',
}

export function ApplicationProgressPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { getByIdSync: getProgramByIdSync } = useProgramService()
  const { applications, fetchApplications, loading: applicationsLoading } = useApplicationStore()
  const { timeline, loading: timelineLoading, error: timelineError } = useStatusTimeline(id || null)
  const [application, setApplication] = useState<typeof applications[0] | null>(null)
  const [currentStatus, setCurrentStatus] = useState<ApplicationProgressStatus | null>(null)

  useEffect(() => {
    const loadApplication = async () => {
      if (!id) return

      try {
        await fetchApplications()
        const found = applications.find(a => a.id === id)
        if (found) {
          setApplication(found)
          // 승인된 신청의 경우 진행 상태 확인
          if (found.status === 'approved') {
            const latest = timeline.length > 0 ? timeline[0].status : (found.progressStatus ?? 'RECEIVED')
            setCurrentStatus(latest)
          } else {
            setCurrentStatus(null)
          }
        }
      } catch (error) {
        console.error('신청 정보 로드 실패:', error)
      }
    }

    loadApplication()
  }, [id, fetchApplications, applications, timeline])

  // 권한 확인: 본인 신청만 조회 가능
  const canView = application && user && (
    (user.role === 'INSTRUCTOR' && user.instructorId && application.subjectType === 'instructor' && application.subjectId === user.instructorId) ||
    (user.role === 'INDIVIDUAL' && user.id && (application.subjectType === 'student' || application.subjectType === 'volunteer') && application.subjectId === user.id) ||
    (user.role === 'SCHOOL' && user.id && application.subjectType === 'school' && application.subjectId === user.id)
  )

  if (applicationsLoading || timelineLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!application) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
        <Card>
          <Empty description="신청 정보를 찾을 수 없습니다." />
          <Button type="primary" onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
            돌아가기
          </Button>
        </Card>
      </div>
    )
  }

  if (!canView) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
        <Card>
          <Alert
            message="접근 권한이 없습니다"
            description="본인의 신청 내역만 조회할 수 있습니다."
            type="warning"
            showIcon
          />
          <Button type="primary" onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
            돌아가기
          </Button>
        </Card>
      </div>
    )
  }

  const program = getProgramByIdSync(application.programId)
  const programName = program?.title || '알 수 없는 프로그램'

  // 승인되지 않은 경우 안내
  if (application.status !== 'approved') {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
        <div style={PAGE_HEADER_STYLE}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              돌아가기
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              신청 진행상황
            </Title>
          </Space>
        </div>

        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text strong>프로그램명: </Text>
              <Text>{programName}</Text>
            </div>
            <div>
              <Text strong>현재 상태: </Text>
              <Tag color={application.status === 'rejected' ? 'error' : 'default'}>
                {application.status === 'submitted' ? '접수 완료' :
                 application.status === 'reviewing' ? '검토 중' :
                 application.status === 'rejected' ? '반려' :
                 application.status === 'cancelled' ? '취소' : application.status}
              </Tag>
            </div>
            <Alert
              message="진행상황 조회 안내"
              description="신청이 승인된 후 진행상황을 조회할 수 있습니다."
              type="info"
              showIcon
            />
          </Space>
        </Card>
      </div>
    )
  }

  // 타임라인에서 각 상태의 완료 여부 (이력 있으면 이력 기준, 없으면 progressStatus 기준)
  const getStatusCompletion = (status: ApplicationProgressStatus) => {
    if (timeline.length > 0) return timeline.some(item => item.status === status)
    const cur = application.progressStatus ?? 'RECEIVED'
    const idx = APPLICATION_PROGRESS_ORDER.indexOf(status)
    const curIdx = APPLICATION_PROGRESS_ORDER.indexOf(cur as ApplicationProgressStatus)
    return idx >= 0 && curIdx >= 0 && idx <= curIdx
  }

  const currentStatusMessage = currentStatus ? STATUS_MESSAGES[currentStatus] : null

  // 타임라인 아이템 생성 (8단계 고정)
  const timelineItems = APPLICATION_PROGRESS_ORDER.map((status) => {
    const isCompleted = getStatusCompletion(status)
    const isCurrent = currentStatus === status
    const statusConfig = APPLICATION_STATUS[status]

    let color: string = 'default'
    let icon = <ClockCircleOutlined />

    if (isCurrent) {
      color = 'blue'
      icon = <ClockCircleOutlined />
    } else if (isCompleted) {
      color = 'green'
      icon = <CheckCircleOutlined />
    }

    const timelineItem = timeline.find(item => item.status === status)
    const timestamp = timelineItem ? dayjs(timelineItem.timestamp).format('YYYY-MM-DD HH:mm') : null

    return {
      color,
      dot: icon,
      children: (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <div>
            <Text strong style={{ fontSize: 16 }}>
              {statusConfig.label}
            </Text>
            {isCurrent && (
              <Tag color="blue" style={{ marginLeft: 8 }}>
                진행 중
              </Tag>
            )}
            {isCompleted && !isCurrent && (
              <Tag color="success" style={{ marginLeft: 8 }}>
                완료
              </Tag>
            )}
          </div>
          {timestamp && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {timestamp}
            </Text>
          )}
          {isCurrent && currentStatusMessage && (
            <Alert
              message={currentStatusMessage}
              type="info"
              showIcon
              style={{ marginTop: 8 }}
            />
          )}
        </Space>
      ),
    }
  })

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <div style={PAGE_HEADER_STYLE}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            돌아가기
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            신청 진행상황
          </Title>
        </Space>
      </div>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong>프로그램명: </Text>
            <Text>{programName}</Text>
          </div>
          <div>
            <Text strong>신청일: </Text>
            <Text>{dayjs(application.submittedAt).format('YYYY-MM-DD')}</Text>
          </div>
          {currentStatus && (
            <div>
              <Text strong>현재 진행 단계: </Text>
              <StatusBadge status={currentStatus} statusConfig={applicationStatusStatusConfig} />
            </div>
          )}
        </Space>
      </Card>

      <Card title="진행상황 타임라인" style={{ marginTop: 16 }}>
        {timelineError ? (
          <Alert
            message="타임라인을 불러오는데 실패했습니다"
            description={timelineError.message}
            type="error"
            showIcon
          />
        ) : (
          <Timeline items={timelineItems} />
        )}
      </Card>
    </div>
  )
}
