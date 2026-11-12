/** 표 빈 화면 그림 — 시안 `Icon / Etc / Error / Empty` 80 원본(연한 민트 원 배경 포함) */
import noDataUrl from '../icons/assets/table-empty-no-data.svg'
import noSearchUrl from '../icons/assets/table-empty-no-search.svg'

function EmptyIconImg({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      width={80}
      height={80}
      decoding="async"
      draggable={false}
      aria-hidden
    />
  )
}

export function AdminEmptyNoDataIcon() {
  return <EmptyIconImg src={noDataUrl} />
}

export function AdminEmptyNoSearchIcon() {
  return <EmptyIconImg src={noSearchUrl} />
}
