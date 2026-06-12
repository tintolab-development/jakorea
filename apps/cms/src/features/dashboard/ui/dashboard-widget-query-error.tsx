/**
 * 대시보드 위젯 React Query 실패 시 공통 empty/error UI
 */
import { Empty } from 'antd'

interface DashboardWidgetQueryErrorProps {
  message?: string
}

export function DashboardWidgetQueryError({
  message = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
}: DashboardWidgetQueryErrorProps) {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={message}
    />
  )
}
