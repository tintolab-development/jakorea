import { useEffect, useRef, type FocusEvent } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import { ContentModal } from '@/shared/ui/content-modal'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import { ADMIN_COMMENT_SENSITIVE_INFO_NOTICE } from '@/features/user/detail/lib/admin-comment-copy'
import './member-admin-comment-modal.css'

export interface MemberAdminCommentModalProps {
  open: boolean
  value: string
  loading?: boolean
  maxLength?: number
  allowEmpty?: boolean
  onChange: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
}

export function MemberAdminCommentModal({
  open,
  value,
  loading = false,
  maxLength = 1000,
  allowEmpty = false,
  onChange,
  onCancel,
  onConfirm,
}: MemberAdminCommentModalProps) {
  const { showAlert } = useCmsAlert()
  const canConfirm = allowEmpty || value.trim().length > 0
  /** 모달을 열 때 첫 포커스만 커서를 기존 내용 맨 뒤로 — 이후 클릭 위치는 그대로 둔다 */
  const caretPlacedRef = useRef(false)
  useEffect(() => {
    if (!open) caretPlacedRef.current = false
  }, [open])
  const placeCaretAtEndOnFirstFocus = (event: FocusEvent<HTMLTextAreaElement>) => {
    if (caretPlacedRef.current) return
    caretPlacedRef.current = true
    const end = event.currentTarget.value.length
    event.currentTarget.setSelectionRange(end, end)
    event.currentTarget.scrollTop = event.currentTarget.scrollHeight
  }

  /** 저장은 항상 활성 — 미입력이면 필수 항목 미입력 안내 */
  const handleConfirmClick = () => {
    if (!canConfirm) {
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return
    }
    onConfirm()
  }

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="코멘트 작성"
      titleBodyGap="section"
      width={800}
      zIndex={2600}
      className="member-admin-comment-modal"
      footer={
        <>
          <CmsButton
            type="button"
            variant="secondary"
            size="medium"
            disabled={loading}
            onClick={onCancel} >
            취소
          </CmsButton>
          <CmsButton
            type="button"
            variant="primary"
            size="medium"
            loading={loading}
            disabled={loading}
            onClick={handleConfirmClick} >
            저장
          </CmsButton>
        </>
      }
    >
      <DetailInfoForm title="코멘트" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="코멘트"
            required
            fullRow
            view={value}
            edit={
              <CmsTextArea inputSize="medium"
                value={value}
                onChange={event => onChange(event.target.value)}
                placeholder={ADMIN_COMMENT_SENSITIVE_INFO_NOTICE}
                width="100%"
                rows={4}
                maxLength={maxLength}
                autoFocus
                onFocus={placeCaretAtEndOnFirstFocus}
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ContentModal>
  )
}
