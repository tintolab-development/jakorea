import { PFText } from '@/shared/ui'
import type { ProgramDetail } from '../../model/types'
import styles from './program-info-body.module.css'

type ProgramInfoPeriodSponsorProps = {
  program: Pick<ProgramDetail, 'operatingPeriodLabel' | 'sponsor'>
  className?: string
}

function isPresent(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed !== '-'
}

export function ProgramInfoPeriodSponsor({
  program,
  className,
}: ProgramInfoPeriodSponsorProps) {
  const operatingPeriodLabel = program.operatingPeriodLabel.trim()
  const sponsor = program.sponsor.trim()
  const hasPeriod = isPresent(operatingPeriodLabel)
  const hasSponsor = isPresent(sponsor)

  if (!hasPeriod && !hasSponsor) {
    return null
  }

  const rootClassName = [styles.periodSponsor, className].filter(Boolean).join(' ')

  return (
    <div className={rootClassName}>
      {hasPeriod ? (
        <div className={styles.periodSponsorItem}>
          <PFText as="span" typo="bd-lg-rg" color="neutral-cool-600">
            프로그램 운영 기간
          </PFText>
          <PFText as="span" typo="hl-sm" color="black">
            {operatingPeriodLabel}
          </PFText>
        </div>
      ) : null}
      {hasSponsor ? (
        <div className={styles.periodSponsorItem}>
          <PFText as="span" typo="bd-lg-rg" color="neutral-cool-600">
            후원사
          </PFText>
          <PFText as="span" typo="hl-sm" color="black">
            {sponsor}
          </PFText>
        </div>
      ) : null}
    </div>
  )
}
