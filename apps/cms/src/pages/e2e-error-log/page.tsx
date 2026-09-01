/**
 * /e2e-error-log — E2E 로깅 (테스트 진행 · 백엔드 에러)
 */

import { useMemo, useState } from 'react'
import { Tabs, Typography } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { E2eErrorLogPanel } from './error-log-panel'
import { E2eTestLogPanel } from './test-log-panel'
import './page.css'

type LogTabKey = 'test' | 'error'

function parseTab(raw: string | null): LogTabKey {
  return raw === 'error' ? 'error' : 'test'
}

export function E2eErrorLogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<LogTabKey>(() => parseTab(searchParams.get('tab')))

  const items = useMemo(
    () => [
      {
        key: 'test' as const,
        label: '테스트 로깅',
        children: <E2eTestLogPanel active={activeTab === 'test'} />,
      },
      {
        key: 'error' as const,
        label: '에러 로깅',
        children: <E2eErrorLogPanel active={activeTab === 'error'} />,
      },
    ],
    [activeTab]
  )

  return (
    <div className="e2e-error-log-page">
      <header className="e2e-error-log-page__header">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            E2E 로깅
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            테스트 진행·POST payload·지표와 백엔드 에러 로그를 탭으로 구분해 확인합니다. Vite DEV Mock
            API 스토어를 Playwright와 공유합니다.
          </Typography.Paragraph>
        </div>
      </header>

      <Tabs
        className="e2e-error-log-page__tabs"
        activeKey={activeTab}
        items={items}
        onChange={key => {
          const next = parseTab(key)
          setActiveTab(next)
          setSearchParams(next === 'test' ? {} : { tab: next }, { replace: true })
        }}
        destroyInactiveTabPane={false}
      />
    </div>
  )
}

export default E2eErrorLogPage
