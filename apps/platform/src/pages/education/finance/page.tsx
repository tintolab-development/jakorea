import { useState } from 'react'
import {
  DEFAULT_EDUCATION_FINANCE_TAB,
  EDUCATION_FINANCE_HERO,
  EDUCATION_FINANCE_TAB_ITEMS,
  ProgramSection,
  getEducationFinancePrograms,
  type FinanceProgramId,
} from '@/features/education-finance'
import { PFTabs, PFText } from '@/shared/ui'
import styles from './page.module.css'

export function EducationFinancePage() {
  const [activeTab, setActiveTab] = useState<FinanceProgramId>(DEFAULT_EDUCATION_FINANCE_TAB)
  const programs = getEducationFinancePrograms()

  const handleTabChange = (key: string) => {
    const next = key as FinanceProgramId
    setActiveTab(next)
    const target = document.getElementById(`finance-program-${next}`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageBackground} aria-hidden="true" />

      <div className={styles.content}>
        <header className={styles.hero}>
          <PFText as="span" typo="hl-lg" color="primary-700" className={styles.heroLabel}>
            {EDUCATION_FINANCE_HERO.label}
          </PFText>
          <PFText as="h1" typo="page-title-md" color="black" className={styles.heroTitle}>
            {EDUCATION_FINANCE_HERO.titleLines.map(line => (
              <span key={line} className={styles.heroTitleLine}>
                {line}
              </span>
            ))}
          </PFText>
        </header>

        <div className={styles.tabs}>
          <PFTabs
            items={EDUCATION_FINANCE_TAB_ITEMS}
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
