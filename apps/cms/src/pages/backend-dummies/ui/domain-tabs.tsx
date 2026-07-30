import { BACKEND_DUMMY_DOMAINS } from '../data/domains'
import type { BackendDummyDomainId } from '../data/types'

export function DomainTabs({
  activeTab,
  onChange,
}: {
  activeTab: BackendDummyDomainId
  onChange: (tab: BackendDummyDomainId) => void
}) {
  return (
    <nav className="bd-domain-tabs" aria-label="LNB 도메인">
      <div className="bd-domain-tabs__list" role="tablist">
        {BACKEND_DUMMY_DOMAINS.map(d => {
          const active = d.id === activeTab
          return (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={active ? 'bd-domain-tab bd-domain-tab--active' : 'bd-domain-tab'}
              onClick={() => onChange(d.id)}
            >
              {d.shortLabel}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
