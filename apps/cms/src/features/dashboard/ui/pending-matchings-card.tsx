/**
 * 대기 중인 매칭 카드
 * Phase 4.5: 주요 액션 카드
 */

import { Card, Statistic, Button } from 'antd'
import { TeamOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getPendingActionCounts } from '../api/admin-dashboard-service'
import { handleError } from '@/shared/utils/error-handler'

export function PendingMatchingsCard() {
  const navigate = useNavigate()
  const [count, setCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const data = await getPendingActionCounts()
        setCount(data.pendingMatchings)
      } catch (error) {
        handleError(error, { defaultMessage: '대기 매칭 수를 불러오는데 실패했습니다' })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleClick = () => {
    navigate('/matchings')
  }

  return (
    <Card
      hoverable
      onClick={handleClick}
      style={{ cursor: 'pointer', height: '100%' }}
      loading={loading}
    >
      <Statistic
        title="대기 중인 매칭"
        value={count}
        prefix={<TeamOutlined />}
        suffix="건"
        valueStyle={{ color: count > 0 ? '#faad14' : '#000000', fontWeight: 'bold' }}
      />
      {count > 0 && (
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
