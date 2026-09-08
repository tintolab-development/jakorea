import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { AlimtalkPhonePreview, CmsButton, ContentModal } from '@/shared/ui'
import { ALIMTALK_CHANNEL_ADD_GUIDE } from '@/features/notifications/model/alimtalk-template/types'
import { formatDeliveryDateTimeSeoul } from '@/features/notifications/model/alimtalk-send-history/format-datetime'
import type { AlimtalkSendHistoryRow } from '@/features/notifications/model/alimtalk-send-history/types'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import './detail-modal.css'

type DetailModalProps = {
  open: boolean
  row: AlimtalkSendHistoryRow | null
  onClose: () => void
}

function sendStatusView(row: AlimtalkSendHistoryRow) {
  if (row.sendStatus === '발송 실패' && row.failedReason?.trim()) {
    return (
      <span className="alimtalk-send-history-detail-modal__status-with-reason">
        <span>{row.sendStatus}</span>
        <span
          className="alimtalk-send-history-detail-modal__failed-reason"
          title={row.failedReason}
        >
          {row.failedReason}
        </span>
      </span>
    )
  }
  return row.sendStatus
}

export function DetailModal({ open, row, onClose }: DetailModalProps) {
  const senderName =
    row?.phoneTemplate.senderProfile && row.phoneTemplate.senderProfile !== '-'
      ? row.phoneTemplate.senderProfile
      : row?.senderInfo && row.senderInfo !== '-'
        ? row.senderInfo
        : 'JA KOREA'

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
                  view={formatDeliveryDateTimeSeoul(row.sentAt)}
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="수신일시"
                  fullRow
                  view={formatDeliveryDateTimeSeoul(row.receivedAt)}
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="발송자" fullRow view={row.senderInfo || '-'} />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="수신자"
                  fullRow
                  view={withProgramDetailTdDivider([row.receiverName, row.receiverPhone])}
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="발송 상태" fullRow view={sendStatusView(row)} />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="템플릿명"
                  fullRow
                  view={row.templateName.trim() || '-'}
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>
          </div>
          <div className="alimtalk-send-history-detail-modal__phone">
            <div className="alimtalk-send-history-detail-modal__phone-fit">
              <AlimtalkPhonePreview
                senderName={senderName}
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
                buttons={row.phoneTemplate.buttons.slice(0, 5).map(button => ({
                  variant: button.variant,
                  label: button.name === 'test sample' ? '버튼명' : button.name,
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
