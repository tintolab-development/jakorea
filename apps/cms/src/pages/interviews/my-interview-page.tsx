/**
 * 내 면접 일정 확인 페이지 (강사/봉사자용)
 * Phase 4.3.2: 면접 관리
 */

import { useEffect, useState } from 'react'
import { Card, Descriptions, Tag, Alert, Space } from 'antd'
import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getInterviewByUserId } from '@/entities/interview/api/interview-service'
import { InterviewStatusBadge } from '@/shared/components/interview-status-badge'
import type { Interview } from '@/types/interview'

export function MyInterviewPage() {
  const { user } = useAuthStore()
  const [interview, setInterview] = useState<Interview | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchMyInterview()
    }
  }, [user?.id])

  const fetchMyInterview = async () => {
    setLoading(true)
    try {
      const data = await getInterviewByUserId(user!.id)
      setInterview(data)
    } catch (error) {
      console.error('면접 정보 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <Alert message="로그인이 필요합니다" type="warning" />
  }

  if (loading) {
    return <div>로딩 중...</div>
  }

  if (!interview) {
    return (
      <Card>
        <Alert
          message="면접 정보가 없습니다"
          description="아직 신청하지 않았거나 면접 정보가 등록되지 않았습니다."
          type="info"
        />
      </Card>
    )
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>내 면접 일정</h1>

      <Card>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="신청 유형">
            <Tag color={interview.userRole === 'INSTRUCTOR' ? 'blue' : 'green'}>
              {interview.userRole === 'INSTRUCTOR' ? '강사' : '봉사자'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="상태">
            <InterviewStatusBadge status={interview.status} />
          </Descriptions.Item>
          <Descriptions.Item label="참여이력">
            {interview.participationHistory}회
          </Descriptions.Item>
          {interview.scheduledAt && (
            <>
              <Descriptions.Item label="면접 일정">
                <Space>
                  <CalendarOutlined />
                  {new Date(interview.scheduledAt).toLocaleString('ko-KR')}
                </Space>
              </Descriptions.Item>
              {interview.location && (
                <Descriptions.Item label="면접 장소">
                  {interview.location}
                </Descriptions.Item>
              )}
            </>
          )}
          {interview.interviewResult && (
            <Descriptions.Item label="면접 결과">
              <Tag color={interview.interviewResult === 'PASS' ? 'green' : 'red'}>
                {interview.interviewResult === 'PASS' ? '합격' : '불합격'}
              </Tag>
            </Descriptions.Item>
          )}
          {interview.status === 'APPROVED' && (
            <Descriptions.Item label="승인 일자">
              {interview.approvedAt
                ? new Date(interview.approvedAt).toLocaleString('ko-KR')
                : '-'}
            </Descriptions.Item>
          )}
          {interview.status === 'REJECTED' && interview.rejectionReason && (
            <Descriptions.Item label="반려 사유">
              <Alert message={interview.rejectionReason} type="error" />
            </Descriptions.Item>
          )}
        </Descriptions>

        {interview.status === 'SCHEDULED' && interview.scheduledAt && (
          <Alert
            message="면접 일정이 확정되었습니다"
            description={
              <div>
                <p>
                  면접 일정: {new Date(interview.scheduledAt).toLocaleString('ko-KR')}
                </p>
                {interview.location && <p>면접 장소: {interview.location}</p>}
                <p>면접 일정 변경이 필요하시면 관리자에게 문의해주세요.</p>
              </div>
            }
            type="info"
            style={{ marginTop: 16 }}
            icon={<ClockCircleOutlined />}
          />
        )}
      </Card>
    </div>
  )
}



