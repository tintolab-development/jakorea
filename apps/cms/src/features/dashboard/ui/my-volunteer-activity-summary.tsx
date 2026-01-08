/**
 * 봉사자용 활동 요약 카드
 * Phase: 봉사단 권한 마이그레이션
 */

import { Card, Row, Col, Statistic } from 'antd'
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useEffect, useState } from 'react'
import {
  getInstructorActivitySummary,
  type InstructorActivitySummary,
} from '../api/instructor-activity-service'
import { useNavigate } from 'react-router-dom'

export function MyVolunteerActivitySummary() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<InstructorActivitySummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 봉사자도 instructorId를 사용하여 활동 내역을 조회한다고 가정 (공통 API 사용)
    if (!user?.instructorId) {
      setSummary(null)
      return
    }

    let cancelled = false

    const loadData = async () => {
      setLoading(true)
      try {
        const data = await getInstructorActivitySummary(user.instructorId!)
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
      <Card title="내 봉사 현황">
        <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(0, 0, 0, 0.45)' }}>
          봉사자 정보가 없습니다.
        </div>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card title="내 봉사 현황" loading={loading}>
        <div style={{ height: 150 }} />
      </Card>
    )
  }

  return (
    <Card
      title="내 봉사 현황"
      loading={loading}
      hoverable
      onClick={() => navigate('/volunteers/my/programs')}
      style={{ cursor: 'pointer', height: '100%' }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="전체 봉사"
            value={summary.programs.total}
            prefix={<HeartOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />}
            suffix="건"
            valueStyle={{ fontWeight: 'bold' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="신청 완료"
            value={summary.programs.applicationCompleted}
            prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
            suffix="건"
            valueStyle={{ fontWeight: 'bold' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="진행 예정"
            value={summary.programs.scheduled}
            prefix={<ClockCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />}
            suffix="건"
            valueStyle={{ fontWeight: 'bold' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="진행중"
            value={summary.programs.inProgress}
            prefix={<PlayCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />}
            suffix="건"
            valueStyle={{ fontWeight: 'bold' }}
          />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="진행완료"
            value={summary.programs.completed}
            prefix={<CheckCircleOutlined style={{ color: '#13c2c2', marginRight: 8 }} />}
            suffix="건"
            valueStyle={{ fontWeight: 'bold' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="예정된 일정"
            value={summary.schedules.total}
            prefix={<CalendarOutlined style={{ color: '#722ed1', marginRight: 8 }} />}
            suffix="건"
            valueStyle={{ fontWeight: 'bold' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="누적 봉사시간"
            value={24} // 가상 데이터
            prefix={<ClockCircleOutlined style={{ color: '#eb2f96', marginRight: 8 }} />}
            suffix="시간"
            valueStyle={{ fontWeight: 'bold' }}
          />
        </Col>
      </Row>
    </Card>
  )
}
