import { PFButton, PFText } from '@/shared/ui'
import styles from './page.module.css'

export function FindEmailPage() {
  const handleFindEmail = () => {
    // TODO: 통신사 본인인증 연동 후 이메일 조회
    window.location.assign('/auth/find-email/complete')
  }

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <PFText as="h1" typo="hd-sm" color="black" className={styles.title}>
            가입한 이메일을 찾아드릴게요
          </PFText>
          <PFText as="p" typo="bd-lg-rg" color="primary-800" className={styles.description}>
            본인 확인 후 가입한 이메일을 확인할 수 있어요
          </PFText>
        </div>

        <div className={styles.content}>
          <div className={styles['identity-module']}>
            <PFText as="p" typo="bd-sm-rg" color="neutral-warm-500">
              통신사 본인인증 모듈 영역
              <br />
              수신: 이름·휴대폰번호·생년월일·CI/DI·인증토큰·인증일시
            </PFText>
          </div>

          <PFButton size="xlarge" className={styles['submit-button']} onClick={handleFindEmail}>
            본인인증 후 이메일 찾기
          </PFButton>
        </div>
      </div>
    </section>
  )
}
