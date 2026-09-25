import { Fragment } from 'react'
import { PFText, remoteCopyClassName } from '@/shared/ui'
import { usePublicCorporateSponsorshipView } from '../api/hooks'
import {
  PROCESS_SECTION_TITLE_LINES,
  type ProcessStep,
} from '../lib/constants'
import styles from './process-section.module.css'

function ProcessStepItem({ step }: { step: ProcessStep }) {
  const hasLeadIn = step.number === 1 || step.number === 4
  const isProcessEnd = step.number === 6
  const isRowTrail = step.number === 3

  return (
    <li className={styles.item}>
      {hasLeadIn ? (
        <span className={styles.connectorLeadIn} aria-hidden="true">
          <span className={styles.connectorLeadInLine} />
        </span>
      ) : null}

      <div className={styles.stepLead}>
        <span className={styles.badge}>{step.number}</span>
        <span
          className={[
            styles.connector,
            isProcessEnd ? styles.connectorFade : undefined,
            isRowTrail ? styles.connectorTrail : undefined,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden="true"
        >
          <span className={styles.connectorLine} />
        </span>
      </div>

      <div className={styles.stepBody}>
        <PFText as="h3" typo="hd-sm" color="black" className={styles.stepTitle}>
          {step.title}
        </PFText>
        <ul className={styles.descriptionList}>
          {step.descriptions.map(line => (
            <li key={line} className={styles.descriptionItem}>
              <PFText as="span" typo="bd-lg-rg" color="black" className={styles.descriptionText}>
                {line}
              </PFText>
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}

export function ProcessSection() {
  const { processSteps, isPending } = usePublicCorporateSponsorshipView()
  const copyClass = remoteCopyClassName(isPending)

  return (
    <section
      className={styles.section}
      aria-labelledby="corporate-donation-process-title"
      aria-busy={isPending || undefined}
    >
      <div className={[styles.content, copyClass].join(' ')}>
        <PFText
          as="h2"
          id="corporate-donation-process-title"
          typo="page-title-sm"
          color="black"
          className={styles.title}
        >
          {PROCESS_SECTION_TITLE_LINES.map((line, index) => (
            <Fragment key={line}>
              {index > 0 ? <br /> : null}
              {line}
            </Fragment>
          ))}
        </PFText>

        <ol className={styles.list}>
          {processSteps.map(step => (
            <ProcessStepItem key={step.number} step={step} />
          ))}
        </ol>
      </div>
    </section>
  )
}
