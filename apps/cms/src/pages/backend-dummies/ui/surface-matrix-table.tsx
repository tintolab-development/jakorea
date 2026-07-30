import type { SurfaceRow } from '../data/types'
import { StatusBadge } from './status-badge'

const AREA_LABEL: Record<SurfaceRow['area'], string> = {
  'list-crud': '목록/CRUD',
  info: '정보',
  applications: '신청',
  progress: '진행',
  nested: '중첩',
  survey: '설문',
  managers: '담당자',
  other: '기타',
}

export function SurfaceMatrixTable({
  rows,
  runtimeRemoteReady,
}: {
  rows: SurfaceRow[]
  runtimeRemoteReady: boolean
}) {
  if (rows.length === 0) {
    return <p className="bd-empty">등록된 surface가 없습니다.</p>
  }

  return (
    <div className="bd-table-wrap">
      <table className="bd-table">
        <thead>
          <tr>
            <th>영역</th>
            <th>표면</th>
            <th>상태</th>
            <th>GET</th>
            <th>Mutation</th>
            <th>완료%</th>
            <th>런타임</th>
            <th>API path</th>
            <th>mock 파일</th>
            <th>비고</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const runtimeMock =
              row.status === 'mock-only' ||
              row.status === 'n-a' ||
              !runtimeRemoteReady ||
              (row.status === 'hybrid' && !runtimeRemoteReady)
            return (
              <tr
                key={row.id}
                className={row.area === 'nested' || row.status === 'mock-only' ? 'bd-table__row--warn' : undefined}
              >
                <td>{AREA_LABEL[row.area]}</td>
                <td>{row.label}</td>
                <td>
                  <StatusBadge status={row.status} />
                </td>
                <td>
                  <StatusBadge status={row.getStatus} />
                </td>
                <td>
                  <StatusBadge status={row.mutationStatus} />
                </td>
                <td>{row.completionPct}%</td>
                <td>
                  {runtimeMock ? (
                    <span className="bd-pill bd-pill--warn">현재 mock</span>
                  ) : (
                    <span className="bd-pill bd-pill--on">remote 가능</span>
                  )}
                </td>
                <td className="bd-table__mono">
                  {row.apiPaths.length ? row.apiPaths.join(' · ') : '—'}
                </td>
                <td className="bd-table__mono">
                  {row.mockFiles.length ? row.mockFiles.join(', ') : '—'}
                </td>
                <td>{row.notes ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
