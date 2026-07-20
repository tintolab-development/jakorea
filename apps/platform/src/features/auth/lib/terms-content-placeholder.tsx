import type { TermsViewType } from '../model/terms-view.types'
import styles from '../ui/terms-view-modal/terms-view-modal.module.css'

type TermsContentPlaceholderProps = {
  type: TermsViewType
}

const PLACEHOLDER_CONTENT: Record<TermsViewType, { heading: string; paragraphs: string[] }[]> = {
  serviceTerms: [
    {
      heading: '제1조 목적',
      paragraphs: [
        '본 약관은 JA Korea(이하 "회사")가 제공하는 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.',
      ],
    },
    {
      heading: '제2조 용어의 정의',
      paragraphs: [
        '본 약관에서 사용하는 용어의 정의는 관련 법령 및 서비스 안내에 따릅니다. 약관 본문은 추후 정식 버전으로 교체될 예정입니다.',
      ],
    },
    {
      heading: '제3조 약관의 게시와 개정',
      paragraphs: [
        '회사는 약관의 내용을 회원이 쉽게 확인할 수 있도록 서비스 초기 화면에 게시합니다. 약관이 개정되는 경우 적용일자 및 개정 사유를 사전에 공지합니다.',
      ],
    },
  ],
  privacyCollection: [
    {
      heading: '1. 수집·이용 목적',
      paragraphs: [
        'JA Korea는 회원가입 및 회원 서비스 제공을 위해 아래와 같이 개인정보를 수집·이용합니다.',
        '회원 식별 및 로그인, 계정 관리, 본인 확인, 서비스 제공, 프로그램 운영·관리, 고객 문의 처리 등',
      ],
    },
    {
      heading: '2. 수집 항목',
      paragraphs: [
        '수집 항목의 상세 내용은 회원 유형 및 가입 경로에 따라 달라질 수 있으며, 필수·선택 항목은 가입 화면에서 구분하여 안내합니다.',
      ],
    },
    {
      heading: '3. 보유 및 이용기간',
      paragraphs: [
        '회원 탈퇴 시까지 보유·이용하며, 관계 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관합니다.',
      ],
    },
  ],
  mfaSetup: [
    {
      heading: '2단계 인증(MFA) 설정 안내',
      paragraphs: [
        '회원의 계정 보안 강화를 위해 2단계 인증(MFA) 설정에 동의해 주시기 바랍니다.',
        'MFA 설정 시 로그인 과정에서 추가 인증 단계가 요구될 수 있습니다.',
      ],
    },
    {
      heading: '동의 거부 시',
      paragraphs: [
        'MFA 설정 동의를 거부할 경우 일부 보안 기능이 제한될 수 있으며, 서비스 정책에 따라 가입이 제한될 수 있습니다.',
      ],
    },
  ],
  marketing: [
    {
      heading: '마케팅 정보 수신 동의',
      paragraphs: [
        'JA Korea는 이벤트, 프로그램 안내, 맞춤형 정보 제공 등 마케팅 목적의 정보를 이메일, SMS, 앱 푸시 등으로 발송할 수 있습니다.',
      ],
    },
    {
      heading: '동의 거부권',
      paragraphs: [
        '마케팅 정보 수신에 동의하지 않아도 회원가입은 가능합니다. 동의 후에도 마이페이지 등에서 수신 거부를 변경할 수 있습니다.',
      ],
    },
  ],
}

export function TermsContentPlaceholder({ type }: TermsContentPlaceholderProps) {
  const sections = PLACEHOLDER_CONTENT[type]

  return (
    <div className={styles.content}>
      {sections.map(section => (
        <section key={section.heading} className={styles.section}>
          <h3 className={styles.sectionHeading}>{section.heading}</h3>
          {section.paragraphs.map(paragraph => (
            <p key={paragraph} className={styles.paragraph}>
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  )
}
