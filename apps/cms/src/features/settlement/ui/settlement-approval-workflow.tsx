/**
 * 정산 승인 워크플로우 컴포넌트
 * V3 Phase 4: 정산 승인 워크플로우 UI
 */

import { Card, Space, Typography, Timeline, Tag, Button, Popconfirm } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import type { Settlement } from '@/types/domain'
import {
  getSettlementStatusLabel,
  getSettlementStatusColor,
} from '@/shared/constants/status'
import dayjs from 'dayjs'

const { Text } = Typography

interface SettlementApprovalWorkflowProps {
  settlement: Settlement
  onApprove?: () => void
  onReject?: () => void
  onReview?: () => void
  loading?: boolean
}

// 승인 단계 정의
const approvalSteps = [
  { key: 'pending', label: '대기', description: '정산 등록 대기' },
  { key: 'calculated', label: '산출 완료', description: '정산 금액 산출 완료' },
  { key: 'review', label: '검토', description: '담당자 검토 중' },
  { key: 'approved', label: '승인', description: '최종 승인 완료' },
  { key: 'paid', label: '지급 완료', description: '지급 완료' },
] as const

export function SettlementApprovalWorkflow({
  settlement,
  onApprove,
  onReject,
  onReview,
  loading,
}: SettlementApprovalWorkflowProps) {
  // 현재 상태에 따른 단계 인덱스
  const getCurrentStepIndex = () => {
    switch (settlement.status) {
      case 'pending':
        return 0
      case 'calculated':
        return 1
      case 'approved':
        return 3
      case 'paid':
        return 4
      case 'cancelled':
        return -1
      default:
        return 0
    }
  }

  const currentStepIndex = getCurrentStepIndex()
  const isCancelled = settlement.status === 'cancelled'

  // 승인 이력이 있으면 이력 기반으로 표시
  const hasHistory = settlement.approvalHistories && settlement.approvalHistories.length > 0

  return (
    <Card title="승인 워크플로우">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 현재 상태 표시 */}
        <div>
          <Text strong>현재 상태: </Text>
          <Tag color={getSettlementStatusColor(settlement.status)}>{getSettlementStatusLabel(settlement.status)}</Tag>
        </div>

        {/* 승인 단계 Timeline */}
        <Timeline
          items={approvalSteps.map((step, index) => {
            const isCompleted = index <= currentStepIndex && !isCancelled
            const isCurrent = index === currentStepIndex && !isCancelled

            let status: 'wait' | 'process' | 'finish' | 'error' = 'wait'
            let icon = <ClockCircleOutlined />

            if (isCancelled && index === currentStepIndex) {
              status = 'error'
              icon = <CloseCircleOutlined />
            } else if (isCompleted) {
              status = 'finish'
              icon = <CheckCircleOutlined />
            } else if (isCurrent) {
              status = 'process'
            }

            // 승인 이력이 있으면 이력 정보 표시
            const historyItem = hasHistory
              ? settlement.approvalHistories?.find(h => {
                  const stepMap: Record<string, string> = {
                    pending: 'pending',
                    calculated: 'calculated',
                    review: 'review',
                    approved: 'approved',
                    paid: 'paid',
                  }
                  return h.step === stepMap[step.key]
                })
              : null

            return {
              color: status === 'error' ? 'red' : status === 'finish' ? 'green' : status === 'process' ? 'blue' : 'gray',
              dot: icon,
              children: (
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div>
                    <Text strong={isCurrent || isCompleted}>{step.label}</Text>
                    {isCurrent && <Tag color="processing" style={{ marginLeft: 8 }}>진행 중</Tag>}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {step.description}
                  </Text>
                  {historyItem && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {historyItem.reviewerName && `${historyItem.reviewerName} · `}
                        {dayjs(historyItem.createdAt).format('YYYY-MM-DD HH:mm')}
                      </Text>
                      {historyItem.comment && (
                        <div style={{ marginTop: 4, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                          <Text style={{ fontSize: 12 }}>{historyItem.comment}</Text>
                        </div>
                      )}
                    </div>
                  )}
                </Space>
              ),
            }
          })}
        />

        {/* 액션 버튼 (조건부) */}
        {!isCancelled && (
          <Space>
            {settlement.status === 'calculated' && (
              <>
                {onReview && (
                  <Button type="default" onClick={onReview} loading={loading}>
                    검토하기
                  </Button>
                )}
                {onApprove && (
                  <Popconfirm
                    title="정산 승인"
                    description="이 정산을 승인하시겠습니까?"
                    onConfirm={onApprove}
                    okText="승인"
                    cancelText="취소"
                  >
                    <Button type="primary" loading={loading}>
                      승인하기
                    </Button>
                  </Popconfirm>
                )}
                {onReject && (
                  <Popconfirm
                    title="정산 반려"
                    description="이 정산을 반려하시겠습니까?"
                    onConfirm={onReject}
                    okText="반려"
                    cancelText="취소"
                    okButtonProps={{ danger: true }}
                  >
                    <Button danger loading={loading}>
                      반려하기
                    </Button>
                  </Popconfirm>
                )}
              </>
            )}
            {settlement.status === 'approved' && onApprove && (
              <Popconfirm
                title="지급 완료 처리"
                description="이 정산의 지급이 완료되었습니까?"
                onConfirm={onApprove}
                okText="완료"
                cancelText="취소"
              >
                <Button type="primary" loading={loading}>
                  지급 완료 처리
                </Button>
              </Popconfirm>
            )}
          </Space>
        )}
      </Space>
    </Card>
  )
}

