import {
  getMockProgramById,
  getProgramIdFromPath,
  ProgramBackButton,
  programApplyPath,
  programApplyRequiredPath,
  PROGRAMS_PATH,
} from '@/features/program'
import { getDevAuthLoggedIn } from '@/shared/lib'
import { PFButton, PFText } from '@/shared/ui'
import styles from './page.module.css'

export function ProgramDetailPage() {
  const programId = getProgramIdFromPath()
  const program = programId ? getMockProgramById(programId) : undefined
  const searchParams = new URLSearchParams(window.location.search)
  const fromPath = searchParams.get('from')

  if (!program) {
    return (
      <section className={styles.page}>
        <PFText as="p" typo="hd-md" color="black">
          프로그램을 찾을 수 없어요
        </PFText>
        <PFButton variant="secondary" onClick={() => window.location.assign(PROGRAMS_PATH)}>
          목록으로
        </PFButton>
      </section>
    )
  }

  const handleBackToList = () => {
    window.location.assign(fromPath ?? PROGRAMS_PATH)
  }

  const handleApply = () => {
    const applyPath = programApplyPath(program.id)
    if (!getDevAuthLoggedIn()) {
      window.location.assign(programApplyRequiredPath(program.id))
      return
    }

    window.location.assign(applyPath)
  }

  return (
    <section className={styles.page}>
      <div className={styles.back}>
        <ProgramBackButton label="목록으로" onClick={handleBackToList} />
      </div>

      <div className={styles.layout}>
        <article className={styles.main}>
          <PFText as="span" typo="label-md" color="primary-500">
            {program.categoryLabel}
          </PFText>
          <PFText as="h1" typo="page-title" color="black" className={styles.title}>
            {program.title}
          </PFText>

          <div className={styles.meta}>
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              운영기간 {program.operatingPeriodLabel}
            </PFText>
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              후원 {program.sponsor}
            </PFText>
          </div>

          <div className={styles.tags}>
            {program.statusTags.map(tag => (
              <span className={styles.tag} key={tag}>
                <PFText as="span" typo="caption-rg" color="neutral-cool-600">
                  {tag}
                </PFText>
              </span>
            ))}
          </div>

          <section className={styles.section}>
            <PFText as="h2" typo="hl-sm" color="black">
              요약
            </PFText>
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              {program.summary}
            </PFText>
          </section>

          <section className={styles.section}>
            <PFText as="h2" typo="hl-sm" color="black">
              기본정보
            </PFText>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <PFText as="span" typo="label-md" color="neutral-cool-500">
                  모집기간
                </PFText>
                <PFText as="span" typo="bd-md-sb" color="black">
                  {program.recruitmentPeriodLabel}
                </PFText>
              </div>
              <div className={styles.infoItem}>
                <PFText as="span" typo="label-md" color="neutral-cool-500">
                  신청기간
                </PFText>
                <PFText as="span" typo="bd-md-sb" color="black">
                  {program.applicationPeriodLabel}
                </PFText>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <PFText as="h2" typo="hl-sm" color="black">
              세부내용
            </PFText>
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              프로그램 상세 안내 콘텐츠가 이 영역에 표시됩니다.
            </PFText>
          </section>
        </article>

        <aside className={styles.sidebar}>
          <div className={styles.banner}>
            <img className={styles.bannerImage} src={program.thumbnailUrl} alt="" />
          </div>
          <PFButton
            size="xlarge"
            width="100%"
            disabled={!program.isRecruiting}
            onClick={handleApply}
          >
            신청하기
          </PFButton>
          <PFText as="p" typo="caption-rg" color="neutral-cool-500" className={styles.applyPeriod}>
            신청기간 {program.applicationPeriodLabel}
          </PFText>
        </aside>
      </div>
    </section>
  )
}
