import { PFLoadingSpinner } from '../pf-loading-spinner/pf-loading-spinner'
import styles from './public-content-page-loading.module.css'

type PublicContentPageLoadingProps = {
  label: string
  className?: string
}

/** Homepage Admin 공개 API 로딩 — 본문 문구 대신 헤더·푸터 사이 중앙 스피너 */
export function PublicContentPageLoading({ label, className }: PublicContentPageLoadingProps) {
  const rootClassName = [styles.pageFill, className].filter(Boolean).join(' ')
  return (
    <div className={rootClassName}>
      <PFLoadingSpinner centered label={label} />
    </div>
  )
}
