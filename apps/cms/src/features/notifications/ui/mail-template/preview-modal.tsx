import { ContentModal, CmsButton } from '@/shared/ui'
import { RichTextViewer } from '@/shared/rich-text'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { MAIL_VARIABLE_EXTENSIONS } from '@/features/notifications/model/mail-template/variable-node'
import './preview-modal.css'

type PreviewModalProps = {
  open: boolean
  subject: string
  bodyHtml: string
  onClose: () => void
}

export function PreviewModal({ open, subject, bodyHtml, onClose }: PreviewModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="템플릿 미리보기"
      size="medium"
      zIndex={1100}
      className="mail-template-preview-modal"
    >
      <div className="mail-template-preview">
        <DetailInfoForm title="메일 미리보기" hideHeader mode="view">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field label="제목" fullRow view={subject || '-'} />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="내용"
              fullRow
              view={
                <RichTextViewer
                  className="mail-template-preview__body"
                  content={bodyHtml}
                  contentFormat="html"
                  extraExtensions={MAIL_VARIABLE_EXTENSIONS}
                  maxHeight="420px"
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
        <div className="content-modal__footer-actions mail-template-preview__actions">
          <CmsButton variant="secondary" size="large" type="button" onClick={onClose}>
            닫기
          </CmsButton>
        </div>
      </div>
    </ContentModal>
  )
}
