import illustExclamationUrl from '@/shared/assets/illustration/illust-exclamation.svg'
import { CmsButton } from '@/shared/ui/cms-button'

interface RegisteredByAdminNoticeProps {
  onChangePassword: () => void
  onFindEmail: () => void
}

/**
 * 관리자 회원가입 본인인증 사전 검사 — MASTER가 이미 등록한 관리자 계정 (시안 5568-43677).
 * 레이아웃은 이메일 찾기 「가입 정보 없음」 화면과 같은 클래스(find-email-page.css)를 쓴다.
 */
export function RegisteredByAdminNotice({
  onChangePassword,
  onFindEmail,
}: RegisteredByAdminNoticeProps) {
  return (
    <div className="find-email-result find-email-not-found">
      <div className="find-email-result__body">
        <div className="find-email-search-icon">
          <img className="find-email-search-icon__image" src={illustExclamationUrl} alt="" aria-hidden />
        </div>

        <h1 className="find-email-result__title">관리자에 의해 가입된 회원입니다.</h1>
        <p className="find-email-result__description">
          안전한 이용을 위해 본인인증 후 비밀번호를 변경해 주세요.
          <br />
          이메일이 기억나지 않는 경우, 이메일 찾기를 먼저 진행해 주세요.
        </p>

        <div className="auth-actions find-email-result__actions">
          <CmsButton variant="primary" size="h52" onClick={onChangePassword}>
            본인인증 후 비밀번호 변경하기
          </CmsButton>
          <CmsButton variant="default" size="h52" onClick={onFindEmail}>
            이메일 찾기
          </CmsButton>
        </div>
      </div>
    </div>
  )
}
