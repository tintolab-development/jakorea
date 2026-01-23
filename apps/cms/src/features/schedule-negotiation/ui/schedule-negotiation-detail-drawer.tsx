/**
 * 일정 협의 상세 Drawer 컴포넌트
 * V3 Phase 8: 일정 협의 관리
 */

import {
  Descriptions,
  Tag,
  Space,
  Timeline,
  Alert,
  Typography,
  Divider,
} from 'antd'
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import type { ScheduleNegotiation, ScheduleNegotiationProposal } from '@/types/domain'
import { useProgramService } from '@/features/program/hooks/use-program-service'
import { schoolService } from '@/entities/school/api/school-service'
import { domainColorsHex } from '@/shared/constants/colors'
import { LAYOUT_CONSTANTS } from '@/shared/constants'
import { useScheduleNegotiationStore } from '@/features/schedule-negotiation/model/schedule-negotiation-store'
import { BaseDetailDrawer } from '@/shared/ui/base-detail-drawer'
import dayjs from 'dayjs'

const { Text, Title } = Typography

interface ScheduleNegotiationDetailDrawerProps {
  open: boolean
  negotiation?: ScheduleNegotiation | null // optional로 변경하여 store의 selectedNegotiation 우선 사용
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
  const { selectedNegotiation: storeSelectedNegotiation } = useScheduleNegotiationStore()

  // prop의 negotiation을 우선 사용 (즉시 표시), 없으면 store의 selectedNegotiation 사용
  const displayNegotiation = negotiation || storeSelectedNegotiation || null

  if (!displayNegotiation) return null

  const { getByIdSync } = useProgramService()
  const program = getByIdSync(displayNegotiation.programId)
  const school = schoolService.getByIdSync(displayNegotiation.schoolId)

  const timelineItems = displayNegotiation.proposals.map((proposal, index) => {
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
              <Text type="secondary" style={{ fontSize: LAYOUT_CONSTANTS.fontSizes.sm }}>
                {proposal.note}
              </Text>
            </>
          )}
        </div>
      ),
    }
  })

  const hasAcceptedProposal = displayNegotiation.proposals.some(p => p.status === 'accepted')
  const canAccept = displayNegotiation.status === 'proposed' && !hasAcceptedProposal
  const canReject =
    displayNegotiation.status === 'proposed' || displayNegotiation.status === 'revised'

  // 액션 버튼 구성
  const actions = [
    ...(canAccept && onAccept
      ? [
          {
            key: 'accept',
            label: '합의',
            onClick: onAccept,
            icon: <CheckOutlined />,
          },
        ]
      : []),
    ...(canReject && onReject
      ? [
          {
            key: 'reject',
            label: '거절',
            onClick: onReject,
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
      title="일정 협의 상세"
      width={LAYOUT_CONSTANTS.widths.modal.medium}
      loading={loading}
      actions={actions}
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label="프로그램">
          <Tag color={domainColorsHex.program.primary}>{program?.title || '-'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="학교">
          <Text strong>{school?.name || '-'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="협의 상태">
          <Tag color={statusColor[displayNegotiation.status]}>
            {statusLabel[displayNegotiation.status]}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="제안 수">
          <Text>{displayNegotiation.proposals.length}개</Text>
        </Descriptions.Item>
        <Descriptions.Item label="등록일">
          {dayjs(displayNegotiation.createdAt).format('YYYY-MM-DD HH:mm')}
        </Descriptions.Item>
        <Descriptions.Item label="수정일">
          {dayjs(displayNegotiation.updatedAt).format('YYYY-MM-DD HH:mm')}
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
          style={{ marginBottom: LAYOUT_CONSTANTS.margins.lg }}
        />
      )}
      <Timeline items={timelineItems} />
    </BaseDetailDrawer>
  )
}
