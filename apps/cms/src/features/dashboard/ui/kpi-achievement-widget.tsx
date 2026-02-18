/**
 * 사업 별 KPI 대비 달성률 위젯 (플레이스홀더)
 * 사업별 KPI 진행 현황 카드 — 추후 구현 예정
 */

import { Card, Button, Empty, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { WidgetTitleWithHandle } from './widget-title-with-handle'
import '@/shared/ui/widget-more-button.css'

const { Text } = Typography

const MOCK_TOTAL_COUNT = 129

export function KpiAchievementWidget() {
  const navigate = useNavigate()

  return (
    <Card
      className="kpi-achievement-widget"
      title={
        <WidgetTitleWithHandle>
          <span className="widget-card-title">사업 별 KPI 대비 달성률</span>
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 13, fontWeight: 400 }}>
            총 {MOCK_TOTAL_COUNT}건
          </Text>
        </WidgetTitleWithHandle>
      }
      extra={
        <Button
          type="link"
          size="small"
          onClick={() => navigate('/performance')}
          className="widget-more-button"
        >
          더보기
        </Button>
      }
    >
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="사업별 KPI 달성률이 준비 중입니다"
      />
    </Card>
  )
}
