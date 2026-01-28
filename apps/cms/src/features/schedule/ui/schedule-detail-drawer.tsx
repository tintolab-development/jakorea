/**
 * 일정 상세 Drawer 컴포넌트
 * Phase 3.1: 사이드 패널로 상세 정보 표시
 */

import { Descriptions, Tag, Space, Badge, Alert } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { Schedule } from '@/types/domain'
import { useProgramService } from '@/features/program/hooks/use-program-service'
import { useInstructorService } from '@/features/instructor/hooks/use-instructor-service'
import { domainColorsHex } from '@/shared/constants/colors'
import { LAYOUT_CONSTANTS } from '@/shared/constants'
import { useScheduleStore } from '@/features/schedule/model/schedule-store'
import { BaseDetailDrawer } from '@/shared/ui/base-detail-drawer'

interface ScheduleDetailDrawerProps {
  open: boolean
  schedule?: Schedule | null // optional로 변경하여 store의 selectedSchedule 우선 사용
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
  const { selectedSchedule: storeSelectedSchedule } = useScheduleStore()

  // prop의 schedule을 우선 사용 (즉시 표시), 없으면 store의 selectedSchedule 사용
  const displaySchedule = schedule || storeSelectedSchedule || null

  if (!displaySchedule) return null

  const { getByIdSync } = useProgramService()
  const { getByIdSync: getInstructorByIdSync } = useInstructorService()
  const program = getByIdSync(displaySchedule.programId)
  const instructor = displaySchedule.instructorId
    ? getInstructorByIdSync(displaySchedule.instructorId)
    : null

  // 액션 버튼 구성
  const actions = [
    {
      key: 'edit',
      label: '수정',
      onClick: onEdit,
      icon: <EditOutlined />,
    },
    {
      key: 'delete',
      label: '삭제',
      onClick: onDelete,
      danger: true,
      icon: <DeleteOutlined />,
      loading,
    },
  ]

  return (
    <BaseDetailDrawer
      open={open}
      onClose={onClose}
      title={
        <Space>
          <Tag color="lime">{displaySchedule.title}</Tag>
          {isConflict && <Badge status="error" text="중복 일정" />}
        </Space>
      }
      width={LAYOUT_CONSTANTS.widths.modal.large}
      loading={loading}
      actions={actions}
    >
      {isConflict && (
        <Alert
          message="일정 중복"
          description="이 일정은 동일 강사의 다른 일정과 시간이 겹칩니다."
          type="warning"
          showIcon
          style={{ marginBottom: LAYOUT_CONSTANTS.margins.lg }}
        />
      )}

      <Descriptions column={1} bordered>
        <Descriptions.Item label="프로그램">
          <Tag color={domainColorsHex.program.primary}>{program?.title || '-'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="일정 제목">{displaySchedule.title}</Descriptions.Item>
        <Descriptions.Item label="날짜">
          {typeof displaySchedule.date === 'string'
            ? new Date(displaySchedule.date).toLocaleDateString('ko-KR')
            : displaySchedule.date.toLocaleDateString('ko-KR')}
        </Descriptions.Item>
        <Descriptions.Item label="시간">
          {displaySchedule.startTime} - {displaySchedule.endTime}
        </Descriptions.Item>
        {displaySchedule.location && (
          <Descriptions.Item label="장소">{displaySchedule.location}</Descriptions.Item>
        )}
        {displaySchedule.onlineLink && (
          <Descriptions.Item label="온라인 링크">
            <a href={displaySchedule.onlineLink} target="_blank" rel="noopener noreferrer">
              {displaySchedule.onlineLink}
            </a>
          </Descriptions.Item>
        )}
        {instructor && (
          <Descriptions.Item label="강사">
            <Tag color={domainColorsHex.instructor.primary}>{instructor.name}</Tag> (
            {instructor.region})
          </Descriptions.Item>
        )}
        <Descriptions.Item label="등록일">
          {typeof displaySchedule.createdAt === 'string'
            ? new Date(displaySchedule.createdAt).toLocaleDateString('ko-KR')
            : displaySchedule.createdAt.toLocaleDateString('ko-KR')}
        </Descriptions.Item>
        <Descriptions.Item label="수정일">
          {typeof displaySchedule.updatedAt === 'string'
            ? new Date(displaySchedule.updatedAt).toLocaleDateString('ko-KR')
            : displaySchedule.updatedAt.toLocaleDateString('ko-KR')}
        </Descriptions.Item>
      </Descriptions>
    </BaseDetailDrawer>
  )
}
