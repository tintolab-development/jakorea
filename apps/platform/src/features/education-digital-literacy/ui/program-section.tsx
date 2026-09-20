import { PFText } from '@/shared/ui'
import type { DigitalLiteracyProgramSection } from '../model/types'
import { PartnerBadge } from './partner-badge'
import { ProgramGallery } from './program-gallery'
import styles from './program-section.module.css'

type ProgramSectionProps = {
  section: DigitalLiteracyProgramSection
  isFirst?: boolean
}

export function ProgramSection({ section, isFirst = false }: ProgramSectionProps) {
  const headingId = `digital-literacy-program-${section.id}-title`

  return (
    <section
      id={`digital-literacy-program-${section.id}`}
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

        <div className={styles.meta}>
          <div className={styles.programHead}>
            <PFText as="h3" typo="hd-sm" color="black" className={styles.programName}>
              {section.programName}
            </PFText>
            <PartnerBadge partnerName={section.partnerName} />
          </div>
          <PFText as="p" typo="bd-lg-rg" color="black" className={styles.programDescription}>
            {section.programDescription}
          </PFText>
        </div>
      </div>
    </section>
  )
}
