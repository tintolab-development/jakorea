import { requireAdminRegisteredWizardState } from '@/features/auth/admin-registered'
import { PFButton, PFText } from '@/shared/ui'
import sharedStyles from './shared.module.css'

export function AdminRegisteredIdentityPage() {
  const wizardState = requireAdminRegisteredWizardState()

  if (!wizardState?.birthDate || !wizardState.gender) {
    window.location.assign('/auth/admin-registered/birth')
    return null
  }

  const handleVerify = () => {
    window.location.assign('/auth/admin-registered/change-password')
  }

  const handlePrevious = () => {
    window.location.assign('/auth/admin-registered/birth')
  }

  return (
    <section className={sharedStyles.page}>
      <div className={sharedStyles.container}>
        <div className={sharedStyles.header}>
          <PFText as="h1" typo="hd-sm" color="black" className={sharedStyles.title}>
            본인인증을 진행해 주세요
          </PFText>
          <PFText as="p" typo="bd-lg-rg" color="primary-800" className={sharedStyles.description}>
            안전하게 가입하기 위해 휴대폰 본인인증이 필요해요. 인증 결과는 생년월일과 함께
            확인하며, 회원가입 절차에만 사용돼요.
          </PFText>
        </div>

        <div className={sharedStyles.content}>
          <div className={sharedStyles['identity-module']}>
            <PFText as="p" typo="bd-sm-rg" color="neutral-warm-500">
              통신사 본인인증 모듈 영역
              <br />
              수신: 이름·휴대폰번호·생년월일·CI/DI·인증토큰·인증일시
            </PFText>
          </div>
        </div>

        <div className={sharedStyles.actions}>
          <PFButton size="xlarge" width="100%" onClick={handleVerify}>
            휴대폰 본인인증하기
          </PFButton>
          <PFButton size="large" variant="text" width="100%" onClick={handlePrevious}>
            이전으로
          </PFButton>
        </div>
      </div>
    </section>
  )
}
