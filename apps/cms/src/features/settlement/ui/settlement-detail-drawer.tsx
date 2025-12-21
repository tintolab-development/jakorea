/**
 * 정산 상세 Drawer 컴포넌트
 * Phase 4: 사이드 패널로 상세 정보 표시
 */

import { Drawer, Descriptions, Tag, Space, Button, Badge, Typography, Divider, Table } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { Settlement } from '@/types/domain'
import { mockProgramsMap, mockInstructorsMap, mockMatchingsMap } from '@/data/mock'

const { Text, Title } = Typography

interface SettlementDetailDrawerProps {
  open: boolean
  settlement: Settlement | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: Settlement['status']) => void
  loading?: boolean
}

const statusLabels: Record<string, string> = {
  pending: '대기',
  calculated: '산출 완료',
  approved: '승인',
  paid: '지급 완료',
  cancelled: '취소',
}

const statusColors: Record<string, string> = {
  pending: 'default',
  calculated: 'processing',
  approved: 'success',
  paid: 'success',
  cancelled: 'error',
}

const itemTypeLabels: Record<string, string> = {
  instructor_fee: '강사비',
  transportation: '교통비',
  accommodation: '숙박비',
  other: '기타',
}

export function SettlementDetailDrawer({
  open,
  settlement,
  onClose,
  onEdit,
  onDelete,
  onStatusChange: _onStatusChange, // eslint-disable-line @typescript-eslint/no-unused-vars
  loading,
}: SettlementDetailDrawerProps) {
  if (!settlement) return null

  const program = mockProgramsMap.get(settlement.programId)
  const instructor = mockInstructorsMap.get(settlement.instructorId)
  const matching = mockMatchingsMap.get(settlement.matchingId)

  const itemColumns = [
    {
      title: '항목',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => itemTypeLabels[type] || type,
    },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '금액',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `${amount.toLocaleString('ko-KR')}원`,
    },
  ]

  return (
    <Drawer
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>
            정산 상세
          </Title>
          <Badge status={statusColors[settlement.status] as any} text={statusLabels[settlement.status]} />
        </Space>
      }
      placement="right"
      width={600}
      onClose={onClose}
      open={open}
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
      <Descriptions column={1} bordered>
        <Descriptions.Item label="기간">
          <Tag color="blue">{settlement.period}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="프로그램">
          {program ? <Tag color="cyan">{program.title}</Tag> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="강사">{instructor ? instructor.name : '-'}</Descriptions.Item>
        <Descriptions.Item label="매칭">
          {matching ? `매칭 #${matching.id.slice(-6)}` : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="상태">
          <Badge status={statusColors[settlement.status] as any} text={statusLabels[settlement.status]} />
        </Descriptions.Item>
        {settlement.documentGeneratedAt && (
          <Descriptions.Item label="문서 생성일">
            {new Date(settlement.documentGeneratedAt).toLocaleString('ko-KR')}
          </Descriptions.Item>
        )}
        {settlement.notes && <Descriptions.Item label="비고">{settlement.notes}</Descriptions.Item>}
        <Descriptions.Item label="등록일">
          {new Date(settlement.createdAt).toLocaleString('ko-KR')}
        </Descriptions.Item>
        <Descriptions.Item label="수정일">
          {new Date(settlement.updatedAt).toLocaleString('ko-KR')}
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <Title level={5}>정산 항목</Title>
      <Table
        dataSource={settlement.items}
        columns={itemColumns}
        rowKey={(record, index) => `${record.type}-${index}`}
        pagination={false}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2}>
                <Text strong>총액</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                <Text strong>{settlement.totalAmount.toLocaleString('ko-KR')}원</Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </Drawer>
  )
}

