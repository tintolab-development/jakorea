import { type ReactNode } from 'react'
import { DetailInfoFormTdDivider } from '@/shared/components/detail-info-form'
import './program-detail-td-divider.css'

/** mock·포맷터가 ` | ` 로 이어 붙인 문자열을 세그먼트 배열로 분리 */
export function splitPipeSeparatedText(text: string | undefined | null): string[] {
  const trimmed = text?.trim()
  if (!trimmed || trimmed === '-') return []
  return trimmed
    .split(' | ')
    .map(part => part.trim())
    .filter(Boolean)
}

/** 테이블 td·상세 값 셀 — ` | ` 문자열을 디바이더로 재조립 */
export function renderProgramDetailPipeSeparated(text: string | undefined | null): ReactNode {
  const parts = splitPipeSeparatedText(text)
  if (parts.length === 0) return '-'
  if (parts.length === 1) return parts[0]
  return (
    <ProgramDetailTdSegmentWrap>
      {withProgramDetailTdDivider(parts)}
    </ProgramDetailTdSegmentWrap>
  )
}

/** DetailInfoForm 격자 값 셀 — ` | ` 문자열을 TdDivider로 재조립 */
export function renderDetailInfoPipeSeparated(text: string | undefined | null): ReactNode {
  const parts = splitPipeSeparatedText(text)
  if (parts.length === 0) return '-'
  if (parts.length === 1) return parts[0]
  return (
    <>
      {parts.reduce<ReactNode[]>((acc, part, index) => {
        if (index > 0) acc.push(<DetailInfoFormTdDivider key={`di-div-${index}`} />)
        acc.push(<span key={`di-seg-${index}`}>{part}</span>)
        return acc
      }, [])}
    </>
  )
}

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
