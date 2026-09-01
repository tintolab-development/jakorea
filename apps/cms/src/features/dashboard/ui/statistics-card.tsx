/**
 * 대시보드 통계 카드 공통 Presentational 컴포넌트
 * 프로그램/신청/매칭/정산·강사 수 카드에서 재사용
 */

import { Card, Statistic, Row, Col, Tag } from 'antd'
import { useNavigate } from 'react-router-dom'

export interface StatisticsCardTag {
  color: string
  label: string
}

export interface StatisticsCardProps {
  title: string
  value: number
  prefix?: React.ReactNode
  suffix: string
  /** 없으면 태그 행 숨김 (강사 수 등 단순 카드) */
  tags?: StatisticsCardTag[]
  to: string
  loading?: boolean
}

export function StatisticsCard({
  title,
  value,
  prefix,
  suffix,
  tags,
  to,
  loading = false,
}: StatisticsCardProps) {
  const navigate = useNavigate()
  const hasTags = (tags?.length ?? 0) > 0

  const handleClick = () => {
    navigate(to)
  }

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
            title={title}
            value={value}
            prefix={prefix}
            suffix={suffix}
            valueStyle={{ color: '#000000', fontWeight: 'bold' }}
          />
        </Col>
        {hasTags ? (
          <Col span={24} style={{ marginTop: 16 }}>
            <Row gutter={[8, 8]} wrap>
              {(tags ?? []).map((tag, index) => (
                <Col key={index}>
                  <Tag color={tag.color}>{tag.label}</Tag>
                </Col>
              ))}
            </Row>
          </Col>
        ) : null}
      </Row>
    </Card>
  )
}
