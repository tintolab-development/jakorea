/**
 * 일정 상세 Drawer 컴포넌트
 * Phase 3.1: 사이드 패널로 상세 정보 표시
 */

import { Drawer, Descriptions, Tag, Space, Button, Badge, Alert } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { Schedule } from '@/types/domain'
import { mockProgramsMap, mockInstructorsMap } from '@/data/mock'

interface ScheduleDetailDrawerProps {
  open: boolean
  schedule: Schedule | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  loading?: boolean
  isConflict?: boolean
}

export function ScheduleDetailDrawer({
  open,
  schedule,
  onClose,
  onEdit,
  onDelete,
  loading,
  isConflict = false,
}: ScheduleDetailDrawerProps) {
  if (!schedule) return null

  const program = mockProgramsMap.get(schedule.programId)
  const instructor = schedule.instructorId ? mockInstructorsMap.get(schedule.instructorId) : null

  return (
    <Drawer
      title={
        <Space>
          <Tag color="lime">{schedule.title}</Tag>
          {isConflict && <Badge status="error" text="중복 일정" />}
        </Space>
      }
      width={720}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button icon={<EditOutlined />} onClick={onEdit}>
            수정
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={onDelete} loading={loading}>
            삭제
          </Button>
        </Space>
      }
    >
      {isConflict && (
        <Alert
          message="일정 중복"
          description="이 일정은 동일 강사의 다른 일정과 시간이 겹칩니다."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Descriptions column={1} bordered>
        <Descriptions.Item label="프로그램">
          <Tag color="blue">{program?.title || '-'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="일정 제목">{schedule.title}</Descriptions.Item>
        <Descriptions.Item label="날짜">
          {typeof schedule.date === 'string'
            ? new Date(schedule.date).toLocaleDateString('ko-KR')
            : schedule.date.toLocaleDateString('ko-KR')}
        </Descriptions.Item>
        <Descriptions.Item label="시간">
          {schedule.startTime} - {schedule.endTime}
        </Descriptions.Item>
        {schedule.location && <Descriptions.Item label="장소">{schedule.location}</Descriptions.Item>}
        {schedule.onlineLink && (
          <Descriptions.Item label="온라인 링크">
            <a href={schedule.onlineLink} target="_blank" rel="noopener noreferrer">
              {schedule.onlineLink}
            </a>
          </Descriptions.Item>
        )}
        {instructor && (
          <Descriptions.Item label="강사">
            <Tag color="purple">{instructor.name}</Tag> ({instructor.region})
          </Descriptions.Item>
        )}
        <Descriptions.Item label="등록일">
          {typeof schedule.createdAt === 'string'
            ? new Date(schedule.createdAt).toLocaleDateString('ko-KR')
            : schedule.createdAt.toLocaleDateString('ko-KR')}
        </Descriptions.Item>
        <Descriptions.Item label="수정일">
          {typeof schedule.updatedAt === 'string'
            ? new Date(schedule.updatedAt).toLocaleDateString('ko-KR')
            : schedule.updatedAt.toLocaleDateString('ko-KR')}
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
  )
}




