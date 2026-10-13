import type { SignUpCompleteLocationState } from '@/features/auth/sign-up'
import { MYPAGE_PATH } from '@/features/mypage'
import illustCheckUrl from '@/shared/assets/illustration/illust-check.svg'
import { PFButton, PFText } from '@/shared/ui'
import styles from './complete.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import { useLocation, useNavigate } from 'react-router-dom'

export function SignUpCompletePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const memberType = (location.state as SignUpCompleteLocationState | null)?.memberType
  const isTeacherSignup = memberType === 'teacher'
  const handleStart = () => {
    navigate('/')
  }

  const handleGoMyPage = () => {
    navigate(MYPAGE_PATH)
  }

  const handleConnectSocial = () => {
    navigate('/auth/sign-up/social-connect')
  }

  return (
    <section>
      <div className={styles.intro}>
        <img className={styles.illustration} src={illustCheckUrl} alt="" aria-hidden="true" />
        <PFText as="div" typo="hd-md" color="black" className={authPageCopyClass('title')}>
          {isTeacherSignup ? '교사 회원 가입이 완료되었어요!' : '가입이 완료되었어요!'}
        </PFText>
        <PFText
          as="p"
          typo="bd-md-rg"
          color="neutral-cool-500"
          className={authPageCopyClass('description')}
        >
          {isTeacherSignup
            ? '이제 교사 회원으로 JA Korea의 서비스를 이용할 수 있어요.'
            : '이제 JA Korea의 다양한 프로그램과 소식을 확인할 수 있어요.'}
        </PFText>
      </div>

      <div className={styles.actions}>
        <PFButton size="xlarge" width="100%" onClick={handleStart}>
          시작하기
        </PFButton>
        <PFButton size="xlarge" variant="tertiary" width="100%" onClick={handleGoMyPage}>
          마이페이지로 이동하기
        </PFButton>
        <PFButton variant="text" size="large" width="100%" onClick={handleConnectSocial}>
          소셜 계정 연결하기
        </PFButton>
      </div>
    </section>
  )
}
