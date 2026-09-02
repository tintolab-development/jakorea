import { Link } from 'react-router-dom'
import {
  isInstructorMypageProfile,
  isSchoolTeacherMypageProfile,
  MYPAGE_SETTINGS_PATH,
  type PlatformMemberProfile,
} from '@/features/mypage'
import { mypageSettingsIconUrl } from '@/widgets/mypage-layout'
import { PFText } from '@/shared/ui'
import styles from './home-header.module.css'

export type MypageHomeHeaderProps = {
  displayName: string
  profile: PlatformMemberProfile
  affiliationLabel?: string
  employmentStatusLabel?: string
}

export function MypageHomeHeader({
  displayName,
  profile,
  affiliationLabel,
  employmentStatusLabel,
}: MypageHomeHeaderProps) {
  const isInstructor = isInstructorMypageProfile(profile)
  const isSchoolTeacher = isSchoolTeacherMypageProfile(profile)
  const showIdentityBlock = isInstructor || isSchoolTeacher

  return (
    <header className={styles.header}>
      {showIdentityBlock ? (
        <div className={styles.instructorIdentity}>
          {affiliationLabel ? (
            <PFText as="p" typo="bd-sm-md" color="black" className={styles.affiliation}>
              {affiliationLabel}
            </PFText>
          ) : null}
          <div className={styles.nameRow}>
            <PFText as="h1" typo="page-title" color="black" className={styles.displayName}>
              {displayName}
              {isInstructor ? (
                <>
                  {' '}
                  <span className={styles.instructorHonorific}>강사</span>님
                </>
              ) : (
                '님'
              )}
            </PFText>
            {employmentStatusLabel ? (
              <span className={styles.employmentBadge}>{employmentStatusLabel}</span>
            ) : null}
          </div>
        </div>
      ) : (
        <PFText as="h1" typo="page-title" color="black" className={styles.displayName}>
          {displayName}님
        </PFText>
      )}
      <Link className={styles.settingsButton} to={MYPAGE_SETTINGS_PATH}>
        <img
          className={styles.settingsIcon}
          src={mypageSettingsIconUrl}
          alt=""
          aria-hidden="true"
        />
        <PFText as="span" typo="bd-md-sb" color="black">
          회원정보 설정
        </PFText>
      </Link>
    </header>
  )
}
