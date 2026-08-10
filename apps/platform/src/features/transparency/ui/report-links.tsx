import { PFButton } from '@/shared/ui'
import styles from './report-links.module.css'

/**
 * 보고서 액션 — 링크 대상(파일 다운로드·국세청 공시 외부 링크)은 추후 연결.
 */
export function ReportLinks() {
  return (
    <div className={styles.actions}>
      <PFButton size="xlarge" variant="primary">
        연차보고서
      </PFButton>
      <PFButton size="xlarge" variant="primary">
        회계감사 보고서
      </PFButton>
      <PFButton size="xlarge" variant="tertiary">
        국세청 공시 가기
      </PFButton>
    </div>
  )
}
