import { useNavigate } from 'react-router-dom'
import illustSearchUrl from '@/shared/assets/illustration/graphic-84-08.png'
import { PFButton, PFText } from '@/shared/ui'
import { authPageCopy, authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import styles from './not-found.module.css'

/**
 * 비밀번호 찾기 — 본인인증 후 eligibility=false (입력 이메일과 인증 정보가 같은 계정 없음).
 * Figma 2777-84927. 버튼 이동 대상은 기획 결정 대기 — 현재는 이메일 재입력(BE nextAction
 * REENTER_EMAIL)과 로그인 화면.
 */
export function FindPasswordNotFoundPage() {
  const navigate = useNavigate()

  return (
    <section>
      <div className={styles.intro}>
        <img className={styles.illustration} src={illustSearchUrl} alt="" aria-hidden="true" />
        <PFText
          as="h1"
          typo="hd-sm"
          color="black"
          className={authPageCopyClass('title', authPageCopy.titleAfterMedia)}
        >
          일치하는 가입 정보가 없어요.
        </PFText>
        <PFText
          as="p"
          typo="bd-lg-rg"
          color="primary-800"
          className={authPageCopyClass('description')}
        >
          입력 정보를 다시 확인해 주세요.
        </PFText>
      </div>

      <div className={styles.actions}>
        <PFButton
          size="xlarge"
          width="100%"
          onClick={() => navigate('/auth/find-password', { replace: true })}
        >
          이메일 다시 찾기
        </PFButton>
        <PFButton
          size="xlarge"
          variant="tertiary"
          width="100%"
          onClick={() => navigate('/auth/sign-in')}
        >
          로그인 화면 돌아가기
        </PFButton>
      </div>
    </section>
  )
}
