import { useState } from 'react'
import {
  DEFAULT_EDUCATION_CAREER_TAB,
  EDUCATION_CAREER_HERO,
  EDUCATION_CAREER_TAB_ITEMS,
  ProgramSection,
  getEducationCareerPrograms,
  type CareerProgramId,
} from '@/features/education-career'
import { PFTabs, PFText } from '@/shared/ui'
import styles from './page.module.css'

export function EducationCareerPage() {
  const [activeTab, setActiveTab] = useState<CareerProgramId>(DEFAULT_EDUCATION_CAREER_TAB)
  const programs = getEducationCareerPrograms()

  const handleTabChange = (key: string) => {
    const next = key as CareerProgramId
    setActiveTab(next)
    const target = document.getElementById(`career-program-${next}`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageBackground} aria-hidden="true" />

      <div className={styles.content}>
        <header className={styles.hero}>
          <PFText as="span" typo="hl-lg" color="primary-700" className={styles.heroLabel}>
            {EDUCATION_CAREER_HERO.label}
          </PFText>
          <PFText as="h1" typo="page-title-md" color="black" className={styles.heroTitle}>
            {EDUCATION_CAREER_HERO.titleLines.map(line => (
              <span key={line} className={styles.heroTitleLine}>
                {line}
              </span>
            ))}
          </PFText>
        </header>

        <div className={styles.tabs}>
          <PFTabs
            items={EDUCATION_CAREER_TAB_ITEMS}
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
