import type { ReactNode } from 'react'
import { FilterBar } from './filter-bar'
import { ListToolbar } from './list-toolbar'
import styles from './search-list-layout.module.css'

export type SearchListLayoutProps = {
  search: ReactNode
  filters?: ReactNode
  onFilterReset?: () => void
  toolbarTitle: ReactNode
  sort?: ReactNode
  children: ReactNode
  pagination?: ReactNode
  className?: string
}

export function SearchListLayout({
  search,
  filters,
  onFilterReset,
  toolbarTitle,
  sort,
  children,
  pagination,
  className,
}: SearchListLayoutProps) {
  const rootClassName = [styles.root, className].filter(Boolean).join(' ')

  return (
    <section className={rootClassName}>
      <div className={styles.search}>{search}</div>

      {filters ? (
        <div className={styles.filters}>
          <FilterBar onReset={onFilterReset}>{filters}</FilterBar>
        </div>
      ) : null}

      <div className={styles.toolbar}>
        <ListToolbar title={toolbarTitle} sort={sort} />
      </div>

      <div className={styles.list}>{children}</div>

      {pagination ? <div className={styles.pagination}>{pagination}</div> : null}
    </section>
  )
}
