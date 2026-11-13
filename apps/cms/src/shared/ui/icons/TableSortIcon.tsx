/**
 * 표 정렬 화살표 — 시안 Sprite `ico-sort-arrow-up` / `ico-sort-arrow-down` 원본(10×5).
 * antd Table column `sortIcon`에 넘긴다. 현재 정렬 방향만 진하게, 나머지는 흐리게.
 */

import type { SortOrder } from 'antd/es/table/interface'
import sortDownUrl from '@/shared/assets/icons/table/sort-arrow-down.svg'
import sortUpUrl from '@/shared/assets/icons/table/sort-arrow-up.svg'

const INACTIVE_OPACITY = 0.3

export function TableSortIcon({ sortOrder }: { sortOrder: SortOrder }) {
  return (
    <span
      aria-hidden
      style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, lineHeight: 0 }}
    >
      <img
        src={sortUpUrl}
        width={10}
        height={5}
        alt=""
        draggable={false}
        style={{ opacity: sortOrder === 'ascend' ? 1 : INACTIVE_OPACITY }}
      />
      <img
        src={sortDownUrl}
        width={10}
        height={5}
        alt=""
        draggable={false}
        style={{ opacity: sortOrder === 'descend' ? 1 : INACTIVE_OPACITY }}
      />
    </span>
  )
}
