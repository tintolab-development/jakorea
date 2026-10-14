import illustQuotationUrl from '@/shared/assets/illustration/illust-quotation-no-bg.svg'
import { PFText } from '@/shared/ui'
import { STUDENT_DOCUMENTS_UNSUPPORTED_MESSAGE } from '../lib/student-documents-policy'
import styles from './students-panel.module.css'

export function StudentsPanelUnsupported() {
  return (
    <div className={styles.unsupportedShell} role="status">
      <div className={styles.contentBoxEmpty}>
        <div className={styles.emptyContent}>
          <img
            className={styles.illustration}
            src={illustQuotationUrl}
            alt=""
            width={100}
            height={100}
            aria-hidden="true"
          />
          <PFText as="p" typo="hl-lg" color="black" className={styles.emptyTitle}>
            {STUDENT_DOCUMENTS_UNSUPPORTED_MESSAGE}
          </PFText>
        </div>
      </div>
    </div>
  )
}
