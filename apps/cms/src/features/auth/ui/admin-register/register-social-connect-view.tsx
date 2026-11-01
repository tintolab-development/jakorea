import type { SocialProvider } from '@jakorea/social-auth'
import { CmsButton } from '@/shared/ui'

import { SocialConnectProviderList } from '@/features/auth/ui/social-connect-provider-list'

import { RegisterStepHeader } from './register-step-header'

interface RegisterSocialConnectViewProps {
  redirectPath?: string
  onComplete: () => void
  onConnectSuccess: (provider: SocialProvider) => void
}

export function RegisterSocialConnectView({
  redirectPath,
  onComplete,
  onConnectSuccess,
}: RegisterSocialConnectViewProps) {
  return (
    <div className="register-social-connect">
      <RegisterStepHeader
        title={
          <>
            소셜 계정을 연결하면
            <br />더 쉽게 로그인할 수 있습니다.
          </>
        }
        description={
          <>
            다음부터 이메일과 비밀번호 없이 로그인할 수 있습니다.
            <br />
            연결은 선택 사항이며, 나중에 [내 정보 수정]에서도 할 수 있습니다.
          </>
        }
      />

      <div className="register-social-connect__content">
        <SocialConnectProviderList
          redirectPath={redirectPath}
          onConnectSuccess={onConnectSuccess}
        />

        <div className="register-social-connect__actions">
          <CmsButton variant="primary" size="h52" onClick={onComplete}>
            완료
          </CmsButton>
        </div>
      </div>
    </div>
  )
}
