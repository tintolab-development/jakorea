import { type ReactNode } from 'react'
import './program-detail-td-divider.css'

export function ProgramDetailTdDivider() {
  return <span className="program-detail-td-divider" aria-hidden />
}

export function withProgramDetailTdDivider(segments: ReactNode[]) {
  const filtered = segments.filter(s => s != null && s !== '')
  if (filtered.length === 0) return '-'
  if (filtered.length === 1) return filtered[0]
  return (
    <>
      {filtered.reduce<ReactNode[]>((acc, seg, i) => {
        if (i > 0) acc.push(<ProgramDetailTdDivider key={`pd-div-${i}`} />)
        acc.push(<span key={i}>{seg}</span>)
        return acc
      }, [])}
    </>
  )
}

export function ProgramDetailTdSegmentWrap({ children }: { children: ReactNode }) {
  return <div className="program-detail-td-segment-wrap">{children}</div>
}
