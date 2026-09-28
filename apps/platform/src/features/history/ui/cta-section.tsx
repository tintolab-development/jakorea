import { useNavigate } from 'react-router-dom'
import { PFButton, PFText } from '@/shared/ui'
import type { HistoryPageView } from '../model/view'
import { PreservedLines } from './preserved-lines'
import styles from './cta-section.module.css'

type CtaSectionProps = {
  cta: HistoryPageView['cta']
}

function openHref(href: string, navigate: ReturnType<typeof useNavigate>) {
  if (!href) return
  if (href.startsWith('/') && !href.startsWith('//')) {
    navigate(href)
    return
  }
  window.location.assign(href)
}

export function CtaSection({ cta }: CtaSectionProps) {
  const navigate = useNavigate()

  return (
    <section className={styles.section} aria-labelledby="history-cta-title">
      <div className={styles.copy}>
        <PFText as="h2" id="history-cta-title" typo="page-title-sm" color="black" className={styles.title}>
          <PreservedLines text={cta.title} />
        </PFText>
        <PFText as="p" typo="bd-lg-rg" color="neutral-cool-700" className={styles.body}>
          <PreservedLines text={cta.body} />
        </PFText>
      </div>

      <div className={styles.media}>
        {cta.image.url ? (
          <img className={styles.photo} src={cta.image.url} alt={cta.image.alt} />
        ) : (
          <div className={styles.photo} role="img" aria-label={cta.image.alt || undefined} />
        )}
      </div>

      <div className={styles.actions}>
        <PFButton
          size="xlarge"
          variant="primary"
          className={styles.button}
          onClick={() => openHref(cta.primaryHref, navigate)}
        >
          {cta.primaryLabel}
        </PFButton>
        <PFButton
          size="xlarge"
          variant="secondary"
          className={styles.button}
          onClick={() => openHref(cta.secondaryHref, navigate)}
        >
          {cta.secondaryLabel}
        </PFButton>
      </div>
    </section>
  )
}
