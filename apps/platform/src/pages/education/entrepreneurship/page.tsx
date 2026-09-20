import { useState } from 'react'
import {
  DEFAULT_EDUCATION_ENTREPRENEURSHIP_TAB,
  EDUCATION_ENTREPRENEURSHIP_HERO,
  EDUCATION_ENTREPRENEURSHIP_TAB_ITEMS,
  ProgramSection,
  getEducationEntrepreneurshipPrograms,
  type EntrepreneurshipProgramId,
} from '@/features/education-entrepreneurship'
import { PFTabs, PFText } from '@/shared/ui'
import styles from './page.module.css'

export function EducationEntrepreneurshipPage() {
  const [activeTab, setActiveTab] = useState<EntrepreneurshipProgramId>(
    DEFAULT_EDUCATION_ENTREPRENEURSHIP_TAB,
  )
  const programs = getEducationEntrepreneurshipPrograms()

  const handleTabChange = (key: string) => {
    const next = key as EntrepreneurshipProgramId
    setActiveTab(next)
    const target = document.getElementById(`entrepreneurship-program-${next}`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageBackground} aria-hidden="true" />

      <div className={styles.content}>
        <header className={styles.hero}>
          <PFText as="span" typo="hl-lg" color="primary-700" className={styles.heroLabel}>
            {EDUCATION_ENTREPRENEURSHIP_HERO.label}
          </PFText>
          <PFText as="h1" typo="page-title-md" color="black" className={styles.heroTitle}>
            {EDUCATION_ENTREPRENEURSHIP_HERO.titleLines.map(line => (
              <span key={line} className={styles.heroTitleLine}>
                {line}
              </span>
            ))}
          </PFText>
        </header>

        <div className={styles.tabs}>
          <PFTabs
            items={EDUCATION_ENTREPRENEURSHIP_TAB_ITEMS}
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
