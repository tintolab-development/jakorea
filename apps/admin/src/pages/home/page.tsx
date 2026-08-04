import { Empty, Typography } from 'antd'

const { Paragraph } = Typography

/**
 * 대시보드 홈 — Phase 2 셸 확인용
 */
export function HomePage() {
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
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            홈페이지 어드민 셸입니다. 왼쪽 메뉴에서 관리 화면으로 이동하세요.
          </Paragraph>
        }
      />
    </div>
  )
}
