import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  isAgeTransitionCompleted,
  isAgeTransitionEvidencePending,
  useAgeTransitionStatusQuery,
} from '@/features/auth/age-transition'
import { MYPAGE_PATH, MYPAGE_SETTINGS_PATH } from '@/features/mypage'
import illustCheckUrl from '@/shared/assets/illustration/illust-check.svg'
import { getAccessToken, isRemoteApiConfigured } from '@/shared/lib'
import { PFButton, PFLoadingSpinner, PFText } from '@/shared/ui'
import { authPageCopy, authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import { clearMemberConversionIdentity } from './lib/identity-session'
import {
  MEMBER_CONVERSION_IDENTITY_PATH,
  readMemberConversionLaterPath,
  withMemberConversionRedirect,
} from './lib/paths'
import styles from './complete.module.css'

export function MemberConversionCompletePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')
  const remote = isRemoteApiConfigured()
  const hasToken = Boolean(getAccessToken())
  const statusQuery = useAgeTransitionStatusQuery({ enabled: remote && hasToken })

  const completed = isAgeTransitionCompleted(statusQuery.data)
  const evidencePending = isAgeTransitionEvidencePending(statusQuery.data)
  const laterPath = readMemberConversionLaterPath(redirect)

  useEffect(() => {
    if (!remote || !hasToken) {
      navigate(withMemberConversionRedirect(MEMBER_CONVERSION_IDENTITY_PATH, redirect), {
        replace: true,
      })
      return
    }
    if (statusQuery.isPending) return
    if (completed) return
    if (evidencePending) {
      navigate(laterPath, { replace: true })
      return
    }
    navigate(withMemberConversionRedirect(MEMBER_CONVERSION_IDENTITY_PATH, redirect), {
      replace: true,
    })
  }, [
    completed,
    evidencePending,
    hasToken,
    laterPath,
    navigate,
    redirect,
    remote,
    statusQuery.isPending,
  ])

  if (!remote || !hasToken || statusQuery.isPending) {
    return <PFLoadingSpinner centered />
  }

  if (!completed) return null

  const handleStart = () => {
    clearMemberConversionIdentity()
    navigate(laterPath)
  }

  const handleMypage = () => {
    clearMemberConversionIdentity()
    navigate(MYPAGE_PATH)
  }

  const handleSocial = () => {
    clearMemberConversionIdentity()
    navigate(`${MYPAGE_SETTINGS_PATH}?tab=social`)
  }

  return (
    <section className={styles.page}>
      <div className={styles.intro}>
        <img className={styles.illustration} src={illustCheckUrl} alt="" width={76} height={65} />
        <PFText
          as="h1"
          typo="hd-md"
          color="black"
          className={authPageCopyClass('title', authPageCopy.titleAfterMedia)}
        >
          회원 전환이 완료되었어요!
        </PFText>
        <PFText
          as="p"
          typo="bd-lg-rg"
          color="primary-800"
          className={authPageCopyClass('description', authPageCopy.descriptionTight)}
        >
          등록된 법정대리인 정보는 삭제되었어요.
          <br />
          이제 소셜 계정을 연결해 간편하게 로그인할 수 있어요.
        </PFText>
      </div>

      <div className={styles.actions}>
        <PFButton size="xlarge" width="100%" onClick={handleStart}>
          시작하기
        </PFButton>
        <PFButton size="xlarge" variant="tertiary" width="100%" onClick={handleMypage}>
          마이페이지로 이동하기
        </PFButton>
        <PFButton size="large" variant="text" width="100%" onClick={handleSocial}>
          소셜계정 연결하기
        </PFButton>
      </div>
    </section>
  )
}
