import { CmsButton } from '@/shared/ui/cms-button'

import { FindEmailSearchIcon } from './find-email-search-icon'

interface FindEmailNotFoundViewProps {
  onRetry: () => void
  onGoLogin: () => void
}

export function FindEmailNotFoundView({ onRetry, onGoLogin }: FindEmailNotFoundViewProps) {
  return (
    <div className="find-email-result find-email-not-found">
      <div className="find-email-result__body">
        <FindEmailSearchIcon />

        <h1 className="find-email-result__title">일치하는 가입 정보가 없습니다.</h1>
        <p className="find-email-result__description">
          입력 정보를 다시 확인하시거나, 관리자에게 문의해 주세요.
        </p>

        <div className="auth-actions find-email-result__actions">
          <CmsButton variant="primary" size="h52" onClick={onRetry}>
            이메일 다시 찾기
          </CmsButton>
          <CmsButton variant="default" size="h52" onClick={onGoLogin}>
            로그인 화면 돌아가기
          </CmsButton>
        </div>
      </div>
    </div>
  )
}
