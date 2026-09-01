import { Outlet } from 'react-router-dom'
import { useAdminProvisionedOnboardingStepGuard } from '@/features/auth/admin-registered'
import { PFText } from '@/shared/ui'
import sharedStyles from './shared.module.css'

/** 관리자등록 온보딩 step 화면 — GET /me step 과 경로 정렬 */
export function AdminRegisteredOnboardingLayout() {
  const { isChecking } = useAdminProvisionedOnboardingStepGuard()

  if (isChecking) {
    return (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={sharedStyles.statusMessage}>
        가입 절차를 확인하는 중…
      </PFText>
    )
  }

  return <Outlet />
}
