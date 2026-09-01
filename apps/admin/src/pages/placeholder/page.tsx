import { Empty, Typography } from 'antd'
import { useLocation } from 'react-router-dom'
import { getCategoryNameByPath } from '@/shared/config/menu-config'

const { Paragraph, Text } = Typography

/** LNB 셸용 빈 화면 — 기능 화면 구현 전까지 표시 */
export function PlaceholderPage() {
  const location = useLocation()
  const title = getCategoryNameByPath(location.pathname)

  return (
    <div
      style={{
        background: 'var(--color-bg-base)',
        borderRadius: 'var(--radius-8)',
        padding: 48,
        minHeight: 320,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Empty
        description={
          <>
            <Paragraph strong style={{ marginBottom: 4 }}>
              {title}
            </Paragraph>
            <Text type="secondary">{location.pathname}</Text>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              준비 중인 화면입니다.
            </Paragraph>
          </>
        }
      />
    </div>
  )
}
