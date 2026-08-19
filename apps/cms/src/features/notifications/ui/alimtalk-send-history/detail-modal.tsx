import dayjs from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { AlimtalkPhonePreview, CmsButton, ContentModal } from '@/shared/ui'
import { ALIMTALK_CHANNEL_ADD_GUIDE } from '@/features/notifications/model/alimtalk-template/types'
import type { AlimtalkSendHistoryRow } from '@/features/notifications/model/alimtalk-send-history/types'
import './detail-modal.css'

type DetailModalProps = {
  open: boolean
  row: AlimtalkSendHistoryRow | null
  onClose: () => void
}

export function DetailModal({ open, row, onClose }: DetailModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="알림톡 발송 조회 상세"
      className="alimtalk-send-history-detail-modal"
      size="wide"
      footer={
        <CmsButton variant="secondary" size="large" type="button" onClick={onClose}>
          닫기
        </CmsButton>
      }
    >
      {row ? (
        <div className="alimtalk-send-history-detail-modal__content">
          <div className="alimtalk-send-history-detail-modal__info">
            <DetailInfoForm title="발송 정보" hideHeader mode="view">
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="발송일시"
                  fullRow
                  view={dayjs(row.sentAt).format('YYYY.MM.DD HH:mm:ss')}
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="수신일시"
                  fullRow
                  view={dayjs(row.receivedAt).format('YYYY.MM.DD HH:mm:ss')}
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="발송자" fullRow view={row.senderInfo} />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="수신자" fullRow view={row.receiverInfo} />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="발송 상태" fullRow view={row.sendStatus} />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="템플릿명" fullRow view={row.templateName} />
              </DetailInfoForm.Row>
            </DetailInfoForm>
          </div>
          <div className="alimtalk-send-history-detail-modal__phone">
            <div className="alimtalk-send-history-detail-modal__phone-fit">
              <AlimtalkPhonePreview
                senderName={row.phoneTemplate.senderProfile}
                content={row.phoneTemplate.content}
                extraContent={row.phoneTemplate.extraInfo}
                channelGuide={ALIMTALK_CHANNEL_ADD_GUIDE}
                messageType={row.phoneTemplate.messageType}
                emphasisType={row.phoneTemplate.emphasisType}
                emphasisTitle={row.phoneTemplate.emphasisTitle}
                emphasisSubtitle={row.phoneTemplate.emphasisSubtitle}
                imageUrl={row.phoneTemplate.imageUrl}
                templateHeader={row.phoneTemplate.templateHeader}
                itemTitle={row.phoneTemplate.itemTitle}
                itemDescription={row.phoneTemplate.itemDescription}
                itemImageUrl={row.phoneTemplate.itemImageUrl}
                itemList={row.phoneTemplate.itemList}
                itemSummary={row.phoneTemplate.itemSummary}
                buttons={row.phoneTemplate.buttons.map(button => ({
                  variant: button.variant,
                  label: button.name,
                }))}
                quickLinks={row.phoneTemplate.quickLinks.map(link => link.name)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </ContentModal>
  )
}
