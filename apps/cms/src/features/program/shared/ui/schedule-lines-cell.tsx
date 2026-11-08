/**
 * 프로그램 공통 — 테이블 일정(진행 예정·확정·희망) 셀
 *
 * 모든 프로그램 유형·참여자 유형 공통 표시 규칙
 * 1) 최대 3줄 — 4건 이상이면 앞 2건 + `외 N개의 … 일정`
 * 2) 일정 문자열의 ` | ` 는 텍스트가 아닌 디바이더(양옆 16px)로 렌더
 * 3) 열 기준 중앙 정렬 — 가장 긴 줄 기준으로 블록을 가운데 두고, 줄끼리는 좌측 정렬
 */
import type { ReactNode } from 'react'
import { ProgramDetailTdDivider, splitPipeSeparatedText } from './program-detail-td-divider'
import './schedule-lines-cell.css'

export const SCHEDULE_LINES_MAX_VISIBLE = 3
export const SCHEDULE_LINES_OVERFLOW_HEAD = 2

/** 3건 이하 전부, 4건 이상이면 앞 2건 + 나머지 개수 */
export function sliceScheduleLines<T>(items: readonly T[]): { visible: T[]; restCount: number } {
  const total = items.length
  const showCount =
    total <= SCHEDULE_LINES_MAX_VISIBLE ? total : SCHEDULE_LINES_OVERFLOW_HEAD
  return { visible: items.slice(0, showCount), restCount: total - showCount }
}

function renderScheduleLineSegments(line: string): ReactNode {
  const parts = splitPipeSeparatedText(line)
  // 단일 세그먼트도 span으로 — 좁을 때 `…` 말줄임(마지막 span 규칙)이 적용되도록
  if (parts.length <= 1) return <span>{parts[0] ?? line}</span>
  return parts.reduce<ReactNode[]>((acc, part, index) => {
    if (index > 0) acc.push(<ProgramDetailTdDivider key={`div-${index}`} />)
    acc.push(<span key={`seg-${index}`}>{part}</span>)
    return acc
  }, [])
}

export function ScheduleLinesCell({
  lines,
  moreUnit = '교육 일정',
  emptyText = '-',
}: {
  /** 한 줄 = 한 일정. ` | ` 로 이어진 세그먼트는 디바이더로 분리 */
  lines: readonly (string | null | undefined)[]
  /** `외 N개의 {moreUnit}` */
  moreUnit?: string
  emptyText?: ReactNode
}) {
  const filtered = lines.map(line => line?.trim() ?? '').filter(line => line && line !== '-')
  if (filtered.length === 0) return <>{emptyText}</>
  const { visible, restCount } = sliceScheduleLines(filtered)
  return (
    <div className="schedule-lines-cell">
      <div className="schedule-lines-cell__block">
        {visible.map((line, index) => (
          <div key={`${line}-${index}`} className="schedule-lines-cell__line" title={line}>
            {renderScheduleLineSegments(line)}
          </div>
        ))}
        {restCount > 0 ? (
          <div className="schedule-lines-cell__more">
            외 {restCount}개의 {moreUnit}
          </div>
        ) : null}
      </div>
    </div>
  )
}
