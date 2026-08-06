/**
 * 수입&지출 관리
 */

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { FinanceSection, FinanceViewKind } from '@/entities/income-expense/model/types'
import { ItemsPanel } from '@/features/income-expense/ui/items-panel'
import { CmsTextTabs } from '@/shared/ui'

import './page.css'

const SECTION_ITEMS = [
  { key: 'income' as const, label: '수입총계' },
  { key: 'expense' as const, label: '지출총계' },
]

const VIEW_ITEMS = [
  { key: 'graph' as const, label: '그래프' },
  { key: 'table' as const, label: '테이블' },
]

function parseSection(raw: string | null): FinanceSection {
  return raw === 'expense' ? 'expense' : 'income'
}

function parseView(raw: string | null): FinanceViewKind {
  return raw === 'table' ? 'table' : 'graph'
}

export function IncomeExpensePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const section = useMemo(() => parseSection(searchParams.get('section')), [searchParams])
  const view = useMemo(() => parseView(searchParams.get('view')), [searchParams])

  const handleSectionChange = useCallback(
    (key: FinanceSection) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev.toString())
          if (key === 'income') {
            next.delete('section')
          } else {
            next.set('section', key)
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const handleViewChange = useCallback(
    (key: FinanceViewKind) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev.toString())
          if (key === 'graph') {
            next.delete('view')
          } else {
            next.set('view', key)
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const pageTitle = section === 'income' ? '수입총계 관리' : '지출총계 관리'

  return (
    <div className="income-expense-page">
      <CmsTextTabs
        variant="list"
        activeKey={section}
        onChange={handleSectionChange}
        items={SECTION_ITEMS}
        ariaLabel="수입 지출 탭"
        className="income-expense-page__tabs income-expense-page__tabs--section"
      />

      <div className="admin-list-card income-expense-page__card">
        <h2 className="income-expense-page__title">{pageTitle}</h2>
        <CmsTextTabs
          variant="list"
          activeKey={view}
          onChange={handleViewChange}
          items={VIEW_ITEMS}
          ariaLabel="그래프 테이블 탭"
          className="income-expense-page__tabs income-expense-page__tabs--view"
        />
        <ItemsPanel key={`${section}-${view}`} section={section} view={view} />
      </div>
    </div>
  )
}
