/**
 * 면접 상세 Drawer 컴포넌트
 * Phase 4.3.2: 면접 관리
 */

import { Drawer, Descriptions, Tag } from 'antd'
import type { Interview } from '@/types/interview'
import { InterviewStatusBadge } from '@/shared/components/interview-status-badge'

interface InterviewDetailDrawerProps {
  open: boolean
  interview: Interview | null
  onClose: () => void
}

export function InterviewDetailDrawer({ open, interview, onClose }: InterviewDetailDrawerProps) {
  if (!interview) return null

  return (
    <Drawer title="면접 상세 정보" open={open} onClose={onClose} width={600}>
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
          <Descriptions.Item label="면접 일정">
            {new Date(interview.scheduledAt).toLocaleString('ko-KR')}
          </Descriptions.Item>
        )}
        {interview.location && (
          <Descriptions.Item label="면접 장소">
            {interview.location}
          </Descriptions.Item>
        )}
        {interview.interviewResult && (
          <Descriptions.Item label="면접 결과">
            <Tag color={interview.interviewResult === 'PASS' ? 'green' : 'red'}>
              {interview.interviewResult === 'PASS' ? '합격' : '불합격'}
            </Tag>
          </Descriptions.Item>
        )}
        {interview.interviewNotes && (
          <Descriptions.Item label="면접 노트">
            {interview.interviewNotes}
          </Descriptions.Item>
        )}
        {interview.rejectionReason && (
          <Descriptions.Item label="반려 사유">
            {interview.rejectionReason}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="신청 일자">
          {new Date(interview.createdAt).toLocaleString('ko-KR')}
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
  )
}

