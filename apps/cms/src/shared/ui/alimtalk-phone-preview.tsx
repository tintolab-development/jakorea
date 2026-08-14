import phoneFrameImage from '@/assets/images/message/alimtalk-detail-preview.png'
import profilePic from '@/assets/images/message/profile-pic.png'
import './alimtalk-phone-preview.css'

export type AlimtalkPhoneMessageType = 'BASIC' | 'CHANNEL_ADD' | 'COMPLEX'

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
  buttons?: AlimtalkPhonePreviewButton[]
  quickLinks?: string[]
  className?: string
}

const DEFAULT_CHANNEL_GUIDE =
  '채널 추가하고 이 채널의 마케팅 메시지 등을 카카오톡으로 받기'

function isChannelAddType(type: AlimtalkPhoneMessageType | undefined): boolean {
  return type === 'CHANNEL_ADD' || type === 'COMPLEX'
}

export function AlimtalkPhonePreview({
  senderName,
  content,
  ctaLabel,
  extraContent,
  channelGuide,
  messageType,
  buttons,
  quickLinks,
  className,
}: AlimtalkPhonePreviewProps) {
  const showChannelAdd = isChannelAddType(messageType)
  const defaultButtons = (buttons ?? []).filter(button => button.variant !== 'channel')
  const visibleButtons = showChannelAdd
    ? [{ variant: 'channel' as const, label: '채널 추가' }, ...defaultButtons]
    : defaultButtons
  const hasButtons = visibleButtons.length > 0
  const guideText = showChannelAdd ? (channelGuide ?? DEFAULT_CHANNEL_GUIDE) : undefined

  return (
    <div className={['alimtalk-phone-preview', className].filter(Boolean).join(' ')}>
      <img className="alimtalk-phone-preview__frame" src={phoneFrameImage} alt="" />
      <div className="alimtalk-phone-preview__stage">
        <div className="alimtalk-phone-preview__nav" aria-hidden>
          <p className="alimtalk-phone-preview__nav-title">{senderName}</p>
        </div>
        <div className="alimtalk-phone-preview__message">
          <div className="alimtalk-phone-preview__message-row">
            <img className="alimtalk-phone-preview__avatar" src={profilePic} alt="" />
            <div className="alimtalk-phone-preview__message-col">
              <p className="alimtalk-phone-preview__nickname">{senderName}</p>
              <div className="alimtalk-phone-preview__stack">
                <div className="alimtalk-phone-preview__bubble">
                  <div className="alimtalk-phone-preview__bubble-head">알림톡 도착</div>
                  <div className="alimtalk-phone-preview__bubble-body">
                    <p className="alimtalk-phone-preview__bubble-text">{content}</p>
                    {extraContent ? (
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
                                <span className="alimtalk-phone-preview__cta-icon" aria-hidden>
                                  +
                                </span>
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
  )
}
