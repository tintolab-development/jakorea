import type { ReactNode } from 'react'
import styles from './list-toolbar.module.css'

type ListToolbarProps = {
  title: ReactNode
  sort?: ReactNode
}

export function ListToolbar({ title, sort }: ListToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.title}>{title}</div>
      {sort ? <div className={styles.sort}>{sort}</div> : null}
    </div>
  )
}
