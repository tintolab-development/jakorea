import { useMemo, useState } from 'react'
import type { SeedCaseRow } from '../data/types'

export function SeedCaseTable({ rows }: { rows: SeedCaseRow[] }) {
  const [q, setQ] = useState('')
  const [childOnly, setChildOnly] = useState(false)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter(r => {
      if (childOnly && !r.needsChildSeed) return false
      if (!needle) return true
      const hay = [r.caseCode, r.beProgramId, r.feMockId, r.scenario, ...(r.opensLnbs ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(needle)
    })
  }, [rows, q, childOnly])

  return (
    <div className="bd-seed">
      <div className="bd-seed__filters">
        <input
          className="bd-input"
          type="search"
          placeholder="CASE / BE id / FE mock / 시나리오 검색"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <label className="bd-check">
          <input type="checkbox" checked={childOnly} onChange={e => setChildOnly(e.target.checked)} />
          하위 시드 필요만
        </label>
      </div>
      {filtered.length === 0 ? (
        <p className="bd-empty">검색 결과가 없습니다.</p>
      ) : (
        <div className="bd-table-wrap">
          <table className="bd-table">
            <thead>
              <tr>
                <th>CASE</th>
                <th>BE ID</th>
                <th>FE mock id</th>
                <th>시나리오</th>
                <th>LNB</th>
                <th>하위시드</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <code>{r.caseCode}</code>
                  </td>
                  <td className="bd-table__mono">{r.beProgramId ?? '—'}</td>
                  <td className="bd-table__mono">{r.feMockId ?? '—'}</td>
                  <td>{r.scenario}</td>
                  <td>{r.opensLnbs.join(', ') || '—'}</td>
                  <td>{r.needsChildSeed ? '필요' : '—'}</td>
                  <td>{r.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
