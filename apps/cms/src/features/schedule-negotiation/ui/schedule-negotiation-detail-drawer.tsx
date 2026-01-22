/**
 * 일정 협의 상세 Drawer 컴포넌트
 * V3 Phase 8: 일정 협의 관리
 */

import { Drawer, Descriptions, Tag, Space, Button, Timeline, Alert, Typography, Divider } from 'antd'
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import type { ScheduleNegotiation, ScheduleNegotiationProposal } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import { schoolService } from '@/entities/school/api/school-service'
import { domainColorsHex } from '@/shared/constants/colors'
import dayjs from 'dayjs'

const { Text, Title } = Typography

interface ScheduleNegotiationDetailDrawerProps {
  open: boolean
  negotiation: ScheduleNegotiation | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onAccept?: () => void
  onReject?: () => void
  loading?: boolean
}

const statusColor: Record<ScheduleNegotiation['status'], string> = {
  proposed: 'blue',
  accepted: 'green',
  rejected: 'red',
  revised: 'orange',
}

const statusLabel: Record<ScheduleNegotiation['status'], string> = {
  proposed: '제안',
  accepted: '합의',
  rejected: '거절',
  revised: '재제안',
}

const proposalStatusColor: Record<ScheduleNegotiationProposal['status'], string> = {
  pending: 'default',
  accepted: 'green',
  rejected: 'red',
}

const proposalStatusLabel: Record<ScheduleNegotiationProposal['status'], string> = {
  pending: '대기',
  accepted: '승인',
  rejected: '거절',
}

export function ScheduleNegotiationDetailDrawer({
  open,
  negotiation,
  onClose,
  onEdit,
  onDelete,
  onAccept,
  onReject,
  loading,
}: ScheduleNegotiationDetailDrawerProps) {
  if (!negotiation) return null

  const program = programService.getByIdSync(negotiation.programId)
  const school = schoolService.getByIdSync(negotiation.schoolId)

  const timelineItems = negotiation.proposals.map((proposal, index) => {
    const date = dayjs(proposal.date)
    const timeRange =
      proposal.startTime && proposal.endTime
        ? `${proposal.startTime} ~ ${proposal.endTime}`
        : proposal.startTime
          ? `${proposal.startTime}부터`
          : '시간 미정'

    return {
      color: proposalStatusColor[proposal.status],
      children: (
        <div>
          <Space>
            <Text strong>제안 {index + 1}</Text>
            <Tag color={proposalStatusColor[proposal.status]}>
              {proposalStatusLabel[proposal.status]}
            </Tag>
          </Space>
          <br />
          <Text type="secondary">
            {date.format('YYYY-MM-DD')} {timeRange}
          </Text>
          {proposal.note && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {proposal.note}
              </Text>
            </>
          )}
        </div>
      ),
    }
  })

  const hasAcceptedProposal = negotiation.proposals.some(p => p.status === 'accepted')
  const canAccept = negotiation.status === 'proposed' && !hasAcceptedProposal
  const canReject = negotiation.status === 'proposed' || negotiation.status === 'revised'

  return (
    <Drawer
      title="일정 협의 상세"
      placement="right"
      width={720}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          {canAccept && onAccept && (
            <Button type="primary" icon={<CheckOutlined />} onClick={onAccept}>
              합의
            </Button>
          )}
          {canReject && onReject && (
            <Button danger icon={<CloseOutlined />} onClick={onReject}>
              거절
            </Button>
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
        <Descriptions.Item label="프로그램">
          <Tag color={domainColorsHex.program.primary}>{program?.title || '-'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="학교">
          <Text strong>{school?.name || '-'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="협의 상태">
          <Tag color={statusColor[negotiation.status]}>{statusLabel[negotiation.status]}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="제안 수">
          <Text>{negotiation.proposals.length}개</Text>
        </Descriptions.Item>
        <Descriptions.Item label="등록일">
          {dayjs(negotiation.createdAt).format('YYYY-MM-DD HH:mm')}
        </Descriptions.Item>
        <Descriptions.Item label="수정일">
          {dayjs(negotiation.updatedAt).format('YYYY-MM-DD HH:mm')}
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <Title level={5}>일정 제안 목록</Title>
      {hasAcceptedProposal && (
        <Alert
          message="합의된 일정이 있습니다"
          description="하나 이상의 일정 제안이 승인되었습니다."
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Timeline items={timelineItems} />
    </Drawer>
  )
}
