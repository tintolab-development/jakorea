import noDataUrl from '../icons/assets/table-empty-no-data.svg'
import noSearchUrl from '../icons/assets/table-empty-no-search.svg'

function EmptyIconImg({ src }: { src: string }) {
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

export function AdminEmptyNoDataIcon() {
  return <EmptyIconImg src={noDataUrl} />
}

export function AdminEmptyNoSearchIcon() {
  return <EmptyIconImg src={noSearchUrl} />
}
