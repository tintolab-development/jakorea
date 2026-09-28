import { PFText } from '@/shared/ui'
import type { EntrepreneurshipProgramSection } from '../model/types'
import { PartnerBadge } from './partner-badge'
import { ProgramGallery } from './program-gallery'
import styles from './program-section.module.css'

type ProgramSectionProps = {
  section: EntrepreneurshipProgramSection
  isFirst?: boolean
}

export function ProgramSection({ section, isFirst = false }: ProgramSectionProps) {
  const headingId = `entrepreneurship-program-${section.id}-title`
  const hasProgramName = Boolean(section.programName)
  const hasPartner = Boolean(section.partnerName)
  const hasProgramDescription = Boolean(section.programDescription)
  const hasMeta = hasProgramName || hasPartner || hasProgramDescription

  return (
    <section
      id={`entrepreneurship-program-${section.id}`}
      className={[styles.section, isFirst ? styles.sectionFirst : undefined]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={headingId}
    >
      <div className={styles.header}>
        <div className={styles.titleCol}>
          <PFText as="h2" id={headingId} typo="page-title-md" color="black" className={styles.title}>
            {section.title}
          </PFText>
        </div>
        <div className={styles.descriptionCol}>
          <PFText as="p" typo="bd-lg-rg" color="black" className={styles.description}>
            {section.description}
          </PFText>
        </div>
      </div>

      <div className={styles.body}>
        <ProgramGallery variant={section.galleryVariant} images={section.images} />

        {hasMeta ? (
          <div className={styles.meta}>
            {hasProgramName || hasPartner ? (
              <div className={styles.programHead}>
                {hasProgramName ? (
                  <PFText as="h3" typo="hd-sm" color="black" className={styles.programName}>
                    {section.programName}
                  </PFText>
                ) : null}
                {hasPartner && section.partnerName ? (
                  <PartnerBadge partnerName={section.partnerName} />
                ) : null}
              </div>
            ) : null}
            {hasProgramDescription ? (
              <PFText as="p" typo="bd-lg-rg" color="black" className={styles.programDescription}>
                {section.programDescription}
              </PFText>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
