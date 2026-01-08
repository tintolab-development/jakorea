/**
 * 전체 강의 진행 현황 카드
 * Phase: 관리자 홈 화면
 * ProgramStatisticsCard 컴포넌트를 참고하여 공통 UI 패턴 적용
 */

import { Card, Row, Col, Statistic, Tag } from 'antd'
import { BookOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOverallProgramProgress, type OverallProgramProgress } from '../api/statistics-service'

export function OverallProgramProgressCard() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState<OverallProgramProgress | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      setLoading(true)
      try {
        const data = await getOverallProgramProgress()
        if (!cancelled) {
          setProgress(data)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('전체 강의 진행 현황 조회 실패:', error)
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
  }, [])

  const handleClick = () => {
    navigate('/programs')
  }

  if (!progress) {
    return (
      <Card
        hoverable
        onClick={handleClick}
        style={{ cursor: 'pointer', height: '100%' }}
        loading={loading}
      >
        <div style={{ height: 150 }} />
      </Card>
    )
  }

  const total = progress.applicationCompleted + progress.scheduled + progress.inProgress + progress.completed

  return (
    <Card
      hoverable
      onClick={handleClick}
      style={{ cursor: 'pointer', height: '100%' }}
      loading={loading}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Statistic
            title="전체 강의 진행 현황"
            value={total}
            prefix={<BookOutlined />}
            suffix="개"
            valueStyle={{ color: '#000000', fontWeight: 'bold' }}
          />
        </Col>
        <Col span={24} style={{ marginTop: 16 }}>
          <Row gutter={[8, 8]} wrap>
            <Col>
              <Tag color="blue">신청 완료: {progress.applicationCompleted}</Tag>
            </Col>
            <Col>
              <Tag color="orange">진행 예정: {progress.scheduled}</Tag>
            </Col>
            <Col>
              <Tag color="green">진행 중: {progress.inProgress}</Tag>
            </Col>
            <Col>
              <Tag color="default">진행 완료: {progress.completed}</Tag>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  )
}
