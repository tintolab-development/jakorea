import type { RefObject } from 'react'
import './admin-infinite-table-footer.css'

export function AdminInfiniteTableFooter({
  sentinelRef,
  isFetchingNextPage,
}: {
  sentinelRef: RefObject<HTMLDivElement | null>
  isFetchingNextPage: boolean
}) {
  return (
    <>
      <div ref={sentinelRef} className="admin-infinite-table-footer__sentinel" aria-hidden />
      {isFetchingNextPage ? (
        <p className="admin-infinite-table-footer__status" role="status">
          더 불러오는 중…
        </p>
      ) : null}
    </>
  )
}
