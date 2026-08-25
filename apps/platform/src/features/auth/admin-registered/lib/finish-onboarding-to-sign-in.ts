import { clearAuthTokens, setDevAuthLoggedIn } from '@/shared/lib'
import { clearAdminRegisteredWizardState } from '../model/wizard-state'

const SIGN_IN_PATH = '/auth/sign-in'

/** 온보딩 세션을 종료하고 로그인 화면으로 보낸다. */
export function finishAdminRegisteredOnboardingToSignIn() {
  clearAdminRegisteredWizardState()
  setDevAuthLoggedIn(false)
  clearAuthTokens()
  window.location.assign(SIGN_IN_PATH)
}
