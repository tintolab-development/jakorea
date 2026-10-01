import styles from './skeleton-block.module.css'

type SkeletonBlockProps = {
  className?: string
}

/** 홈 로딩 자리 표시. 크기는 호출부 className이 정한다. */
export function SkeletonBlock({ className }: SkeletonBlockProps) {
  const blockClassName = [styles.block, className].filter(Boolean).join(' ')
  return <span className={blockClassName} />
}
