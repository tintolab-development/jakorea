/**
 * 강사 신청 상세 Drawer 컴포넌트
 * Phase 4.3: 강의 신청 관리 (FR-F02)
 */

import { Descriptions, Tag, Space } from 'antd'
import type { InstructorApplicationItem } from '@/entities/instructor-application/api/instructor-application-service'
import { BaseDetailDrawer } from '@/shared/ui/base-detail-drawer'
import { LAYOUT_CONSTANTS } from '@/shared/constants'

const statusConfig: Record<InstructorApplicationItem['status'], { label: string; color: string }> =
  {
    PENDING: { label: '대기', color: 'orange' },
    APPROVED: { label: '승인', color: 'green' },
    REJECTED: { label: '거절', color: 'red' },
    CLOSED: { label: '마감', color: 'default' },
  }

interface InstructorApplicationDetailDrawerProps {
  open: boolean
  application: InstructorApplicationItem | null
  onClose: () => void
  loading?: boolean
}

export function InstructorApplicationDetailDrawer({
  open,
  application,
  onClose,
  loading = false,
}: InstructorApplicationDetailDrawerProps) {
  if (!application) return null

  const statusInfo = statusConfig[application.status]

  return (
    <BaseDetailDrawer
      open={open}
      onClose={onClose}
      title={
        <Space>
          <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
          <span>강사 신청 상세</span>
        </Space>
      }
      width={LAYOUT_CONSTANTS.widths.modal.large}
      loading={loading}
      hideActions
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label="강사명">{application.instructorName}</Descriptions.Item>
        <Descriptions.Item label="프로그램명">{application.programName}</Descriptions.Item>
        <Descriptions.Item label="신청일">
          {new Date(application.appliedAt).toLocaleString('ko-KR')}
        </Descriptions.Item>
        <Descriptions.Item label="상태">
          <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
        </Descriptions.Item>
        {application.preferredSchedule && application.preferredSchedule.length > 0 && (
          <Descriptions.Item label="희망 일정">
            {application.preferredSchedule.map((schedule, index) => (
              <div key={index}>{schedule}</div>
            ))}
          </Descriptions.Item>
        )}
        {application.notes && (
          <Descriptions.Item label="비고">{application.notes}</Descriptions.Item>
        )}
      </Descriptions>
    </BaseDetailDrawer>
  )
}
