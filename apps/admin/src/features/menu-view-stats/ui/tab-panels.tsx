/**
 * 메뉴별 조회 통계 — 탭 패널 (섹션 목록)
 */

import type {
  MenuViewSection,
  MenuViewTabId,
} from '@/entities/menu-view-stats/model/types'
import { MenuViewMetricMatrix } from '@/features/menu-view-stats/ui/metric-matrix'
import { MenuViewSectionBlock } from '@/features/menu-view-stats/ui/section-block'

import './section-shared.css'

type Props = {
  tabId: MenuViewTabId
  sections: MenuViewSection[]
}

export function MenuViewTabPanel({ tabId, sections }: Props) {
  if (sections.length === 0) {
    return (
      <div className="menu-view-tab-panel menu-view-tab-panel--empty" data-tab={tabId}>
        <p className="menu-view-tab-panel__empty-text">표시할 통계가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="menu-view-tab-panel" data-tab={tabId}>
      {sections.map(section => (
        <MenuViewSectionBlock
          key={section.id}
          title={section.title}
          footnote={section.footnote}
        >
          <MenuViewMetricMatrix metric={section.metric} />
        </MenuViewSectionBlock>
      ))}
    </div>
  )
}
