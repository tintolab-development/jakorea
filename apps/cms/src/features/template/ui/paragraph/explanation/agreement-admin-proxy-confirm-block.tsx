import './agreement-admin-proxy-confirm-block.css'
import { AGREEMENT_USER_MODE_AUTHOR_PLACEHOLDER } from '@/features/template/lib/extract-agreement-draft-author-name'
import { ParagraphInput } from '@/features/template/ui/shared/paragraph-input'

export const AGREEMENT_ADMIN_PROXY_CONFIRM_GUIDANCE =
  '※ 당사자의 서면 동의를 바탕으로 관리자가 동의 확인 처리합니다.'

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
  /**
   * 템플릿 관리 작성(authoring) — 동의 문구를 캔버스에서 편집한다.
   * 지정하면 문구 자리를 `ParagraphInput`으로 그리고, `editable`이 카드 선택 여부(편집 UI)다.
   * 회원 화면·미리보기·A4는 지정하지 않는다(정적 표시).
   */
  onConsentTextChange?: (next: string) => void
  editable?: boolean
  consentPlaceholder?: string
}

/** 관리자 대리 작성(회원 등록) — 동의 문구·날짜·안내·대상 회원명을 한 카드에 표시 */
export function AgreementAdminProxyConfirmBlock({
  consentText,
  memberName,
  now,
  guidanceText = AGREEMENT_ADMIN_PROXY_CONFIRM_GUIDANCE,
  onConsentTextChange,
  editable = false,
  consentPlaceholder,
}: AgreementAdminProxyConfirmBlockProps) {
  const dateText = formatKoreanFullDate(now ?? new Date())
  const name = memberName.trim() || AGREEMENT_USER_MODE_AUTHOR_PLACEHOLDER
  const consent = consentText.trim()
  const authoring = onConsentTextChange != null

  return (
    <div className="agreement-admin-proxy-confirm">
      <div
        className={[
          'agreement-admin-proxy-confirm__row',
          !authoring && consent === '' ? 'agreement-admin-proxy-confirm__row--end' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {authoring ? (
          <div className="agreement-admin-proxy-confirm__consent agreement-admin-proxy-confirm__consent--input">
            <ParagraphInput
              type="description"
              className="paragraph-input--explanation-body agreement-admin-proxy-confirm__consent-input"
              isEditMode={editable}
              value={consentText}
              placeholder={consentPlaceholder ?? '텍스트를 작성해 주세요'}
              onChange={editable ? onConsentTextChange : undefined}
            />
          </div>
        ) : consent !== '' ? (
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
