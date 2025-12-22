/**
 * 즉시 처리 필요 작업 Alert Bar
 * Phase 1: 대시보드 고도화
 * Phase 3: 성능 최적화 (데이터 중앙화)
 */

import { Alert, Space, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { DollarOutlined, FileTextOutlined, CalendarOutlined } from '@ant-design/icons'
import { useDashboardData } from '../model/use-dashboard-data'

interface PendingActionsAlertProps {
  onNavigate?: (path: string) => void
}

export function PendingActionsAlert({ onNavigate }: PendingActionsAlertProps) {
  const navigate = useNavigate()
  const { pendingActions } = useDashboardData()

  const { settlementApprovalPending, applicationReviewPending, scheduleConflictCount } = pendingActions

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path)
    } else {
      navigate(path)
    }
  }

  const alerts: Array<{
    type: 'error' | 'warning' | 'info'
    message: string
    description: string
    path: string
    icon: React.ReactNode
  }> = []

  if (settlementApprovalPending > 0) {
    alerts.push({
      type: 'warning',
      message: `정산 승인 대기 ${settlementApprovalPending}건`,
      description: '승인이 필요한 정산이 있습니다.',
      path: '/settlements',
      icon: <DollarOutlined />,
    })
  }

  if (applicationReviewPending > 0) {
    alerts.push({
      type: 'info',
      message: `신청 검토 대기 ${applicationReviewPending}건`,
      description: '검토가 필요한 신청이 있습니다.',
      path: '/applications',
      icon: <FileTextOutlined />,
    })
  }

  if (scheduleConflictCount > 0) {
    alerts.push({
      type: 'error',
      message: `일정 중복 경고 ${scheduleConflictCount}건`,
      description: '중복된 일정이 감지되었습니다.',
      path: '/schedules',
      icon: <CalendarOutlined />,
    })
  }

  if (alerts.length === 0) {
    return null
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 24 }}>
      {alerts.map((alert, index) => (
        <Alert
          key={index}
          type={alert.type}
          message={alert.message}
          description={alert.description}
          icon={alert.icon}
          action={
            <Button size="small" onClick={() => handleNavigate(alert.path)}>
              확인하기
            </Button>
          }
          showIcon
          closable
        />
      ))}
    </Space>
  )
}

