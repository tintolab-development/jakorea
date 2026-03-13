/**
 * 대기 중인 액션 카드 공통 Presentational 컴포넌트
 * 신청/매칭/정산 대기 카드에서 재사용
 */

import { Card, Statistic, Button } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

export interface PendingActionCardProps {
  title: string
  value: number
  prefix?: React.ReactNode
  suffix: string
  to: string
  loading?: boolean
}

export function PendingActionCard({
  title,
  value,
  prefix,
  suffix,
  to,
  loading = false,
}: PendingActionCardProps) {
  const navigate = useNavigate()

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
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{
          color: value > 0 ? '#faad14' : '#000000',
          fontWeight: 'bold',
        }}
      />
      {value > 0 && (
        <Button
          type="link"
          icon={<ArrowRightOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            handleClick()
          }}
          style={{ padding: 0, marginTop: 8 }}
        >
          처리하기
        </Button>
      )}
    </Card>
  )
}
