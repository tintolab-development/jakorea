/**
 * 프로그램 진행 현황(모집 신청 현황) — 테이블 컬럼 읽기 전용 셀
 *
 * - `ProgramLifecycleStatusBadge` + `variant="table"` (고정 120px 해제, 라벨 길이에 맞춤)
 * - 편집/드롭다운이 필요하면 `ProgramLifecycleStatusCell` + `StatusDropdownCell` 사용
 *
 * 사용처: 프로그램 목록 컬럼, `program-table-column-resolver`, 회원 상세 강의 이력 등
 */

import type { ReactNode } from 'react'
import type { ProgramLifecycleStatus } from '@/types/domain'
import { ProgramLifecycleStatusBadge } from './program-lifecycle-status-badge'

export interface ProgramLifecycleStatusTableCellProps {
  status: ProgramLifecycleStatus | null | undefined
  /** 상태 없을 때 (기본 '-') */
  emptyPlaceholder?: ReactNode
}

export function ProgramLifecycleStatusTableCell({
  status,
  emptyPlaceholder = '-',
}: ProgramLifecycleStatusTableCellProps) {
  if (status == null) {
    return <>{emptyPlaceholder}</>
  }
  return <ProgramLifecycleStatusBadge status={status} variant="table" />
}
