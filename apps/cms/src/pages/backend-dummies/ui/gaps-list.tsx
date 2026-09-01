import type { GapPriority, GapRow } from '../data/types'

const PRIORITY_ORDER: GapPriority[] = ['P0', 'P1', 'P2']

export function GapsList({ rows }: { rows: GapRow[] }) {
  if (rows.length === 0) {
    return <p className="bd-empty">이 카테고리에 등록된 BE 갭이 없습니다.</p>
  }

  return (
    <div className="bd-gaps">
      {PRIORITY_ORDER.map(priority => {
        const group = rows.filter(r => r.priority === priority)
        if (group.length === 0) return null
        return (
          <section key={priority} className="bd-gaps__group">
            <h3 className="bd-gaps__priority">{priority}</h3>
            <ul className="bd-gaps__list">
              {group.map(g => (
                <li key={g.id} className="bd-gaps__item">
                  <div className="bd-gaps__id">
                    <code>{g.id}</code>
                    <strong>{g.title}</strong>
                  </div>
                  <p className="bd-gaps__api">{g.suggestedApi}</p>
                  {g.relatedCases?.length ? (
                    <p className="bd-gaps__cases">CASE: {g.relatedCases.join(', ')}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
