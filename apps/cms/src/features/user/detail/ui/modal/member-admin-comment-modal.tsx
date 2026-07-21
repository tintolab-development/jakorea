import { CmsButton } from '@/shared/ui/cms-button'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import { ContentModal } from '@/shared/ui/content-modal'
import { DetailInfoForm } from '@/shared/components/detail-info-form'

export interface MemberAdminCommentModalProps {
  open: boolean
  value: string
  loading?: boolean
  onChange: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
}

export function MemberAdminCommentModal({
  open,
  value,
  loading = false,
  onChange,
  onCancel,
  onConfirm,
}: MemberAdminCommentModalProps) {
  const canConfirm = value.trim().length > 0

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="코멘트 작성"
      width={800}
      zIndex={2600}
      footer={
        <>
          <CmsButton
            type="button"
            variant="secondary"
            size="medium"
            width={120}
            disabled={loading}
            onClick={onCancel}
          >
            취소
          </CmsButton>
          <CmsButton
            type="button"
            variant="primary"
            size="medium"
            width={120}
            loading={loading}
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            코멘트 작성
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
              <CmsTextArea
                value={value}
                onChange={event => onChange(event.target.value)}
                placeholder="코멘트를 작성해 주세요"
                width="100%"
                rows={4}
                maxLength={1000}
                autoFocus
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ContentModal>
  )
}
