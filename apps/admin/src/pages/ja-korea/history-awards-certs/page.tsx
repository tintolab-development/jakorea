/**
 * 연혁/수상/인증 관리
 */

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AwardPanel } from '@/features/history-awards-certs/ui/award-panel'
import { CertPanel } from '@/features/history-awards-certs/ui/cert-panel'
import { HistoryPanel } from '@/features/history-awards-certs/ui/history-panel'
import { CmsTextTabs } from '@/shared/ui'

import './page.css'

type TabKey = 'history' | 'award' | 'cert'

const TAB_ITEMS = [
  { key: 'history' as const, label: '연혁' },
  { key: 'award' as const, label: '수상' },
  { key: 'cert' as const, label: '인증' },
]

function parseTab(raw: string | null): TabKey {
  if (raw === 'award' || raw === 'cert' || raw === 'history') return raw
  return 'history'
}

export function HistoryAwardsCertsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = useMemo(() => parseTab(searchParams.get('tab')), [searchParams])

  const handleTabChange = useCallback(
    (key: TabKey) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev.toString())
          if (key === 'history') {
            next.delete('tab')
          } else {
            next.set('tab', key)
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  return (
    <div className="hac-page">
      <CmsTextTabs
        variant="list"
        activeKey={activeTab}
        onChange={handleTabChange}
        items={TAB_ITEMS}
        ariaLabel="연혁 수상 인증 탭"
        className="hac-page__tabs"
      />
      {activeTab === 'history' ? <HistoryPanel /> : null}
      {activeTab === 'award' ? <AwardPanel /> : null}
      {activeTab === 'cert' ? <CertPanel /> : null}
    </div>
  )
}
