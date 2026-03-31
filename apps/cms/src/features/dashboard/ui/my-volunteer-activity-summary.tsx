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

  const commonValueStyle = { 
    color: '#000000', 
    fontWeight: 'bold', 
    display: 'inline-flex', 
    alignItems: 'center' 
  }

  const getPrefix = (icon: React.ReactNode) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 8 }}>
      {icon}
    </span>
  )

  return (
    <Card
      title="내 봉사 현황"
      loading={loading}
      hoverable
      onClick={() => navigate('/programs/volunteer')}
      style={{ cursor: 'pointer', height: '100%' }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="전체 봉사"
            value={summary.programs.total}
            prefix={getPrefix(<HeartOutlined style={{ color: '#000000' }} />)}
            suffix="건"
            valueStyle={commonValueStyle}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="신청 완료"
            value={summary.programs.applicationCompleted}
            prefix={getPrefix(<CheckCircleOutlined style={{ color: '#000000' }} />)}
            suffix="건"
            valueStyle={commonValueStyle}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="진행 예정"
            value={summary.programs.scheduled}
            prefix={getPrefix(<ClockCircleOutlined style={{ color: '#000000' }} />)}
            suffix="건"
            valueStyle={commonValueStyle}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="진행중"
            value={summary.programs.inProgress}
            prefix={getPrefix(<PlayCircleOutlined style={{ color: '#000000' }} />)}
            suffix="건"
            valueStyle={commonValueStyle}
          />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="진행완료"
            value={summary.programs.completed}
            prefix={getPrefix(<CheckCircleOutlined style={{ color: '#000000' }} />)}
            suffix="건"
            valueStyle={commonValueStyle}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="예정된 일정"
            value={summary.schedules.total}
            prefix={getPrefix(<CalendarOutlined style={{ color: '#000000' }} />)}
            suffix="건"
            valueStyle={commonValueStyle}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="누적 봉사시간"
            value={24} // 가상 데이터
            prefix={getPrefix(<ClockCircleOutlined style={{ color: '#000000' }} />)}
            suffix="시간"
            valueStyle={commonValueStyle}
          />
        </Col>
      </Row>
    </Card>
  )
}
