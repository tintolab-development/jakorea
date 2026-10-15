import { useEffect, useMemo, useState } from 'react'
import {
  EDUCATION_DIGITAL_LITERACY_HERO,
  ProgramSection,
  getEducationDigitalLiteracyPrograms,
  type DigitalLiteracyProgramId,
} from '@/features/education-digital-literacy'
import { useEducationProgramIntroView } from '@/features/education-intro/api/hooks'
import { PFButton, PFLoadingSpinner, PFTabs, PFText } from '@/shared/ui'
import styles from './page.module.css'

export function EducationDigitalLiteracyPage() {
  const { titleLines, programs, isPending, isError, refetch } = useEducationProgramIntroView({
    fieldCode: 'DIGITAL_LITERACY',
    layoutTemplates: getEducationDigitalLiteracyPrograms(),
  })
  const [activeTab, setActiveTab] = useState<DigitalLiteracyProgramId>('ai-literacy')

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
            {titleLines.map(line => (
              <span key={line} className={styles.heroTitleLine}>
                {line}
              </span>
            ))}
          </PFText>
        </header>

        {isPending ? (
          <PFLoadingSpinner centered label="프로그램 소개를 불러오는 중" />
        ) : isError ? (
          <div className={styles.status}>
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              프로그램 소개를 불러오지 못했습니다.
            </PFText>
            <PFButton variant="tertiary" size="large" onClick={refetch}>
              다시 시도
            </PFButton>
          </div>
        ) : programs.length === 0 ? (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.status}>
            등록된 프로그램이 없습니다.
          </PFText>
        ) : (
          <>
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
          </>
        )}
      </div>
    </section>
  )
}
