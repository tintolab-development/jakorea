/**
 * 함께하는 사람들 — 조직도 / 이사회 탭
 */

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BoardPanel } from '@/features/board-members/ui/board-panel'
import { OrganizationChartPanel } from '@/features/organization-chart/ui/org-chart-panel'
import { CmsTextTabs } from '@/shared/ui'

import './page.css'

type TabKey = 'organization' | 'board'

const TAB_ITEMS = [
  { key: 'organization' as const, label: '조직도' },
  { key: 'board' as const, label: '이사회' },
]

function parseTab(raw: string | null): TabKey {
  if (raw === 'board') return 'board'
  return 'organization'
}

export function PeoplePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = useMemo(() => parseTab(searchParams.get('tab')), [searchParams])

  const handleTabChange = useCallback(
    (key: TabKey) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev.toString())
          if (key === 'organization') {
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
    <div className="people-page">
      <CmsTextTabs
        variant="list"
        activeKey={activeTab}
        onChange={handleTabChange}
        items={TAB_ITEMS}
        ariaLabel="함께하는 사람들 탭"
        className="people-page__tabs"
      />
      {activeTab === 'organization' ? <OrganizationChartPanel /> : null}
      {activeTab === 'board' ? <BoardPanel /> : null}
    </div>
  )
}
