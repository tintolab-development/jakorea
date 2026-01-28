/**
 * 신청 워크플로우 컴포넌트
 * 신청 상태 전환 및 워크플로우 관리 UI
 */

import { Card, Space, Typography, Timeline, Tag, Button, Popconfirm, Modal, Input } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  RollbackOutlined,
} from '@ant-design/icons'
import { useState } from 'react'
import type { Application } from '@/types/domain'
import {
  applicationStatusStatusConfig,
  getApplicationStatusLabel,
} from '@/shared/constants/status'
import { StatusBadge } from '@/shared/ui/status-badge'
import {
  canTransitionApplicationStatus,
  getPreviousApplicationStatus,
} from '@/shared/lib/status-transition'
import dayjs from 'dayjs'

const { Text } = Typography
const { TextArea } = Input

interface ApplicationWorkflowProps {
  application: Application
  onStatusChange: (status: Application['status'], rejectionReason?: string) => void
  loading?: boolean
}

// 신청 단계 정의
const applicationSteps = [
  { key: 'submitted', label: '접수', description: '신청 접수 완료' },
  { key: 'reviewing', label: '검토', description: '검토 중' },
  { key: 'approved', label: '확정', description: '신청 확정 완료' },
] as const

export function ApplicationWorkflow({
  application,
  onStatusChange,
  loading,
}: ApplicationWorkflowProps) {
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [cancelModalOpen, setCancelModalOpen] = useState(false)

  // 현재 상태에 따른 단계 인덱스
  const getCurrentStepIndex = () => {
    switch (application.status) {
      case 'submitted':
        return 0
      case 'reviewing':
        return 1
      case 'approved':
        return 2
      case 'waiting':
        return 0.5 // 대기 상태는 중간 단계로 표시
      case 'rejected':
        return -1
      case 'cancelled':
        return -1
      default:
        return 0
    }
  }

  const currentStepIndex = getCurrentStepIndex()
  const isCancelled = application.status === 'cancelled'
  const isRejected = application.status === 'rejected'
  const isWaiting = application.status === 'waiting'
  const previousStatus = getPreviousApplicationStatus(application.status)
  const canRollback = previousStatus !== null

  const handleRejectClick = () => {
    setRejectionReason('')
    setRejectModalOpen(true)
  }

  const handleRejectConfirm = () => {
    onStatusChange('rejected', rejectionReason)
    setRejectModalOpen(false)
    setRejectionReason('')
  }

  const handleRejectCancel = () => {
    setRejectModalOpen(false)
    setRejectionReason('')
  }

  const handleCancelConfirm = () => {
    onStatusChange('cancelled')
    setCancelModalOpen(false)
  }

  const handleRollback = () => {
    if (previousStatus) {
      onStatusChange(previousStatus)
    }
  }

  return (
    <>
      <Card title="신청 워크플로우">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* 현재 상태 표시 */}
          <div>
            <Text strong>현재 상태: </Text>
            <StatusBadge status={application.status} statusConfig={applicationStatusStatusConfig} />
            {isWaiting && (
              <Tag color="orange" style={{ marginLeft: 8 }}>
                대기 목록
              </Tag>
            )}
          </div>

          {/* 신청 단계 Timeline */}
          <Timeline
            items={applicationSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex && !isCancelled && !isRejected
              const isCurrent = index === currentStepIndex && !isCancelled && !isRejected

              let status: 'wait' | 'process' | 'finish' | 'error' = 'wait'
              let icon = <ClockCircleOutlined />

              if ((isCancelled || isRejected) && (index === 0 || index === 1)) {
                status = 'error'
                icon = <CloseCircleOutlined />
              } else if (isCompleted) {
                status = 'finish'
                icon = <CheckCircleOutlined />
              } else if (isCurrent) {
                status = 'process'
              }

              // 대기 상태는 submitted 단계 옆에 표시
              const showWaiting = isWaiting && index === 0

              return {
                color:
                  status === 'error'
                    ? 'red'
                    : status === 'finish'
                      ? 'green'
                      : status === 'process'
                        ? 'blue'
                        : 'gray',
                dot: icon,
                children: (
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div>
                      <Text strong={isCurrent || isCompleted}>{step.label}</Text>
                      {isCurrent && (
                        <Tag color="processing" style={{ marginLeft: 8 }}>
                          진행 중
                        </Tag>
                      )}
                      {showWaiting && (
                        <Tag color="orange" style={{ marginLeft: 8 }}>
                          대기 목록
                        </Tag>
                      )}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {step.description}
                    </Text>
                    {/* 상태 변경 이력 표시 */}
                    {step.key === 'submitted' && application.submittedAt && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(application.submittedAt).format('YYYY-MM-DD HH:mm')}
                      </Text>
                    )}
                    {step.key === 'reviewing' && application.reviewedAt && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(application.reviewedAt).format('YYYY-MM-DD HH:mm')}
                      </Text>
                    )}
                    {step.key === 'approved' && application.reviewedAt && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(application.reviewedAt).format('YYYY-MM-DD HH:mm')}
                      </Text>
                    )}
                  </Space>
                ),
              }
            })}
          />

          {/* 액션 버튼 */}
          <Space wrap>
          {/* 검토 시작 버튼: submitted 상태에서만 */}
          {application.status === 'submitted' && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => onStatusChange('reviewing')}
              loading={loading}
            >
              검토 시작
            </Button>
          )}

            {/* 대기 목록으로 이동 버튼: submitted 또는 reviewing 상태에서 */}
            {canTransitionApplicationStatus(application.status, 'waiting') && (
              <Popconfirm
                title="대기 목록으로 이동"
                description="이 신청을 대기 목록으로 이동하시겠습니까?"
                onConfirm={() => onStatusChange('waiting')}
                okText="이동"
                cancelText="취소"
              >
                <Button icon={<ClockCircleOutlined />} loading={loading}>
                  대기 목록으로
                </Button>
              </Popconfirm>
            )}

            {/* 확정 버튼: reviewing 또는 waiting 상태에서 */}
            {canTransitionApplicationStatus(application.status, 'approved') && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => onStatusChange('approved')}
                loading={loading}
              >
                확정
              </Button>
            )}

            {/* 거절 버튼: reviewing 또는 waiting 상태에서 */}
            {canTransitionApplicationStatus(application.status, 'rejected') && (
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={handleRejectClick}
                loading={loading}
              >
                거절
              </Button>
            )}

            {/* 취소 버튼: submitted, reviewing, waiting 상태에서 */}
            {canTransitionApplicationStatus(application.status, 'cancelled') && (
              <Popconfirm
                title="신청 취소"
                description="이 신청을 취소하시겠습니까? 취소된 신청은 복구할 수 없습니다."
                onConfirm={handleCancelConfirm}
                okText="취소하기"
                cancelText="아니오"
                okButtonProps={{ danger: true }}
              >
                <Button icon={<StopOutlined />} loading={loading}>
                  취소
                </Button>
              </Popconfirm>
            )}

            {/* 이전 상태로 되돌리기 버튼: 초기 상태가 아닌 경우 */}
            {canRollback && (
              <Popconfirm
                title="이전 상태로 되돌리기"
                description={`이 신청을 "${getApplicationStatusLabel(previousStatus!)}" 상태로 되돌리시겠습니까?`}
                onConfirm={handleRollback}
                okText="되돌리기"
                cancelText="취소"
              >
                <Button icon={<RollbackOutlined />} loading={loading}>
                  이전 상태로
                </Button>
              </Popconfirm>
            )}
          </Space>
        </Space>
      </Card>

      {/* 거절 모달 */}
      <Modal
        title="신청 거절"
        open={rejectModalOpen}
        onOk={handleRejectConfirm}
        onCancel={handleRejectCancel}
        okText="거절하기"
        cancelText="취소"
        okButtonProps={{ danger: true }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Text>이 신청을 거절하시겠습니까?</Text>
          <Text type="secondary">거절 사유를 입력해주세요 (선택사항)</Text>
          <TextArea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="거절 사유를 입력해주세요"
            rows={4}
            maxLength={500}
            showCount
          />
        </Space>
      </Modal>

      {/* 취소 모달 */}
      <Modal
        title="신청 취소"
        open={cancelModalOpen}
        onOk={handleCancelConfirm}
        onCancel={() => setCancelModalOpen(false)}
        okText="취소하기"
        cancelText="아니오"
        okButtonProps={{ danger: true }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Text>이 신청을 취소하시겠습니까?</Text>
          <Text type="secondary">취소된 신청은 복구할 수 없으며, 최종 상태로 처리됩니다.</Text>
        </Space>
      </Modal>
    </>
  )
}

