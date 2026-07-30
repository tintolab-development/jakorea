import { CmsButton } from '@/shared/ui/cms-button'
import './agreement-sheet-closing-footer.css'

export const AGREEMENT_SHEET_CLOSING_RECIPIENT = 'JA KOREA 귀하'

export type AgreementSheetClosingFooterProps = {
  /** 작성완료 — 회원 동의 작성 등에서만 연결. 없으면 시각만 노출 */
  onSubmit?: () => void
  submitDisabled?: boolean
  /** false면 귀하 문구만 (A4 인쇄 미리보기 등) */
  showSubmitButton?: boolean
}

/** 동의 양식 시트 하단 — 수신처 문구 + 작성완료 */
export function AgreementSheetClosingFooter({
  onSubmit,
  submitDisabled = false,
  showSubmitButton = true,
}: AgreementSheetClosingFooterProps) {
  return (
    <div className="agreement-sheet-closing-footer">
      <p className="agreement-sheet-closing-footer__recipient">{AGREEMENT_SHEET_CLOSING_RECIPIENT}</p>
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
