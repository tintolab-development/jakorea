/**
 * 본인 활동 요약 카드 (내 강의 현황)
 * Phase 4.2.1: 권한별 대시보드 위젯 구성
 * Phase 5.2.1: 내 강의 현황 상태별 세분화
 * 강사/봉사자용: 본인 활동 요약
 */

import { Card, Row, Col, Statistic } from 'antd'
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useEffect, useState } from 'react'
import { getInstructorActivitySummary, type InstructorActivitySummary } from '../api/instructor-activity-service'
import { useNavigate } from 'react-router-dom'

export function MyActivitySummary() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<InstructorActivitySummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.instructorId) {
      setSummary(null)
      return
    }

    let cancelled = false
    
    const loadData = async () => {
      if (!user.instructorId) return
      
      setLoading(true)
      try {
        const data = await getInstructorActivitySummary(user.instructorId)
        if (!cancelled) {
          setSummary(data)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('활동 요약 조회 실패:', error)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [user?.instructorId])

  if (!user?.instructorId) {
    return (
      <Card title="내 강의 현황">
        <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(0, 0, 0, 0.45)' }}>
          강사 정보가 없습니다.
        </div>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card title="내 강의 현황" loading={loading}>
        <div style={{ height: 150 }} />
      </Card>
    )
  }

  return (
    <Card
      title="내 강의 현황"
      loading={loading}
      hoverable
      onClick={() => navigate('/programs/my')}
      style={{ cursor: 'pointer' }}
    >
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="전체 프로그램"
            value={summary.programs.total}
            prefix={<FileTextOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="신청 완료"
            value={summary.programs.applicationCompleted}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="진행 예정"
            value={summary.programs.scheduled}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="진행중"
            value={summary.programs.inProgress}
            prefix={<PlayCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="진행완료"
            value={summary.programs.completed}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#8c8c8c' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="예정된 일정"
            value={summary.schedules.total}
            prefix={<CalendarOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="정산 제출 대기"
            value={summary.pendingTasks.settlementPending}
            prefix={<FileTextOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Col>
      </Row>
    </Card>
  )
}

