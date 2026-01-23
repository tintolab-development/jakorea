/**
 * 매칭 상세 Drawer 컴포넌트
 * Phase 3.2: 매칭 상세 정보 및 이력 표시
 */

import { Descriptions, Tag, Timeline, Space, Alert, Badge } from 'antd'
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import type { Matching } from '@/types/domain'
import { useProgramService } from '@/features/program/hooks/use-program-service'
import { instructorService } from '@/entities/instructor/api/instructor-service'
import { scheduleService } from '@/entities/schedule/api/schedule-service'
import { getCommonStatusLabel, getCommonStatusColor } from '@/shared/constants/status'
import { getMatchingActionLabel } from '@/shared/constants/domain-status'
import { domainColorsHex } from '@/shared/constants/colors'
import { LAYOUT_CONSTANTS } from '@/shared/constants'
import { useMatchingStore } from '@/features/matching/model/matching-store'
import { BaseDetailDrawer } from '@/shared/ui/base-detail-drawer'
import dayjs from 'dayjs'

interface MatchingDetailDrawerProps {
  open: boolean
  matching?: Matching | null // optional로 변경하여 store의 selectedMatching 우선 사용
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function MatchingDetailDrawer({
  open,
  matching,
  onClose,
  onEdit,
  onDelete,
  onConfirm,
  onCancel,
  loading,
}: MatchingDetailDrawerProps) {
  const { selectedMatching: storeSelectedMatching } = useMatchingStore()

  // prop의 matching을 우선 사용 (즉시 표시), 없으면 store의 selectedMatching 사용
  const displayMatching = matching || storeSelectedMatching || null

  if (!displayMatching) return null

  const { getByIdSync } = useProgramService()
  const program = displayMatching ? getByIdSync(displayMatching.programId) : null
  const instructor = displayMatching
    ? instructorService.getByIdSync(displayMatching.instructorId)
    : null
  const schedule = displayMatching?.scheduleId
    ? scheduleService.getByIdSync(displayMatching.scheduleId)
    : null

  // 액션 버튼 구성
  const actions = [
    ...(displayMatching.status === 'pending'
      ? [
          {
            key: 'confirm',
            label: '확정',
            onClick: onConfirm,
            icon: <CheckOutlined />,
          },
          {
            key: 'cancel',
            label: '취소',
            onClick: onCancel,
            danger: true,
            icon: <CloseOutlined />,
          },
        ]
      : []),
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
      title="매칭 상세 정보"
      width={660}
      loading={loading}
      actions={actions}
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label="상태">
          <Tag color={getCommonStatusColor(displayMatching.status)}>
            {getCommonStatusLabel(displayMatching.status)}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="프로그램">
          {program ? (
            <Space direction="vertical" size="small">
              <span style={{ fontWeight: 500 }}>{program.title}</span>
              <Tag>{program.type}</Tag>
              <Tag>{program.format}</Tag>
            </Space>
          ) : (
            '-'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="강사">
          {instructor ? (
            <Space direction="vertical" size="small">
              <span style={{ fontWeight: 500 }}>{instructor.name}</span>
              <Space>
                <Tag color={domainColorsHex.instructor.primary}>{instructor.region}</Tag>
                {instructor.specialty.map(s => (
                  <Tag key={s} color={domainColorsHex.instructor.primary}>
                    {s}
                  </Tag>
                ))}
              </Space>
              {instructor.rating && (
                <span style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm, color: '#8c8c8c' }}>
                  평점: {instructor.rating.toFixed(1)}/5.0
                </span>
              )}
            </Space>
          ) : (
            '-'
          )}
        </Descriptions.Item>
        {schedule && (
          <Descriptions.Item label="일정">
            <Space direction="vertical" size="small">
              <span style={{ fontWeight: 500 }}>{schedule.title}</span>
              <span>
                {typeof schedule.date === 'string'
                  ? schedule.date
                  : dayjs(schedule.date).format('YYYY-MM-DD')}{' '}
                {schedule.startTime} - {schedule.endTime}
              </span>
              {schedule.location && <span>장소: {schedule.location}</span>}
            </Space>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="매칭일">
          <span>{dayjs(displayMatching.matchedAt).format('YYYY-MM-DD HH:mm')}</span>
        </Descriptions.Item>
        {displayMatching.cancelledAt && (
          <>
            <Descriptions.Item label="취소일">
              <span>{dayjs(displayMatching.cancelledAt).format('YYYY-MM-DD HH:mm')}</span>
            </Descriptions.Item>
            {displayMatching.cancellationReason && (
              <Descriptions.Item label="취소 사유">
                <Alert message={displayMatching.cancellationReason} type="warning" showIcon />
              </Descriptions.Item>
            )}
          </>
        )}
      </Descriptions>

      {displayMatching.history && displayMatching.history.length > 0 && (
        <div style={{ marginTop: LAYOUT_CONSTANTS.margins.xl }}>
          <h3>변경 이력</h3>
          <Timeline
            items={displayMatching.history.map(history => ({
              key: history.id,
              color: history.action === 'cancelled' ? 'red' : 'blue',
              children: (
                <Space direction="vertical" size="small">
                  <Space>
                    <Badge status={history.action === 'cancelled' ? 'error' : 'processing'} />
                    <strong>{getMatchingActionLabel(history.action)}</strong>
                  </Space>
                  {history.previousValue && history.newValue && (
                    <span style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm, color: '#8c8c8c' }}>
                      {history.previousValue} → {history.newValue}
                    </span>
                  )}
                  <span style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm, color: '#8c8c8c' }}>
                    {dayjs(history.changedAt as string | Date).format('YYYY-MM-DD HH:mm')}
                  </span>
                  {history.changedBy && (
                    <span style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm, color: '#8c8c8c' }}>
                      변경자: {history.changedBy}
                    </span>
                  )}
                </Space>
              ),
            }))}
          />
        </div>
      )}
    </BaseDetailDrawer>
  )
}
