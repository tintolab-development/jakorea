/**
 * 보고서 및 공시 관리
 */

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { NtsDisclosureCard } from '@/features/reports-disclosure/ui/nts-disclosure-card'
import { ReportListPanel } from '@/features/reports-disclosure/ui/report-list-panel'
import { CmsTextTabs } from '@/shared/ui'

import './page.css'

type TabKey = 'annual' | 'audit' | 'nts'

const TAB_ITEMS = [
  { key: 'annual' as const, label: '연차보고서' },
  { key: 'audit' as const, label: '회계감사 보고서' },
  { key: 'nts' as const, label: '국세청 공시' },
]

function parseTab(raw: string | null): TabKey {
  if (raw === 'audit' || raw === 'nts' || raw === 'annual') return raw
  return 'annual'
}

export function ReportsDisclosurePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = useMemo(() => parseTab(searchParams.get('tab')), [searchParams])

  const handleTabChange = useCallback(
    (key: TabKey) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev.toString())
          if (key === 'annual') {
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
    <div
      className={
        activeTab === 'nts' ? 'rd-page rd-page--nts' : 'rd-page'
      }
    >
      <CmsTextTabs
        variant="list"
        activeKey={activeTab}
        onChange={handleTabChange}
        items={TAB_ITEMS}
        ariaLabel="보고서 및 공시 탭"
        className="rd-page__tabs"
      />
      {activeTab === 'annual' ? <ReportListPanel kind="annual" /> : null}
      {activeTab === 'audit' ? <ReportListPanel kind="audit" /> : null}
      {activeTab === 'nts' ? <NtsDisclosureCard /> : null}
    </div>
  )
}
