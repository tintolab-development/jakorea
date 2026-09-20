import { useState } from 'react'
import {
  DEFAULT_EDUCATION_DIGITAL_LITERACY_TAB,
  EDUCATION_DIGITAL_LITERACY_HERO,
  EDUCATION_DIGITAL_LITERACY_TAB_ITEMS,
  ProgramSection,
  getEducationDigitalLiteracyPrograms,
  type DigitalLiteracyProgramId,
} from '@/features/education-digital-literacy'
import { PFTabs, PFText } from '@/shared/ui'
import styles from './page.module.css'

export function EducationDigitalLiteracyPage() {
  const [activeTab, setActiveTab] = useState<DigitalLiteracyProgramId>(
    DEFAULT_EDUCATION_DIGITAL_LITERACY_TAB,
  )
  const programs = getEducationDigitalLiteracyPrograms()

  const handleTabChange = (key: string) => {
    const next = key as DigitalLiteracyProgramId
    setActiveTab(next)
    const target = document.getElementById(`digital-literacy-program-${next}`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageBackground} aria-hidden="true" />

      <div className={styles.content}>
        <header className={styles.hero}>
          <PFText as="span" typo="hl-lg" color="primary-700" className={styles.heroLabel}>
            {EDUCATION_DIGITAL_LITERACY_HERO.label}
          </PFText>
          <PFText as="h1" typo="page-title-md" color="black" className={styles.heroTitle}>
            {EDUCATION_DIGITAL_LITERACY_HERO.titleLines.map(line => (
              <span key={line} className={styles.heroTitleLine}>
                {line}
              </span>
            ))}
          </PFText>
        </header>

        <div className={styles.tabs}>
          <PFTabs
            items={EDUCATION_DIGITAL_LITERACY_TAB_ITEMS}
            value={activeTab}
            onChange={handleTabChange}
            variant="category"
            className={styles.programTabs}
            ariaLabel="프로그램 유형"
          />
        </div>

        {programs.map((section, index) => (
          <ProgramSection key={section.id} section={section} isFirst={index === 0} />
        ))}
      </div>
    </section>
  )
}
