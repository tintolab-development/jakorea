import type { ComponentProps } from 'react'
import styles from './instructor-apply-pending-title.module.css'
import { PFText } from '@/shared/ui'

type StatusColor = ComponentProps<typeof PFText>['color']

export type InstructorApplyStatusTitleProps = {
  statusLabel: string
  statusColor?: StatusColor
}

export function InstructorApplyStatusTitle({
  statusLabel,
  statusColor = 'primary-500',
}: InstructorApplyStatusTitleProps) {
  return (
    <header className={styles.titleRow}>
      <PFText as="span" typo="hd-lg" color="black">
        강사 신청
      </PFText>
      <span className={styles.titleDivider} aria-hidden />
      <PFText as="span" typo="hd-lg" color={statusColor}>
        {statusLabel}
      </PFText>
    </header>
  )
}

export function InstructorApplyPendingTitle() {
  return <InstructorApplyStatusTitle statusLabel="승인 대기 중" statusColor="primary-500" />
}

export function InstructorApplyRejectedTitle() {
  return <InstructorApplyStatusTitle statusLabel="신청 반려" statusColor="error" />
}
