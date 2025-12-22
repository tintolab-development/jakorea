/**
 * 매칭 상세 Drawer 컴포넌트
 * Phase 3.2: 매칭 상세 정보 및 이력 표시
 */

import { Drawer, Descriptions, Tag, Timeline, Space, Button, Alert, Badge } from 'antd'
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import type { Matching } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import { instructorService } from '@/entities/instructor/api/instructor-service'
import { scheduleService } from '@/entities/schedule/api/schedule-service'
import {
  getCommonStatusLabel,
  getCommonStatusColor,
} from '@/shared/constants/status'
import { domainColorsHex } from '@/shared/constants/colors'
import dayjs from 'dayjs'

interface MatchingDetailDrawerProps {
  open: boolean
  matching: Matching | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

const actionLabels: Record<string, string> = {
  created: '생성',
  updated: '수정',
  cancelled: '취소',
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
  if (!matching) return null

  const program = programService.getByIdSync(matching.programId)
  const instructor = instructorService.getByIdSync(matching.instructorId)
  const schedule = matching.scheduleId ? scheduleService.getByIdSync(matching.scheduleId) : null

  return (
    <Drawer
      title="매칭 상세 정보"
      placement="right"
      width={600}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          {matching.status === 'pending' && (
            <>
              <Button type="primary" icon={<CheckOutlined />} onClick={onConfirm}>
                확정
              </Button>
              <Button danger icon={<CloseOutlined />} onClick={onCancel}>
                취소
              </Button>
            </>
          )}
          <Button icon={<EditOutlined />} onClick={onEdit}>
            수정
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={onDelete} loading={loading}>
            삭제
          </Button>
        </Space>
      }
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label="상태">
          <Tag color={getCommonStatusColor(matching.status)}>
            {getCommonStatusLabel(matching.status)}
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
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>평점: {instructor.rating.toFixed(1)}/5.0</span>
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
                {typeof schedule.date === 'string' ? schedule.date : dayjs(schedule.date).format('YYYY-MM-DD')} {schedule.startTime} - {schedule.endTime}
              </span>
              {schedule.location && <span>장소: {schedule.location}</span>}
            </Space>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="매칭일">
          <span>{dayjs(matching.matchedAt).format('YYYY-MM-DD HH:mm')}</span>
        </Descriptions.Item>
        {matching.cancelledAt && (
          <>
            <Descriptions.Item label="취소일">
              <span>{dayjs(matching.cancelledAt).format('YYYY-MM-DD HH:mm')}</span>
            </Descriptions.Item>
            {matching.cancellationReason && (
              <Descriptions.Item label="취소 사유">
                <Alert message={matching.cancellationReason} type="warning" showIcon />
              </Descriptions.Item>
            )}
          </>
        )}
      </Descriptions>

      {matching.history && matching.history.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3>변경 이력</h3>
          <Timeline
            items={matching.history.map(history => ({
              key: history.id,
              color: history.action === 'cancelled' ? 'red' : 'blue',
              children: (
                <Space direction="vertical" size="small">
                  <Space>
                    <Badge status={history.action === 'cancelled' ? 'error' : 'processing'} />
                    <strong>{actionLabels[history.action] || history.action}</strong>
                  </Space>
                  {history.previousValue && history.newValue && (
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                      {history.previousValue} → {history.newValue}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                    {dayjs(history.changedAt as string | Date).format('YYYY-MM-DD HH:mm')}
                  </span>
                  {history.changedBy && (
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>변경자: {history.changedBy}</span>
                  )}
                </Space>
              ),
            }))}
          />
        </div>
      )}
    </Drawer>
  )
}

