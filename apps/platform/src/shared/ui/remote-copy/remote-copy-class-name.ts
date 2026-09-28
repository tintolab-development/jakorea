import styles from './remote-copy.module.css'

/** 공개 API 카피 로딩 중 opacity로 점프감을 줄인다. */
export function remoteCopyClassName(isPending: boolean): string {
  return isPending ? `${styles.remoteCopy} ${styles.remoteCopyBusy}` : styles.remoteCopy
}
