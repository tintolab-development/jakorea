import illustExclamationUrl from '@/shared/assets/illustration/illust-exclamation.svg'
import { PFButton, PFText } from '@/shared/ui'
import styles from './error.module.css'

const SOCIAL_CONNECT_PATH = '/auth/sign-up/social-connect'
const SIGN_IN_PATH = '/auth/sign-in'

type SocialConnectErrorReason = 'connection-failed' | 'already-linked'

function getErrorReason(): SocialConnectErrorReason {
  const reason = new URLSearchParams(window.location.search).get('reason')

  if (reason === 'already-linked') {
    return 'already-linked'
  }

  return 'connection-failed'
}

export function SignUpSocialConnectErrorPage() {
  const reason = getErrorReason()
  const isAlreadyLinked = reason === 'already-linked'

  const handleRetry = () => {
    window.location.assign(SOCIAL_CONNECT_PATH)
  }

  const handleSignIn = () => {
    window.location.assign(SIGN_IN_PATH)
  }

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <div className={styles.intro}>
          <img
            className={styles.illustration}
            src={illustExclamationUrl}
            alt=""
            aria-hidden="true"
          />
          <PFText as="div" typo="hd-md" color="black" className={styles.title}>
            {isAlreadyLinked ? (
              <>
                이 소셜 계정은 이미 다른
                <br />
                JA Korea 계정에 연결되어 있어요
              </>
            ) : (
              '소셜 계정을 연결하지 못했어요'
            )}
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={styles.description}>
            {isAlreadyLinked
              ? '다른 소셜 계정을 사용하거나 기존 계정으로 로그인해 주세요.'
              : '잠시후 다시 시도해 주세요.'}
          </PFText>
        </div>

        <div className={styles.actions}>
          {isAlreadyLinked ? (
            <>
              <PFButton size="xlarge" width="100%" onClick={handleRetry}>
                다른 소셜계정 연결하기
              </PFButton>
              <PFButton size="xlarge" variant="tertiary" width="100%" onClick={handleSignIn}>
                이메일로 로그인
              </PFButton>
            </>
          ) : (
            <PFButton size="xlarge" width="100%" onClick={handleRetry}>
              다시 시도하기
            </PFButton>
          )}
        </div>
      </div>
    </section>
  )
}
