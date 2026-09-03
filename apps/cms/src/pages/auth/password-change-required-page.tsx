/**
 * MFA 검증 후 passwordChangeRequired — 임시 비밀번호 변경 안내
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/model/auth-store'
import { initPasswordChangeRequiredWizardState } from '@/features/auth/password-change-required'
import { hasPasswordChangeRequiredComplete } from '@/features/auth/password-change-required/wizard-state'
import illustExclamationUrl from '@/shared/assets/illustration/illust-exclamation.svg'
import { CmsButton } from '@/shared/ui'
import { getRedirectPathByRole } from '@/shared/utils/auth-redirect'
import { passwordChangeRequiredPaths } from '@/shared/utils/post-auth-redirect'
import './password-change-required-page.css'

export function PasswordChangeRequiredPage() {
  const navigate = useNavigate()
  const { isAuthenticated, passwordChangeRequired, user } = useAuthStore()

  useEffect(() => {
    if (hasPasswordChangeRequiredComplete()) {
      navigate(passwordChangeRequiredPaths.complete, { replace: true })
      return
    }
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true })
      return
    }
    if (!passwordChangeRequired) {
      navigate(getRedirectPathByRole(user), { replace: true })
    }
  }, [isAuthenticated, passwordChangeRequired, user, navigate])

  const handleStart = () => {
    if (!user?.email) {
      return
    }
    initPasswordChangeRequiredWizardState(user.email)
    navigate(passwordChangeRequiredPaths.birth)
  }

  if (!isAuthenticated || !passwordChangeRequired) {
    return null
  }

  return (
    <div className="password-change-required-page">
      <div className="password-change-required-page__card">
        <img
          className="password-change-required-page__icon"
          src={illustExclamationUrl}
          alt=""
          aria-hidden
        />
        <h1 className="password-change-required-page__title">관리자에 의해 가입된 회원입니다.</h1>
        <p className="password-change-required-page__description">
          현재 비밀번호는 가입된 이메일 주소와 동일합니다.
          <br />
          안전한 이용을 위해 본인인증 후 비밀번호를 변경해 주세요.
        </p>
        <CmsButton
          variant="primary"
          size="large"
          width="100%"
          style={{ height: 52 }}
          onClick={handleStart}
        >
          본인인증 후 비밀번호 변경하기
        </CmsButton>
      </div>
    </div>
  )
}
