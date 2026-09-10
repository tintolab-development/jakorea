import phoneFrameImage from '@/assets/images/message/alimtalk-detail-preview.png'
import alimtalkChannelAddIcon from '@/assets/images/message/alimtalk-channel-add-icon.png'
import profilePic from '@/assets/images/message/profile-pic.png'
import './alimtalk-phone-preview.css'

export type AlimtalkPhoneMessageType = 'BASIC' | 'CHANNEL_ADD' | 'EXTRA_INFO' | 'COMPLEX'

export type AlimtalkPhoneEmphasisType = 'NONE' | 'TEXT' | 'IMAGE' | 'ITEM_LIST'

export type AlimtalkPhoneItemListEntry = {
  name: string
  content: string
}

export type AlimtalkPhonePreviewButton = {
  variant: 'channel' | 'default'
  label: string
}

export type AlimtalkPhonePreviewProps = {
  senderName: string
  content: string
  ctaLabel?: string
  extraContent?: string
  /** 채널 추가형·복합형에서만 노출 */
  channelGuide?: string
  messageType?: AlimtalkPhoneMessageType
  emphasisType?: AlimtalkPhoneEmphasisType
  emphasisTitle?: string
  emphasisSubtitle?: string
  imageUrl?: string
  templateHeader?: string
  itemTitle?: string
  itemDescription?: string
  itemImageUrl?: string
  itemList?: AlimtalkPhoneItemListEntry[]
  itemSummary?: AlimtalkPhoneItemListEntry
  buttons?: AlimtalkPhonePreviewButton[]
  quickLinks?: string[]
  className?: string
}

const DEFAULT_CHANNEL_GUIDE =
  '채널 추가하고 이 채널의 마케팅 메시지 등을 카카오톡으로 받기'

function isChannelAddType(type: AlimtalkPhoneMessageType | undefined): boolean {
  return type === 'CHANNEL_ADD' || type === 'COMPLEX'
}

function isExtraInfoType(type: AlimtalkPhoneMessageType | undefined): boolean {
  return type === 'EXTRA_INFO' || type === 'COMPLEX'
}

export function AlimtalkPhonePreview({
  senderName,
  content,
  ctaLabel,
  extraContent,
  channelGuide,
  messageType,
  emphasisType,
  emphasisTitle,
  emphasisSubtitle,
  imageUrl,
  templateHeader,
  itemTitle,
  itemDescription,
  itemImageUrl,
  itemList,
  itemSummary,
  buttons,
  quickLinks,
  className,
}: AlimtalkPhonePreviewProps) {
  const showEmphasis = emphasisType === 'TEXT'
  const showItemList = emphasisType === 'ITEM_LIST'
  const showBanner =
    (emphasisType === 'IMAGE' || emphasisType === 'ITEM_LIST') && Boolean(imageUrl)
  const showChannelAdd = isChannelAddType(messageType)
  const defaultButtons = (buttons ?? []).filter(button => button.variant !== 'channel')
  const visibleButtons = showChannelAdd
    ? [{ variant: 'channel' as const, label: '채널 추가' }, ...defaultButtons]
    : defaultButtons
  const hasChannelButton = visibleButtons.some(button => button.variant === 'channel')
  const hasButtons = visibleButtons.length > 0
  /** 채널 추가 버튼이 있으면 시안대로 버튼만 노출(안내 문구는 버튼으로 대체) */
  const guideText =
    showChannelAdd && !hasChannelButton ? (channelGuide ?? DEFAULT_CHANNEL_GUIDE) : undefined
  const listRows = [
    ...(itemList ?? []),
    ...(itemSummary ? [itemSummary] : []),
  ]

  return (
    <div className={['alimtalk-phone-preview', className].filter(Boolean).join(' ')}>
      <img className="alimtalk-phone-preview__frame" src={phoneFrameImage} alt="" />
      <div className="alimtalk-phone-preview__home-fill" aria-hidden />
      <div className="alimtalk-phone-preview__stage">
        <div className="alimtalk-phone-preview__nav" aria-hidden>
          <p className="alimtalk-phone-preview__nav-title">{senderName}</p>
        </div>
        <div className="alimtalk-phone-preview__scroll">
          <div className="alimtalk-phone-preview__message">
            <div className="alimtalk-phone-preview__message-row">
            <img className="alimtalk-phone-preview__avatar" src={profilePic} alt="" />
            <div className="alimtalk-phone-preview__message-col">
              <p className="alimtalk-phone-preview__nickname">{senderName}</p>
              <div className="alimtalk-phone-preview__stack">
                <div className="alimtalk-phone-preview__bubble">
                  <div className="alimtalk-phone-preview__bubble-head">알림톡 도착</div>
                  {showBanner ? (
                    <div className="alimtalk-phone-preview__bubble-image">
                      <img src={imageUrl} alt="" />
                    </div>
                  ) : null}
                  <div className="alimtalk-phone-preview__bubble-body">
                    {showEmphasis ? (
                      <>
                        <div className="alimtalk-phone-preview__bubble-emphasis-text">
                          {emphasisSubtitle ? (
                            <p className="alimtalk-phone-preview__bubble-emphasis-subtitle">
                              {emphasisSubtitle}
                            </p>
                          ) : null}
                          {emphasisTitle ? (
                            <p className="alimtalk-phone-preview__bubble-emphasis-title">
                              {emphasisTitle}
                            </p>
                          ) : null}
                        </div>
                        <div className="alimtalk-phone-preview__bubble-emphasis-divider" />
                      </>
                    ) : null}
                    {showItemList ? (
                      <>
                        {templateHeader ? (
                          <p className="alimtalk-phone-preview__bubble-template-header">
                            {templateHeader}
                          </p>
                        ) : null}
                        <div className="alimtalk-phone-preview__bubble-emphasis-divider" />
                        <div className="alimtalk-phone-preview__bubble-item-block">
                          <div className="alimtalk-phone-preview__bubble-item-copy">
                            {itemTitle ? (
                              <p className="alimtalk-phone-preview__bubble-item-title">{itemTitle}</p>
                            ) : null}
                            {itemDescription ? (
                              <p className="alimtalk-phone-preview__bubble-item-desc">
                                {itemDescription}
                              </p>
                            ) : null}
                          </div>
                          {itemImageUrl ? (
                            <img
                              className="alimtalk-phone-preview__bubble-item-thumb"
                              src={itemImageUrl}
                              alt=""
                            />
                          ) : null}
                        </div>
                        <div className="alimtalk-phone-preview__bubble-emphasis-divider" />
                        {listRows.length > 0 ? (
                          <div className="alimtalk-phone-preview__bubble-item-list">
                            {listRows.map((row, index) => (
                              <div
                                key={`${row.name}-${index}`}
                                className="alimtalk-phone-preview__bubble-item-row"
                              >
                                <span className="alimtalk-phone-preview__bubble-item-name">
                                  {row.name}
                                </span>
                                <span className="alimtalk-phone-preview__bubble-item-value">
                                  {row.content}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <div className="alimtalk-phone-preview__bubble-emphasis-divider" />
                      </>
                    ) : null}
                    <p className="alimtalk-phone-preview__bubble-text">{content}</p>
                    {isExtraInfoType(messageType) && extraContent ? (
                      <p className="alimtalk-phone-preview__bubble-extra">{extraContent}</p>
                    ) : null}
                    {guideText ? (
                      <p className="alimtalk-phone-preview__bubble-guide">{guideText}</p>
                    ) : null}
                    {hasButtons
                      ? visibleButtons.map((button, index) => (
                          <span
                            key={`${button.label}-${index}`}
                            className={
                              button.variant === 'channel'
                                ? 'alimtalk-phone-preview__cta alimtalk-phone-preview__cta--channel'
                                : 'alimtalk-phone-preview__cta'
                            }
                          >
                            {button.variant === 'channel' ? (
                              <>
                                <img
                                  className="alimtalk-phone-preview__cta-icon"
                                  src={alimtalkChannelAddIcon}
                                  alt=""
                                  aria-hidden
                                />
                                {button.label}
                              </>
                            ) : (
                              button.label
                            )}
                          </span>
                        ))
                      : ctaLabel ? (
                          <span className="alimtalk-phone-preview__cta">{ctaLabel}</span>
                        ) : null}
                  </div>
                </div>
                {quickLinks?.length ? (
                  <div className="alimtalk-phone-preview__quick-links">
                    {quickLinks.map((label, index) => (
                      <span key={`${label}-${index}`} className="alimtalk-phone-preview__quick-link">
                        {label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
