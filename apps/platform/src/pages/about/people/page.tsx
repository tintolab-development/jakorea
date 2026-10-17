import {
  MemberSection,
  PEOPLE_HERO_LABEL,
  PEOPLE_HERO_TITLE,
  usePublicPeople,
} from '@/features/people'
import { PFButton, PFDivider, PFLoadingSpinner, PFText } from '@/shared/ui'
import styles from './page.module.css'

export function PeoplePage() {
  const { view, isPending, isError, refetch } = usePublicPeople()
  const title = view?.title || PEOPLE_HERO_TITLE

  return (
    <section className={styles.page}>
      <div className={styles.pageBackground} aria-hidden="true" />

      <div className={styles.content}>
        <header className={styles.hero}>
          <PFText as="span" typo="hl-lg" color="primary-700" className={styles.heroLabel}>
            {PEOPLE_HERO_LABEL}
          </PFText>
          <PFText as="h1" typo="page-title-md" color="black" className={styles.heroTitle}>
            {title}
          </PFText>
        </header>

        {isPending ? (
          <PFLoadingSpinner centered label="함께하는 사람들 정보를 불러오는 중" />
        ) : isError ? (
          <div className={styles.status}>
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              함께하는 사람들 정보를 불러오지 못했습니다.
            </PFText>
            <PFButton variant="tertiary" size="large" onClick={refetch}>
              다시 시도
            </PFButton>
          </div>
        ) : view == null ? (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.status}>
            등록된 정보가 없습니다.
          </PFText>
        ) : (
          <>
            {view.imageUrl ? (
              <div className={styles.orgBlock}>
                <div className={styles.orgCard}>
                  <img className={styles.orgImage} src={view.imageUrl} alt="JA Korea 조직도" />
                </div>
              </div>
            ) : null}

            <div className={styles.memberList}>
              {view.sections.map((section, index) => (
                <div
                  key={section.id}
                  className={
                    index === 0 ? styles.memberSectionBlock : styles.memberSectionBlockSpaced
                  }
                >
                  <PFDivider className={styles.rankDivider} />
                  <MemberSection section={section} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
