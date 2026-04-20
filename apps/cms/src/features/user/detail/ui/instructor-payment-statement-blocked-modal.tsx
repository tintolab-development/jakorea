/**
 * 지급조서 발급 불가 안내 — 레이아웃·타이포는 `ActionResultModal`(회원 삭제 완료 등)과 동일 패턴 (`ContentModal` + `CmsButton`)
 */
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import './instructor-payment-statement-blocked-modal.css'

export interface InstructorPaymentStatementBlockedModalProps {
  open: boolean
  onClose: () => void
  /** 단일 선택·단일 부적격 시 스크린샷 문구 */
  variant: 'single' | 'multi'
  /** variant `multi` 일 때 선택한 총 건수 N */
  selectedCount?: number
  /** 지급 현황 상세 풀페이지 등 600×230 시안 */
  layout?: 'default' | 'detailFullpage'
}

export function InstructorPaymentStatementBlockedModal({
  open,
  onClose,
  variant,
  selectedCount = 0,
  layout = 'default',
}: InstructorPaymentStatementBlockedModalProps) {
  const rootClass = [
    'instructor-payment-statement-blocked-modal',
    layout === 'detailFullpage' ? 'instructor-payment-statement-blocked-modal--detail-fullpage' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="지급조서 발급 불가 안내"
      width={600}
      className={rootClass}
      footer={
        <CmsButton variant="secondary" width={70} type="button" onClick={onClose}>
          확인
        </CmsButton>
      }
    >
      <div className="instructor-payment-statement-blocked-modal__message">
        {variant === 'single' ? (
          <>
            <span>해당 항목은 아직 지급조서 확인 처리가 되지 않았습니다.</span>
            <span>확인 처리가 되지 않은 항목은 지급조서 발급이 불가합니다.</span>
          </>
        ) : (
          <>
            <span>
              <strong className="instructor-payment-statement-blocked-modal__selection-emphasis">
                선택한 {selectedCount}개의 항목
              </strong>
              중 아직 지급조서 확인 처리가 되지 않은 항목이 있습니다.
            </span>
            <span>확인 처리가 되지 않은 항목은 지급조서 발급이 불가합니다.</span>
          </>
        )}
      </div>
    </ContentModal>
  )
}
