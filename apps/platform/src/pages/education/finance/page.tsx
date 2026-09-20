import { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_EDUCATION_FINANCE_TAB,
  EDUCATION_FINANCE_HERO,
  ProgramSection,
  getEducationFinancePrograms,
  type FinanceProgramId,
} from '@/features/education-finance'
import { useEducationProgramIntroView } from '@/features/education-intro/api/hooks'
import { PFTabs, PFText } from '@/shared/ui'
import styles from './page.module.css'

export function EducationFinancePage() {
  const { titleLines, programs } = useEducationProgramIntroView({
    fieldCode: 'ECONOMICS_FINANCE',
    fallbackTitleLines: EDUCATION_FINANCE_HERO.titleLines,
    fallbackPrograms: getEducationFinancePrograms(),
  })
  const [activeTab, setActiveTab] = useState<FinanceProgramId>(DEFAULT_EDUCATION_FINANCE_TAB)

  useEffect(() => {
    if (programs.some(section => section.id === activeTab)) return
    const first = programs[0]?.id
    if (first) setActiveTab(first)
  }, [activeTab, programs])

  const tabItems = useMemo(
    () => programs.map(section => ({ key: section.id, label: section.title })),
    [programs],
  )

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
            {titleLines.map(line => (
              <span key={line} className={styles.heroTitleLine}>
                {line}
              </span>
            ))}
          </PFText>
        </header>

        <div className={styles.tabs}>
          <PFTabs
            items={tabItems}
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
