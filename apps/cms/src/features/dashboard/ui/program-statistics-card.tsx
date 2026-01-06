/**
 * 프로그램 통계 카드
 * Phase 5.1.1: 관리자 대시보드
 */

import { Card, Statistic, Row, Col, Tag } from 'antd'
import { BookOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { domainColorsHex } from '@/shared/constants/colors'

interface ProgramStatisticsCardProps {
  total: number
  inProgress: number
  completed: number
  loading?: boolean
}

export function ProgramStatisticsCard({
  total,
  inProgress,
  completed,
  loading = false,
}: ProgramStatisticsCardProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/programs')
  }

  return (
    <Card
      hoverable
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
      loading={loading}
    >
      <Row gutter={16}>
        <Col span={24}>
          <Statistic
            title="프로그램"
            value={total}
            prefix={<BookOutlined />}
            valueStyle={{ color: domainColorsHex.program.primary }}
          />
        </Col>
        <Col span={24} style={{ marginTop: 16 }}>
          <Row gutter={8}>
            <Col>
              <Tag color="blue">진행중: {inProgress}</Tag>
            </Col>
            <Col>
              <Tag color="green">완료: {completed}</Tag>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  )
}

