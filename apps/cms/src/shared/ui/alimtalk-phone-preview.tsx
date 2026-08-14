import phoneFrameImage from '@/assets/images/message/alimtalk-detail-preview.png'
import profilePic from '@/assets/images/message/profile-pic.png'
import './alimtalk-phone-preview.css'

export type AlimtalkPhonePreviewButton = {
  variant: 'channel' | 'default'
  label: string
}

export type AlimtalkPhonePreviewProps = {
  senderName: string
  content: string
  ctaLabel?: string
  extraContent?: string
  buttons?: AlimtalkPhonePreviewButton[]
  quickLinks?: string[]
  className?: string
}

export function AlimtalkPhonePreview({
  senderName,
  content,
  ctaLabel,
  extraContent,
  buttons,
  quickLinks,
  className,
}: AlimtalkPhonePreviewProps) {
  const hasButtons = Boolean(buttons?.length)

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
              <div className="alimtalk-phone-preview__bubble">
                <div className="alimtalk-phone-preview__bubble-head">알림톡 도착</div>
                <div className="alimtalk-phone-preview__bubble-body">
                  <p className="alimtalk-phone-preview__bubble-text">{content}</p>
                  {extraContent ? (
                    <p className="alimtalk-phone-preview__bubble-extra">{extraContent}</p>
                  ) : null}
                  {hasButtons
                    ? buttons?.map((button, index) => (
                        <span
                          key={`${button.label}-${index}`}
                          className={
                            button.variant === 'channel'
                              ? 'alimtalk-phone-preview__cta alimtalk-phone-preview__cta--channel'
                              : 'alimtalk-phone-preview__cta alimtalk-phone-preview__cta--outline'
                          }
                        >
                          {button.variant === 'channel' ? `+ ${button.label}` : button.label}
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
  )
}
