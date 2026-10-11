import noDataUrl from '@/shared/assets/icons/table/table-empty-no-data.svg'
import noSearchUrl from '@/shared/assets/icons/table/table-empty-no-search.svg'

function CmsTableEmptyIconImg({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      width={40}
      height={40}
      decoding="async"
      draggable={false}
      aria-hidden
    />
  )
}

/** 등록 데이터 없음 */
export function CmsTableEmptyNoDataIcon() {
  return <CmsTableEmptyIconImg src={noDataUrl} />
}

/** 검색 결과 없음 */
export function CmsTableEmptyNoSearchIcon() {
  return <CmsTableEmptyIconImg src={noSearchUrl} />
}
