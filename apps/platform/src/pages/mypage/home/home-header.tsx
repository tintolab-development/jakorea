import { mypageSettingsIconUrl } from '@/widgets/mypage-layout'
import { PFText } from '@/shared/ui'
import styles from './home-header.module.css'

export type MypageHomeHeaderProps = {
  displayName: string
  isInstructor: boolean
  affiliationLabel?: string
  employmentStatusLabel?: string
}

export function MypageHomeHeader({
  displayName,
  isInstructor,
  affiliationLabel,
  employmentStatusLabel,
}: MypageHomeHeaderProps) {
  return (
    <header className={styles.header}>
      {isInstructor ? (
        <div className={styles.instructorIdentity}>
          {affiliationLabel ? (
            <PFText as="p" typo="bd-sm-md" color="black" className={styles.affiliation}>
              {affiliationLabel}
            </PFText>
          ) : null}
          <div className={styles.nameRow}>
            <PFText as="h1" typo="page-title" color="black" className={styles.instructorTitle}>
              <span>{displayName}</span>
              <span className={styles.instructorHonorific}> 강사님</span>
            </PFText>
            {employmentStatusLabel ? (
              <span className={styles.employmentBadge}>{employmentStatusLabel}</span>
            ) : null}
          </div>
        </div>
      ) : (
        <PFText as="h1" typo="page-title" color="black">
          {displayName}님
        </PFText>
      )}
      <button className={styles.settingsButton} type="button" disabled aria-disabled="true">
        <img
          className={styles.settingsIcon}
          src={mypageSettingsIconUrl}
          alt=""
          aria-hidden="true"
        />
        <PFText as="span" typo="bd-md-sb" color="black">
          회원정보 설정
        </PFText>
      </button>
    </header>
  )
}
