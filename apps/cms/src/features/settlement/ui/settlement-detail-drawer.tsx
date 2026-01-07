/**
 * 정산 상세 Drawer 컴포넌트
 * Phase 4: 사이드 패널로 상세 정보 표시
 */

import { Drawer, Descriptions, Tag, Space, Button, Badge, Typography, Divider, Table, message } from 'antd'
import { EditOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons'
import type { Settlement } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import { instructorService } from '@/entities/instructor/api/instructor-service'
import { matchingService } from '@/entities/matching/api/matching-service'
import { generatePaymentStatement } from '@/shared/utils/settlement-document'
import { SettlementApprovalWorkflow } from './settlement-approval-workflow'
import {
  getSettlementStatusLabel,
  getSettlementStatusColor,
} from '@/shared/constants/status'
import { domainColorsHex } from '@/shared/constants/colors'
import { canTransitionSettlementStatus, getPreviousSettlementStatus } from '@/shared/lib/status-transition'

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
  onStatusChange,
  loading,
}: SettlementDetailDrawerProps) {
  if (!settlement) return null

  const program = programService.getByIdSync(settlement.programId)
  const instructor = instructorService.getByIdSync(settlement.instructorId)
  const matching = matchingService.getByIdSync(settlement.matchingId)

  const handleDownloadPaymentStatement = async () => {
    if (!program || !instructor) {
      message.error('프로그램 또는 강사 정보를 찾을 수 없습니다')
      return
    }

    try {
      await generatePaymentStatement(settlement, instructor, program.title)
      message.success('지급조서가 다운로드되었습니다')
    } catch (error) {
      console.error('Failed to generate payment statement:', error)
      message.error('지급조서 생성 중 오류가 발생했습니다')
    }
  }

  const canDownload = settlement.status === 'approved' || settlement.status === 'paid' // isSettlementFinalStatus로 체크 가능하지만, 다운로드는 paid도 포함해야 함

  const changeStatus = async (nextStatus: Settlement['status']) => {
    if (!canTransitionSettlementStatus(settlement.status, nextStatus)) {
      message.warning('현재 상태에서는 해당 단계로 전환할 수 없습니다.')
      return
    }
    try {
      await onStatusChange(nextStatus)
    } catch {
      // 상위에서 에러 처리
    }
  }

  const rollbackStatus = async () => {
    const previous = getPreviousSettlementStatus(settlement.status)
    if (!previous) {
      message.warning('이전 단계로 되돌릴 수 없는 상태입니다.')
      return
    }
    await changeStatus(previous)
  }

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
          <Badge status={getSettlementStatusColor(settlement.status) as any} text={getSettlementStatusLabel(settlement.status)} />
        </Space>
      }
      placement="right"
      width={600}
      onClose={onClose}
      open={open}
      extra={
        <Space>
          {canDownload && (
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPaymentStatement}>
              지급조서 다운로드
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
        <Descriptions.Item label="기간">
          <Tag color="geekblue">{settlement.period}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="프로그램">
          {program ? (
            <Tag color={domainColorsHex.program.primary}>{program.title}</Tag>
          ) : (
            <Tag color="error">프로그램 정보 오류 (ID: {settlement.programId.slice(-8)})</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="강사">{instructor ? instructor.name : '-'}</Descriptions.Item>
        <Descriptions.Item label="매칭">
          {matching ? `매칭 #${matching.id.slice(-6)}` : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="상태">
          <Badge status={getSettlementStatusColor(settlement.status) as any} text={getSettlementStatusLabel(settlement.status)} />
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

      {/* 승인 워크플로우 */}
      <SettlementApprovalWorkflow
        settlement={settlement}
        onCalculate={() => {
          if (settlement.status === 'pending') {
            void changeStatus('calculated')
          } else {
            message.warning('현재 상태에서는 산출 완료 처리를 할 수 없습니다.')
          }
        }}
        onApprove={() => {
          // 상태에 따라 승인/지급 완료 처리 분기
          if (settlement.status === 'review') {
            // 검토 -> 승인
            void changeStatus('approved')
          } else if (settlement.status === 'approved') {
            // 승인 -> 지급 완료
            void changeStatus('paid')
          }
        }}
        onReject={() => {
          // 산출 완료/검토 단계에서만 반려(취소) 허용
          if (settlement.status === 'calculated' || settlement.status === 'review') {
            void changeStatus('cancelled')
          } else {
            message.warning('현재 상태에서는 반려할 수 없습니다.')
          }
        }}
        onReview={() => {
          // 산출 완료 -> 검토 (정방향 진행만 담당)
          if (settlement.status === 'calculated') {
            void changeStatus('review')
          } else {
            message.warning('검토 단계 진입은 산출 완료 상태에서만 가능합니다.')
          }
        }}
        onRollback={() => {
          void rollbackStatus()
        }}
        loading={loading}
      />

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

