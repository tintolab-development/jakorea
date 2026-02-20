/**
 * 프로그램 상태 전환 워크플로우 컴포넌트
 * Phase 4: 프로그램 상태 전환 워크플로우 UI
 */

import { Card, Space, Typography, Timeline, Button } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import { programLifecycleStatusConfig, getProgramLifecycleLabel } from '@/shared/constants/status'
import { ProgramLifecycleStatusBadge } from '@/shared/components/program-lifecycle-status-badge'
import {
  canTransitionProgramLifecycleStatus,
  getNextProgramLifecycleStatus,
  getPreviousProgramLifecycleStatus,
} from '@/shared/lib/status-transition'

const { Text } = Typography

interface ProgramLifecycleWorkflowProps {
  program: Program
  onStatusChange: (status: ProgramLifecycleStatus) => void
  onRollback?: () => void
  loading?: boolean
  canWrite?: boolean // Phase 0.5.2: 쓰기 권한이 있는 관리자인지 여부
}

export function ProgramLifecycleWorkflow({
  program,
  onStatusChange,
  onRollback,
  loading,
  canWrite = false, // 기본값은 false (권한이 없으면 변경 불가)
}: ProgramLifecycleWorkflowProps) {
  const currentStatus = program.lifecycleStatus || 'planned'
  const currentStepIndex = programLifecycleStatusConfig.order.findIndex(
    status => status === currentStatus
  )

  const nextStatus = getNextProgramLifecycleStatus(currentStatus)
  const previousStatus = getPreviousProgramLifecycleStatus(currentStatus)

  const canGoNext =
    canWrite &&
    nextStatus !== null &&
    canTransitionProgramLifecycleStatus(currentStatus, nextStatus)
  const canGoPrevious =
    canWrite &&
    previousStatus !== null &&
    canTransitionProgramLifecycleStatus(currentStatus, previousStatus)

  // 디버깅: 상태 전환 가능 여부 확인
  if (process.env.NODE_ENV === 'development') {
    console.log('[ProgramLifecycleWorkflow] 상태 전환 가능 여부:', {
      currentStatus,
      nextStatus,
      previousStatus,
      canGoNext,
      canGoPrevious,
      hasOnStatusChange: !!onStatusChange,
      hasOnRollback: !!onRollback,
      loading,
    })
  }

  return (
    <Card title="프로그램 상태 워크플로우">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 현재 상태 표시 */}
        <div>
          <Text strong>현재 상태: </Text>
          <ProgramLifecycleStatusBadge status={currentStatus} />
        </div>

        {/* 상태 단계 Timeline */}
        <Timeline
          items={programLifecycleStatusConfig.order.map((status, index) => {
            const isCompleted = index < currentStepIndex
            const isCurrent = index === currentStepIndex

            let icon = <ClockCircleOutlined />

            if (isCompleted) {
              icon = <CheckCircleOutlined />
            }

            return {
              color: isCurrent ? '#1890ff' : isCompleted ? '#52c41a' : '#d9d9d9',
              dot: icon,
              children: (
                <Space direction="vertical" size={4}>
                  <Text strong={isCurrent}>{getProgramLifecycleLabel(status)}</Text>
                  {isCurrent && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      현재 상태
                    </Text>
                  )}
                </Space>
              ),
            }
          })}
        />

        {/* 상태 전환 버튼 */}
        <Space>
          {canGoNext && nextStatus && (
            <Button
              type="primary"
              onClick={() => {
                console.log('[ProgramLifecycleWorkflow] 다음 단계 클릭:', {
                  currentStatus,
                  nextStatus,
                  hasOnStatusChange: !!onStatusChange,
                })
                if (onStatusChange) {
                  onStatusChange(nextStatus)
                } else {
                  console.error('[ProgramLifecycleWorkflow] onStatusChange 핸들러가 없습니다!')
                }
              }}
              loading={loading}
              disabled={!canWrite || !onStatusChange}
            >
              다음 단계로 ({getProgramLifecycleLabel(nextStatus)})
            </Button>
          )}
          {canGoPrevious && previousStatus && (
            <Button
              onClick={() => {
                console.log('[ProgramLifecycleWorkflow] 이전 단계 클릭:', {
                  currentStatus,
                  previousStatus,
                  hasOnRollback: !!onRollback,
                  hasOnStatusChange: !!onStatusChange,
                })
                if (onRollback && previousStatus) {
                  onRollback()
                } else if (previousStatus && onStatusChange) {
                  onStatusChange(previousStatus)
                } else {
                  console.error('[ProgramLifecycleWorkflow] 상태 변경 핸들러가 없습니다!')
                }
              }}
              loading={loading}
              disabled={!canWrite || (!onStatusChange && !onRollback)}
            >
              이전 단계로 ({getProgramLifecycleLabel(previousStatus)})
            </Button>
          )}
        </Space>
      </Space>
    </Card>
  )
}
