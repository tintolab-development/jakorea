import { Empty, Typography } from 'antd'
import { useLocation } from 'react-router-dom'
import { getCategoryNameByPath } from '@/shared/config/menu-config'

const { Paragraph, Text } = Typography

/**
 * Phase 2 셸용 플레이스홀더 — Phase 3에서 실제 화면으로 교체
 */
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
              Phase 3에서 기능 화면을 구현합니다.
            </Paragraph>
          </>
        }
      />
    </div>
  )
}
