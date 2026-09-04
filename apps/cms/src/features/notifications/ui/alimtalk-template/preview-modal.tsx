import { ContentModal, CmsButton, AlimtalkPhonePreview, useCmsAlert } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  ALIMTALK_APPROVAL_STATUS_LABEL,
  isAlimtalkTemplateApproved,
  resolveNhnConsoleUrl,
} from '@/features/notifications/api/adapters/alimtalk-template-adapters'
import { useAlimtalkTemplatePreviewQuery } from '@/features/notifications/hooks/use-alimtalk-template-tree-query'
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
  const { showAlert } = useCmsAlert()
  const previewQuery = useAlimtalkTemplatePreviewQuery(
    template?.id ?? null,
    template,
    open && Boolean(template?.id)
  )
  const resolved = previewQuery.data ?? template
  const canUseForSend = isAlimtalkTemplateApproved(resolved)
  const approvalLabel = resolved?.approvalStatus
    ? (ALIMTALK_APPROVAL_STATUS_LABEL[resolved.approvalStatus] ?? resolved.approvalStatus)
    : null

  const handleUse = () => {
    if (resolved && onUse) {
      if (!canUseForSend) {
        showAlert({
          title: '안내',
          content: '카카오 승인이 완료되지 않은 템플릿은 발송할 수 없습니다.',
        })
        return
      }
      onUse(resolved)
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
      {resolved ? (
        <div className="alimtalk-template-preview">
          <div className="alimtalk-template-preview__info">
            <DetailInfoForm title="템플릿 정보" hideHeader mode="view">
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="발신 프로필"
                  view={
                    resolved.senderProfile && resolved.senderProfile !== '-'
                      ? resolved.senderProfile
                      : '-'
                  }
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="템플릿명" view={resolved.templateName} />
              </DetailInfoForm.Row>
              {approvalLabel ? (
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field label="승인 상태" view={approvalLabel} />
                </DetailInfoForm.Row>
              ) : null}
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="메세지 유형"
                  view={ALIMTALK_MESSAGE_TYPE_LABEL[resolved.messageType]}
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="템플릿 강조 유형"
                  view={ALIMTALK_EMPHASIS_TYPE_LABEL[resolved.emphasisType]}
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>
            <p className="alimtalk-template-preview__hint">
              템플릿의 수정은{' '}
              <a
                className="alimtalk-template-preview__link"
                href={resolveNhnConsoleUrl(resolved)}
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
              <CmsButton
                variant="primary"
                size="large"
                type="button"
                onClick={handleUse}
                disabled={Boolean(onUse) && !canUseForSend}
              >
                템플릿 사용
              </CmsButton>
            </div>
          </div>
          <AlimtalkPhonePreview
            senderName={
              resolved.senderProfile && resolved.senderProfile !== '-'
                ? resolved.senderProfile
                : 'JA KOREA'
            }
            content={resolved.content ?? ''}
            extraContent={resolved.extraInfo}
            channelGuide={ALIMTALK_CHANNEL_ADD_GUIDE}
            messageType={resolved.messageType}
            emphasisType={resolved.emphasisType}
            emphasisTitle={resolved.emphasisTitle}
            emphasisSubtitle={resolved.emphasisSubtitle}
            imageUrl={resolved.imageUrl}
            templateHeader={resolved.templateHeader}
            itemTitle={resolved.itemTitle}
            itemDescription={resolved.itemDescription}
            itemImageUrl={resolved.itemImageUrl}
            itemList={resolved.itemList}
            itemSummary={resolved.itemSummary}
            buttons={resolved.buttons.slice(0, 5).map(button => ({
              variant: button.variant,
              label: button.name === 'test sample' ? '버튼명' : button.name,
            }))}
            quickLinks={resolved.quickLinks.map(link => link.name)}
          />
        </div>
      ) : null}
    </ContentModal>
  )
}
