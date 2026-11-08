import { useEffect, useRef, type FocusEvent } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import { ContentModal } from '@/shared/ui/content-modal'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ADMIN_COMMENT_SENSITIVE_INFO_NOTICE } from '@/features/user/detail/lib/admin-comment-copy'

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

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="코멘트 작성"
      titleBodyGap="always"
      width={800}
      zIndex={2600}
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
            disabled={!canConfirm}
            onClick={onConfirm} >
            저장
          </CmsButton>
        </>
      }
    >
      <DetailInfoForm title="코멘트" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="코멘트"
            fullRow
            view={value}
            edit={
              <CmsTextArea inputSize="small"
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
