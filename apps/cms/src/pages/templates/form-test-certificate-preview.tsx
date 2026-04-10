import templateEducation from '@/assets/images/template/template-education.png'
import templateLogo from '@/assets/images/template/template-logo.png'
import templateStamp from '@/assets/images/template/template-stamp.png'
import './form-test-certificate-preview.css'

const CERTIFICATE_FORM_LABELS = ['성명', '생년월일', '소속', '프로그램명', '활동기간', '발급목적'] as const

function labelToGraphemes(label: string): string[] {
  return Array.from(label)
}

/** 발급일자 — 오늘 기준 년·월·일 (한국어) */
function formatCertificateIssueDate(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  return `${y}년 ${m}월 ${d}일`
}

function certificateIssueDateIso(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export type CertificateCanvasRegion =
  | 'canvas'
  | 'logo'
  | 'education'
  | 'title'
  | 'contentFrame'
  | 'chairmanName'
  | 'stamp'
  | 'footer'

/** 우측 커스텀 필드(name) → 캔버스 하이라이트 영역 */
export const TEMPLATE_FIELD_TO_CANVAS_REGION: Record<string, CertificateCanvasRegion> = {
  titleName: 'title',
  bodyContent: 'contentFrame',
  chairmanName: 'chairmanName',
  chairmanSeal: 'stamp',
  orgAddress: 'footer',
  orgPhone: 'footer',
  orgFax: 'footer',
  orgWebsite: 'footer',
  orgLogo: 'logo',
  orgLogo02: 'education',
  certificateBackground: 'canvas',
  participantInfo: 'contentFrame',
}

const FRAME_ACTIVE = 'form-test-certificate-preview__region--frame-active'

function cn(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** 미리보기용 임시 값 — 추후 유저/양식 데이터로 교체 */
const CERTIFICATE_FORM_VALUE_PLACEHOLDERS = [
  '홍길동',
  '1990.01.01',
  'OO고등학교',
  'JA 직업캠프',
  '2025.01.01 ~ 2025.12.31',
  '기관 및 학교 제출용',
] as const

export interface FormTestCertificatePreviewProps {
  /** 기관 로고 2(orgLogo02) 업로드 시 — 교육기부 슬롯에 표시. 없으면 기본 `template-education.png` */
  orgLogo02PreviewSrc?: string
  /** 우측 카드에서 선택한 커스텀 필드 — 해당 영역에 점선 프레임 적용 */
  activeFieldName?: string | null
}

/**
 * 양식 테스트 — 봉사활동인증서 프리뷰 슬롯
 * 캔버스(1144×1618 비율) 기준 절대 배치 오버레이
 */
export function FormTestCertificatePreview({
  orgLogo02PreviewSrc,
  activeFieldName,
}: FormTestCertificatePreviewProps) {
  const issueDate = new Date()
  const educationSrc = orgLogo02PreviewSrc ?? templateEducation
  const region =
    activeFieldName != null && activeFieldName !== ''
      ? TEMPLATE_FIELD_TO_CANVAS_REGION[activeFieldName] ?? null
      : null

  return (
    <div className="form-test-certificate-preview">
      <div className="form-test-certificate-preview__bg">
        <div className={cn('form-test-certificate-preview__canvas', region === 'canvas' && FRAME_ACTIVE)}>
          <span className="form-test-certificate-preview__tag">26-JA-00000</span>
          <img
            src={templateLogo}
            alt="JA Korea"
            className={cn('form-test-certificate-preview__logo', region === 'logo' && FRAME_ACTIVE)}
            draggable={false}
          />
          <img
            src={educationSrc}
            alt={orgLogo02PreviewSrc ? '기관 로고 2' : '교육기부'}
            className={cn('form-test-certificate-preview__education', region === 'education' && FRAME_ACTIVE)}
            width={150}
            height={130}
            draggable={false}
          />
          <h1 className={cn('form-test-certificate-preview__title', region === 'title' && FRAME_ACTIVE)}>
            봉사활동인증서
          </h1>
          <div
            className={cn(
              'form-test-certificate-preview__content-frame',
              region === 'contentFrame' && FRAME_ACTIVE
            )}
          >
            <div className="form-test-certificate-preview__content-frame-labels">
              {CERTIFICATE_FORM_LABELS.map(label => (
                <div key={label} className="form-test-certificate-preview__label-row">
                  <span className="form-test-certificate-preview__label-text" aria-label={label}>
                    {labelToGraphemes(label).map((ch, i) => (
                      <span key={`${label}-${i}`} className="form-test-certificate-preview__label-char">
                        {ch}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
            <div className="form-test-certificate-preview__content-frame-values">
              {CERTIFICATE_FORM_VALUE_PLACEHOLDERS.map((value, index) => (
                <div
                  key={CERTIFICATE_FORM_LABELS[index]}
                  className="form-test-certificate-preview__value-row"
                >
                  <span className="form-test-certificate-preview__value-text">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="form-test-certificate-preview__confirm">
            귀하는 위 프로그램 활동에
            <br />
            성실히 참여하였음을 확인합니다.
          </p>
          <time
            className="form-test-certificate-preview__issue-date"
            dateTime={certificateIssueDateIso(issueDate)}
          >
            {formatCertificateIssueDate(issueDate)}
          </time>
          <p className="form-test-certificate-preview__org-name">사단법인 제이에이코리아</p>
          <p
            className={cn(
              'form-test-certificate-preview__chairman-name',
              region === 'chairmanName' && FRAME_ACTIVE
            )}
            aria-label="회장 이은형"
          >
            <span className="form-test-certificate-preview__chairman-name-part">회장</span>
            <span className="form-test-certificate-preview__chairman-name-part">이</span>
            <span className="form-test-certificate-preview__chairman-name-part">은</span>
            <span className="form-test-certificate-preview__chairman-name-part">형</span>
          </p>
          <img
            src={templateStamp}
            alt="사단법인 제이에이코리아 직인"
            className={cn('form-test-certificate-preview__stamp', region === 'stamp' && FRAME_ACTIVE)}
            width={179}
            height={178}
            draggable={false}
          />
          {region === 'footer' ? (
            <div
              className={cn(
                'form-test-certificate-preview__footer-frame',
                'form-test-certificate-preview__region--frame-active'
              )}
              aria-hidden
            />
          ) : null}
          <div className="form-test-certificate-preview__footer">
            <span className="form-test-certificate-preview__footer-brand">사단법인 제이에이코리아</span>
            <span className="form-test-certificate-preview__footer-address">
              서울특별시 강서구 마곡중앙로 171 714호
            </span>
            <span className="form-test-certificate-preview__footer-tel">Tel.02-783-2367</span>
            <span className="form-test-certificate-preview__footer-fax">Fax.070-4275-5115</span>
            <a
              className="form-test-certificate-preview__footer-link"
              href="http://www.jakorea.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              http://www.jakorea.org
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
