import './agreement-admin-proxy-confirm-block.css'
import { AGREEMENT_USER_MODE_AUTHOR_PLACEHOLDER } from '@/features/template/lib/extract-agreement-draft-author-name'

export const AGREEMENT_ADMIN_PROXY_CONFIRM_GUIDANCE =
  '* 당사자의 서면 동의를 바탕으로 관리자가 동의 확인 처리합니다.'

function formatKoreanFullDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}년 ${m}월 ${day}일`
}

export type AgreementAdminProxyConfirmBlockProps = {
  consentText: string
  memberName: string
  now?: Date
  guidanceText?: string
}

/** 관리자 대리 작성(회원 등록) — 동의 문구·날짜·안내·대상 회원명을 한 카드에 표시 */
export function AgreementAdminProxyConfirmBlock({
  consentText,
  memberName,
  now,
  guidanceText = AGREEMENT_ADMIN_PROXY_CONFIRM_GUIDANCE,
}: AgreementAdminProxyConfirmBlockProps) {
  const dateText = formatKoreanFullDate(now ?? new Date())
  const name = memberName.trim() || AGREEMENT_USER_MODE_AUTHOR_PLACEHOLDER
  const consent = consentText.trim()

  return (
    <div className="agreement-admin-proxy-confirm">
      <div
        className={[
          'agreement-admin-proxy-confirm__row',
          consent === '' ? 'agreement-admin-proxy-confirm__row--end' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {consent !== '' ? (
          <p className="agreement-admin-proxy-confirm__consent">{consent}</p>
        ) : null}
        <p className="agreement-admin-proxy-confirm__date">{dateText}</p>
      </div>
      <div className="agreement-admin-proxy-confirm__row">
        <p className="agreement-admin-proxy-confirm__guidance">{guidanceText}</p>
        <p className="agreement-admin-proxy-confirm__name">{name}</p>
      </div>
    </div>
  )
}
