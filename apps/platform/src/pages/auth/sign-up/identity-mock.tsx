import { useMemo } from 'react'
import { PFButton, PFText } from '@/shared/ui'
import styles from './identity-mock.module.css'

type IdentityMockNicePageProps = {
  callbackPath: string
}

function IdentityMockNicePage({ callbackPath }: IdentityMockNicePageProps) {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), [])
  const sessionId = searchParams.get('sessionId') ?? ''
  const nonce = searchParams.get('nonce') ?? ''

  const target = useMemo(() => {
    const params = new URLSearchParams({
      web_transaction_id: `mock-tx-${nonce || 'unknown'}`,
    })
    return `${callbackPath}?${params.toString()}`
  }, [callbackPath, nonce])

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <PFText as="p" typo="label-md" color="neutral-cool-500" className={styles.badge}>
          개발용 Mock
        </PFText>
        <PFText as="h1" typo="bd-lg-sb" color="black" className={styles.title}>
          NICE 통합인증
        </PFText>
        <PFText as="p" typo="bd-sm-rg" color="black" className={styles.description}>
          실제 NICE 표준창 대신 사용하는 mock 화면입니다.
          <br />
          휴대폰 본인인증 완료를 시뮬레이션합니다.
        </PFText>
        {sessionId ? (
          <PFText as="p" typo="bd-sm-rg" color="neutral-warm-600">
            세션 ID: {sessionId}
          </PFText>
        ) : null}
        <div className={styles.actions}>
          <PFButton size="xlarge" width="100%" onClick={() => window.location.assign(target)}>
            인증 완료
          </PFButton>
          <PFButton size="xlarge" variant="tertiary" width="100%" onClick={() => window.close()}>
            닫기
          </PFButton>
        </div>
      </div>
    </div>
  )
}

export function SignUpIdentityMockNicePage() {
  return <IdentityMockNicePage callbackPath="/auth/sign-up/identity/callback" />
}

export function SignUpGuardianIdentityMockNicePage() {
  return <IdentityMockNicePage callbackPath="/auth/sign-up/guardian-identity/callback" />
}
