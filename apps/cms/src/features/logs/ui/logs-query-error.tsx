import { Empty } from 'antd'

interface LogsQueryErrorProps {
  message?: string
}

export function LogsQueryError({
  message = '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
}: LogsQueryErrorProps) {
  return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={message} />
}
