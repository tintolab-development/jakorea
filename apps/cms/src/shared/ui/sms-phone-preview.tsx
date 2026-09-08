import phoneFrameImage from '@/assets/images/message/문자 발송 _ 미리보기.png'
import './sms-phone-preview.css'

export type SmsPhonePreviewProps = {
  /** 상단 발신 표시명 (시안: JA KOREA) */
  brandName?: string
  senderPhone: string
  subject?: string
  bodyText: string
  showSubject?: boolean
  className?: string
}

const DEFAULT_BRAND = 'JA KOREA'

export function SmsPhonePreview({
  brandName = DEFAULT_BRAND,
  senderPhone,
  subject = '',
  bodyText,
  showSubject = true,
  className,
}: SmsPhonePreviewProps) {
  const phoneLabel = senderPhone.trim() || '발신번호'
  const subjectText = subject.trim()
  const body = bodyText.trim()
  const hasSubject = showSubject && Boolean(subjectText)

  return (
    <div className={['sms-phone-preview', className].filter(Boolean).join(' ')}>
      <img className="sms-phone-preview__frame" src={phoneFrameImage} alt="" />
      <div className="sms-phone-preview__stage">
        <div className="sms-phone-preview__nav" aria-hidden>
          <p className="sms-phone-preview__nav-brand">{brandName}</p>
          <p className="sms-phone-preview__nav-phone">{phoneLabel}</p>
        </div>
        <div className="sms-phone-preview__scroll">
          <div className="sms-phone-preview__message">
            <div className="sms-phone-preview__bubble">
              {hasSubject ? (
                <p className="sms-phone-preview__subject">{subjectText}</p>
              ) : null}
              <p className="sms-phone-preview__body">
                {body || (hasSubject ? '' : '내용을 작성하세요')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
