/**
 * 즉시 처리 필요 작업 Alert Bar
 * Phase 1: 대시보드 고도화
 */

import { Alert, Space, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { DollarOutlined, FileTextOutlined, CalendarOutlined } from '@ant-design/icons'
import { mockSettlements, mockApplications, mockSchedules } from '@/data/mock'
import dayjs from 'dayjs'

interface PendingActionsAlertProps {
  onNavigate?: (path: string) => void
}

export function PendingActionsAlert({ onNavigate }: PendingActionsAlertProps) {
  const navigate = useNavigate()

  // 정산 승인 대기 건수
  const settlementApprovalPending = mockSettlements.filter(
    s => s.status === 'calculated' || s.status === 'approved'
  ).length

  // 신청 검토 대기 건수
  const applicationReviewPending = mockApplications.filter(
    a => a.status === 'submitted' || a.status === 'reviewing'
  ).length

  // 일정 중복 경고 (간단한 로직: 같은 날짜, 같은 강사, 시간 겹치는 경우)
  const scheduleConflicts: typeof mockSchedules = []
  mockSchedules.forEach(schedule1 => {
    if (!schedule1.instructorId) return
    const date1 = typeof schedule1.date === 'string' ? dayjs(schedule1.date) : dayjs(schedule1.date)
    const start1 = dayjs(`${date1.format('YYYY-MM-DD')} ${schedule1.startTime}`, 'YYYY-MM-DD HH:mm')
    const end1 = dayjs(`${date1.format('YYYY-MM-DD')} ${schedule1.endTime}`, 'YYYY-MM-DD HH:mm')

    mockSchedules.forEach(schedule2 => {
      if (
        schedule1.id === schedule2.id ||
        !schedule2.instructorId ||
        schedule1.instructorId !== schedule2.instructorId
      ) {
        return
      }

      const date2 = typeof schedule2.date === 'string' ? dayjs(schedule2.date) : dayjs(schedule2.date)
      if (!date1.isSame(date2, 'day')) return

      const start2 = dayjs(`${date2.format('YYYY-MM-DD')} ${schedule2.startTime}`, 'YYYY-MM-DD HH:mm')
      const end2 = dayjs(`${date2.format('YYYY-MM-DD')} ${schedule2.endTime}`, 'YYYY-MM-DD HH:mm')

      // 시간 겹치는 경우
      if (start1.isBefore(end2) && end1.isAfter(start2)) {
        if (!scheduleConflicts.some(c => c.id === schedule1.id)) {
          scheduleConflicts.push(schedule1)
        }
      }
    })
  })
  const scheduleConflictCount = scheduleConflicts.length

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

