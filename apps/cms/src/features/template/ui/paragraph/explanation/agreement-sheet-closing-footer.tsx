import { CmsButton } from '@/shared/ui/cms-button'
import './agreement-sheet-closing-footer.css'

export const AGREEMENT_SHEET_CLOSING_RECIPIENT = 'JA KOREA 귀하'

export type AgreementSheetClosingFooterVariant = 'sheet' | 'document'

export type AgreementSheetClosingFooterProps = {
  /** 작성완료 — 회원 동의 작성 등에서만 연결. 없으면 시각만 노출 */
  onSubmit?: () => void
  submitDisabled?: boolean
  /** false면 작성완료 버튼 숨김 (A4·템플릿 편집) */
  showSubmitButton?: boolean
  /** false면 `JA KOREA 귀하` 숨김 (초상권·행정정보·서약 시안) */
  showRecipient?: boolean
  /**
   * `sheet` — 작성 화면 하단(수신처 텍스트 + 작성완료)
   * `document` — A4 contentOnly 미리보기(우측 정렬 텍스트)
   */
  variant?: AgreementSheetClosingFooterVariant
}

/** 동의 양식 시트 하단 — 수신처 문구 + 작성완료 */
export function AgreementSheetClosingFooter({
  onSubmit,
  submitDisabled = false,
  showSubmitButton = true,
  showRecipient = true,
  variant = 'sheet',
}: AgreementSheetClosingFooterProps) {
  if (!showRecipient && !showSubmitButton) return null

  const isDocument = variant === 'document'

  return (
    <div
      className={[
        'agreement-sheet-closing-footer',
        isDocument ? 'agreement-sheet-closing-footer--document' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showRecipient ? (
        <p
          className={
            isDocument
              ? 'agreement-sheet-closing-footer__recipient-document'
              : 'agreement-sheet-closing-footer__recipient'
          }
        >
          {AGREEMENT_SHEET_CLOSING_RECIPIENT}
        </p>
      ) : null}
      {showSubmitButton ? (
        <CmsButton
          variant="primary"
          size="large"
          width={240}
          className="agreement-sheet-closing-footer__submit"
          disabled={submitDisabled}
          onClick={onSubmit}
        >
          작성완료
        </CmsButton>
      ) : null}
    </div>
  )
}
