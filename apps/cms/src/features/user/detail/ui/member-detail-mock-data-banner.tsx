import { Alert } from 'antd'

export interface MemberDetailMockDataBannerProps {
  message: string
  className?: string
}

/** 회원 상세 — remote 모드에서 API 미제공 구간 mock 데이터 안내 */
export function MemberDetailMockDataBanner({ message, className }: MemberDetailMockDataBannerProps) {
  return (
    <Alert
      type="info"
      showIcon
      className={className}
      message={message}
      style={{ marginBottom: 16 }}
    />
  )
}
