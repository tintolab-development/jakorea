import type { EducationDisplayStatus } from '../model/types'
import peopleIconUrl from '../assets/icon/people.svg'
import educationStatusBgUrl from '../assets/image/education-status-bg-gradient.svg'
import { PFText } from '@/shared/ui'
import styles from './document-pass-banner.module.css'

type DocumentPassBannerProps = {
  interviewAtLabel?: string
}

const DOCUMENT_PASS_BANNER_BODY_PENDING_INTERVIEW =
  '2차 면접 일정이 배정되면 안내드립니다.\n면접 진행 전 공지사항을 확인해 주세요.'

export function DocumentPassBanner({ interviewAtLabel }: DocumentPassBannerProps) {
  const scheduleLabel = interviewAtLabel?.trim()
  const body = scheduleLabel
    ? `2차 면접은 ${scheduleLabel}에 온라인으로 진행됩니다.\n면접 진행 전 공지사항을 확인해 주세요.`
    : DOCUMENT_PASS_BANNER_BODY_PENDING_INTERVIEW

  return (
    <div className={styles.banner} role="status">
      <img className={styles.bg} src={educationStatusBgUrl} alt="" aria-hidden="true" />
      <div className={styles.headline}>
        <img className={styles.icon} src={peopleIconUrl} alt="" aria-hidden="true" />
        <PFText as="p" typo="hd-sm" color="white" className={styles.title}>
          서류 합격을 축하해요!
        </PFText>
      </div>
      <PFText as="p" typo="bd-lg-rg" color="white" className={styles.body}>
        {body}
      </PFText>
    </div>
  )
}

export function shouldShowDocumentPassBanner(input: {
  displayStatus: EducationDisplayStatus
  hasInterview?: boolean
  interviewAtLabel?: string
}): boolean {
  return input.displayStatus === 'document_passed' && Boolean(input.hasInterview)
}
