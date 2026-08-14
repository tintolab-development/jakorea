import { ContentModal, CmsButton, AlimtalkPhonePreview } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { AlimtalkTemplateItem } from '@/features/notifications/model/alimtalk-template/types'
import './preview-modal.css'

const NHN_CLOUD_URL = 'https://www.nhncloud.com/kr'

const MESSAGE_TYPE_LABEL = {
  BASIC: '기본형',
} as const

const EMPHASIS_TYPE_LABEL = {
  NONE: '선택 안 함',
} as const

type PreviewModalProps = {
  open: boolean
  template: AlimtalkTemplateItem | null
  onClose: () => void
}

export function PreviewModal({ open, template, onClose }: PreviewModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="템플릿 미리보기"
      size="medium"
      className="alimtalk-template-preview-modal"
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
                  view={MESSAGE_TYPE_LABEL[template.messageType]}
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="템플릿 강조 유형"
                  view={EMPHASIS_TYPE_LABEL[template.emphasisType]}
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>
            <p className="alimtalk-template-preview__hint">
              템플릿의 수정 및 삭제는{' '}
              <a
                className="alimtalk-template-preview__link"
                href={NHN_CLOUD_URL}
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
              <CmsButton variant="primary" size="large" type="button" onClick={onClose}>
                사용하기
              </CmsButton>
            </div>
          </div>
          <AlimtalkPhonePreview
            senderName={template.senderProfile}
            content={template.content}
            ctaLabel={template.ctaLabel}
          />
        </div>
      ) : null}
    </ContentModal>
  )
}
