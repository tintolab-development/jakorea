import { useEffect, useMemo, useState } from 'react'
import {
  EDUCATION_ENTREPRENEURSHIP_HERO,
  ProgramSection,
  getEducationEntrepreneurshipPrograms,
  type EntrepreneurshipProgramId,
} from '@/features/education-entrepreneurship'
import { useEducationProgramIntroView } from '@/features/education-intro/api/hooks'
import {
  PFButton,
  PFTabs,
  PFText,
  PublicContentPageLoading,
  PublicContentPageStatus,
} from '@/shared/ui'
import styles from './page.module.css'

export function EducationEntrepreneurshipPage() {
  const { titleLines, programs, isPending, isError, refetch } = useEducationProgramIntroView({
    fieldCode: 'ENTREPRENEURSHIP',
    layoutTemplates: getEducationEntrepreneurshipPrograms(),
  })
  const [activeTab, setActiveTab] = useState<EntrepreneurshipProgramId>('startup')

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
    const next = key as EntrepreneurshipProgramId
    setActiveTab(next)
    const target = document.getElementById(`entrepreneurship-program-${next}`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (isPending) {
    return (
      <section className={styles.page}>
        <PublicContentPageLoading label="프로그램 소개를 불러오는 중" />
      </section>
    )
  }

  if (isError) {
    return (
      <section className={styles.page}>
        <div className={styles.pageBackground} aria-hidden="true" />
        <PublicContentPageStatus>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            프로그램 소개를 불러오지 못했습니다.
          </PFText>
          <PFButton variant="tertiary" size="large" onClick={refetch}>
            다시 시도
          </PFButton>
        </PublicContentPageStatus>
      </section>
    )
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
            {titleLines.map(line => (
              <span key={line} className={styles.heroTitleLine}>
                {line}
              </span>
            ))}
          </PFText>
        </header>

        {programs.length === 0 ? (
          <PublicContentPageStatus layout="inline">
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              등록된 프로그램이 없습니다.
            </PFText>
          </PublicContentPageStatus>
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
