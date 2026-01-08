/**
 * 프로그램 상태 전환 워크플로우 컴포넌트
 * Phase 4: 프로그램 상태 전환 워크플로우 UI
 */

import { Card, Space, Typography, Timeline, Tag, Button } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import {
  getProgramLifecycleLabel,
  getProgramLifecycleColor,
  programLifecycleStatusConfig,
} from '@/shared/constants/status'
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
}

export function ProgramLifecycleWorkflow({
  program,
  onStatusChange,
  onRollback,
  loading,
}: ProgramLifecycleWorkflowProps) {
  const currentStatus = program.lifecycleStatus || 'planned'
  const currentStepIndex = programLifecycleStatusConfig.order.findIndex(
    status => status === currentStatus
  )

  const nextStatus = getNextProgramLifecycleStatus(currentStatus)
  const previousStatus = getPreviousProgramLifecycleStatus(currentStatus)

  const canGoNext = nextStatus !== null && canTransitionProgramLifecycleStatus(currentStatus, nextStatus)
  const canGoPrevious = previousStatus !== null && canTransitionProgramLifecycleStatus(currentStatus, previousStatus)

  return (
    <Card title="프로그램 상태 워크플로우">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 현재 상태 표시 */}
        <div>
          <Text strong>현재 상태: </Text>
          <Tag color={getProgramLifecycleColor(currentStatus)}>
            {getProgramLifecycleLabel(currentStatus)}
          </Tag>
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
              onClick={() => onStatusChange(nextStatus)}
              loading={loading}
            >
              다음 단계로 ({getProgramLifecycleLabel(nextStatus)})
            </Button>
          )}
          {canGoPrevious && previousStatus && (
            <Button
              onClick={() => {
                if (onRollback && previousStatus) {
                  onRollback()
                } else if (previousStatus) {
                  onStatusChange(previousStatus)
                }
              }}
              loading={loading}
            >
              이전 단계로 ({getProgramLifecycleLabel(previousStatus)})
            </Button>
          )}
        </Space>
      </Space>
    </Card>
  )
}

