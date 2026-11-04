import type { RefObject } from 'react'
import { Spin } from 'antd'
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
        <div className="admin-infinite-table-footer__status" role="status" aria-label="로딩 중">
          <Spin size="small" />
        </div>
      ) : null}
    </>
  )
}
