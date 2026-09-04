import { ContentModal, CmsButton, AlimtalkPhonePreview } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { resolveNhnConsoleUrl } from '@/features/notifications/api/adapters/alimtalk-template-adapters'
import {
  ALIMTALK_CHANNEL_ADD_GUIDE,
  ALIMTALK_EMPHASIS_TYPE_LABEL,
  ALIMTALK_MESSAGE_TYPE_LABEL,
  type AlimtalkTemplateItem,
} from '@/features/notifications/model/alimtalk-template/types'
import './preview-modal.css'

type PreviewModalProps = {
  open: boolean
  template: AlimtalkTemplateItem | null
  onClose: () => void
  /** 지정 시 「템플릿 사용」에서 템플릿을 발송 화면에 적용 */
  onUse?: (template: AlimtalkTemplateItem) => void
  zIndex?: number
}

export function PreviewModal({ open, template, onClose, onUse, zIndex }: PreviewModalProps) {
  const handleUse = () => {
    if (template && onUse) {
      onUse(template)
      return
    }
    onClose()
  }

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="템플릿 미리보기"
      size="medium"
      className="alimtalk-template-preview-modal"
      zIndex={zIndex}
    >
      {template ? (
        <div className="alimtalk-template-preview">
          <div className="alimtalk-template-preview__info">
            <DetailInfoForm title="템플릿 정보" hideHeader mode="view">
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="발신 프로필" view={template.senderProfile} />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="템플릿명" view={template.templateName} />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="메세지 유형"
                  view={ALIMTALK_MESSAGE_TYPE_LABEL[template.messageType]}
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="템플릿 강조 유형"
                  view={ALIMTALK_EMPHASIS_TYPE_LABEL[template.emphasisType]}
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>
            <p className="alimtalk-template-preview__hint">
              템플릿의 수정은{' '}
              <a
                className="alimtalk-template-preview__link"
                href={resolveNhnConsoleUrl(template)}
                target="_blank"
                rel="noopener noreferrer"
              >
                NHN Cloud 홈페이지
              </a>
              에서 가능합니다.
              <br />
              알림톡 수정 시에는 카카오톡 재심사가 필요합니다.
            </p>
            <div className="content-modal__footer-actions alimtalk-template-preview__actions">
              <CmsButton variant="secondary" size="large" type="button" onClick={onClose}>
                닫기
              </CmsButton>
              <CmsButton variant="primary" size="large" type="button" onClick={handleUse}>
                템플릿 사용
              </CmsButton>
            </div>
          </div>
          <AlimtalkPhonePreview
            senderName={template.senderProfile}
            content={template.content}
            extraContent={template.extraInfo}
            channelGuide={ALIMTALK_CHANNEL_ADD_GUIDE}
            messageType={template.messageType}
            emphasisType={template.emphasisType}
            emphasisTitle={template.emphasisTitle}
            emphasisSubtitle={template.emphasisSubtitle}
            imageUrl={template.imageUrl}
            templateHeader={template.templateHeader}
            itemTitle={template.itemTitle}
            itemDescription={template.itemDescription}
            itemImageUrl={template.itemImageUrl}
            itemList={template.itemList}
            itemSummary={template.itemSummary}
            buttons={template.buttons.slice(0, 5).map(button => ({
              variant: button.variant,
              label: button.name === 'test sample' ? '버튼명' : button.name,
            }))}
            quickLinks={template.quickLinks.map(link => link.name)}
          />
        </div>
      ) : null}
    </ContentModal>
  )
}
