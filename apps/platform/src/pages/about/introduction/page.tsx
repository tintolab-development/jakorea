import {
  AchievementSection,
  BrandIdentitySection,
  IntroductionScroll,
  usePublicOrganization,
} from '@/features/introduction'
import { PFButton, PFText, PublicContentPageLoading, PublicContentPageStatus } from '@/shared/ui'
import styles from './page.module.css'

export function IntroductionPage() {
  const { view, isPending, isError, refetch } = usePublicOrganization()

  if (isPending) {
    return (
      <div className={styles.page}>
        <PublicContentPageLoading label="기관소개 정보를 불러오는 중" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className={styles.page}>
        <PublicContentPageStatus>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            기관소개 정보를 불러오지 못했습니다.
          </PFText>
          <PFButton variant="tertiary" size="large" onClick={refetch}>
            다시 시도
          </PFButton>
        </PublicContentPageStatus>
      </div>
    )
  }

  if (view == null) {
    return (
      <div className={styles.page}>
        <PublicContentPageStatus>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            등록된 정보가 없습니다.
          </PFText>
        </PublicContentPageStatus>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <IntroductionScroll view={view} />
      <AchievementSection
        historyByYear={view.historyByYear}
        awards={view.awards}
        certifications={view.certifications}
      />
      <BrandIdentitySection bi={view.bi} />
    </div>
  )
}
