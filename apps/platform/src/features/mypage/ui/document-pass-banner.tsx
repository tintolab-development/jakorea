import type { EducationDisplayStatus } from '../model/education-application-types'
import { PFText } from '@/shared/ui'
import styles from './document-pass-banner.module.css'

type DocumentPassBannerProps = {
  interviewAtLabel: string
}

export function DocumentPassBanner({ interviewAtLabel }: DocumentPassBannerProps) {
  return (
    <div className={styles.banner} role="status">
      <PFText as="p" typo="bd-md-sb" color="black" className={styles.title}>
        서류 합격
      </PFText>
      <PFText as="p" typo="bd-md-rg" color="black" className={styles.body}>
        2차 면접일 안내 · {interviewAtLabel}
      </PFText>
    </div>
  )
}

export function shouldShowDocumentPassBanner(input: {
  displayStatus: EducationDisplayStatus
  hasInterview?: boolean
  interviewAtLabel?: string
}): boolean {
  return (
    input.displayStatus === 'document_passed' &&
    Boolean(input.hasInterview) &&
    Boolean(input.interviewAtLabel?.trim())
  )
}
