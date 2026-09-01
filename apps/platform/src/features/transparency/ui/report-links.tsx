import { useNavigate } from 'react-router-dom'
import { PFButton } from '@/shared/ui'
import arrowDiagonalBlack24Url from '../image/icon/arrow-diagonal-black-24.svg'
import {
  TRANSPARENCY_ANNUAL_REPORTS_PATH,
  TRANSPARENCY_AUDIT_REPORTS_PATH,
} from '../lib/constants'
import styles from './report-links.module.css'

/**
 * 보고서 액션 — 국세청 공시 외부 링크는 추후 연결.
 */
export function ReportLinks() {
  const navigate = useNavigate()

  return (
    <div className={styles.actions}>
      <PFButton
        size="xlarge"
        variant="primary"
        className={styles.reportButton}
        onClick={() => navigate(TRANSPARENCY_ANNUAL_REPORTS_PATH)}
      >
        연차보고서
      </PFButton>
      <PFButton
        size="xlarge"
        variant="primary"
        className={styles.reportButton}
        onClick={() => navigate(TRANSPARENCY_AUDIT_REPORTS_PATH)}
      >
        회계감사 보고서
      </PFButton>
      <PFButton size="xlarge" variant="tertiary" className={styles.ntsButton}>
        <span className={styles.ntsLabel}>국세청 공시</span>
        <img
          className={styles.ntsIcon}
          src={arrowDiagonalBlack24Url}
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
        />
      </PFButton>
    </div>
  )
}
