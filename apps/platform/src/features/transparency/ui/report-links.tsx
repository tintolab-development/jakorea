import { useNavigate } from 'react-router-dom'
import { ANALYTICS_CLICK_METRICS, recordMetric } from '@/features/analytics'
import { PFButton } from '@/shared/ui'
import arrowDiagonalBlack24Url from '@/shared/assets/icons/arrow-outlink-black-24.svg'
import {
  TRANSPARENCY_ANNUAL_REPORTS_PATH,
  TRANSPARENCY_AUDIT_REPORTS_PATH,
} from '../lib/constants'
import styles from './report-links.module.css'

type ReportLinksProps = {
  /** 국세청 공시 외부 URL — 없으면 버튼은 비활성 */
  disclosureUrl?: string
}

/**
 * 보고서 액션 — 연차·회계감사 내부 이동, 국세청 공시는 disclosureUrl.
 */
export function ReportLinks({ disclosureUrl }: ReportLinksProps) {
  const navigate = useNavigate()
  const ntsUrl = disclosureUrl?.trim() ?? ''

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
      <PFButton
        size="xlarge"
        variant="tertiary"
        className={styles.ntsButton}
        disabled={!ntsUrl}
        onClick={() => {
          if (!ntsUrl) return
          recordMetric(ANALYTICS_CLICK_METRICS.disclosureOutbound)
          window.open(ntsUrl, '_blank', 'noopener,noreferrer')
        }}
      >
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
