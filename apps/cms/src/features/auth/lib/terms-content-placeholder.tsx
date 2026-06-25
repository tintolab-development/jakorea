import type { TermsViewType } from './terms-view-config'

type TermsSection = {
  heading: string
  paragraphs: string[]
}

const MFA_INTRO =
  'JA Korea는 회원 계정의 보안 강화를 위해 2단계 인증(MFA) 설정을 안내합니다. 아래 내용을 확인하신 후 동의 여부를 선택해 주세요.'

const PLACEHOLDER_CONTENT: Record<TermsViewType, { intro?: string; sections: TermsSection[] }> = {
  termsOfService: {
    sections: [
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
  },
  privacyPolicy: {
    sections: [
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
      {
        heading: '4. 동의 거부권 및 불이익',
        paragraphs: [
          '귀하는 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 다만, 필수 항목 동의 거부 시 회원가입이 제한될 수 있습니다.',
        ],
      },
    ],
  },
  mfaSetup: {
    intro: MFA_INTRO,
    sections: [
      {
        heading: '1. 적용 대상',
        paragraphs: [
          '관리자 계정 및 보안 정책에 따라 2단계 인증(MFA) 설정이 필요한 회원에게 적용됩니다.',
        ],
      },
      {
        heading: '2. 설정 방법',
        paragraphs: [
          '회원가입 완료 후 안내에 따라 인증 앱 또는 SMS 등 지정된 방식으로 2단계 인증을 설정합니다.',
        ],
      },
      {
        heading: '3. 이용 목적',
        paragraphs: [
          '비밀번호 유출 등 보안 사고를 예방하고, 계정 도용을 방지하기 위해 추가 인증 단계를 요구합니다.',
        ],
      },
      {
        heading: '4. 인증정보 관리',
        paragraphs: [
          '인증에 사용되는 정보는 보안 정책에 따라 안전하게 관리되며, 목적 외 이용되지 않습니다.',
        ],
      },
      {
        heading: '5. 이용 제한',
        paragraphs: [
          'MFA 설정을 완료하지 않거나 동의하지 않는 경우, 일부 서비스 이용이 제한될 수 있습니다.',
        ],
      },
      {
        heading: '6. 동의 내용',
        paragraphs: [
          '본인은 위 내용을 확인하였으며, 2단계 인증(MFA) 설정 및 이용에 동의합니다.',
        ],
      },
    ],
  },
  marketingConsent: {
    sections: [
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
  },
}

export function TermsContentPlaceholder({ type }: { type: TermsViewType }) {
  const content = PLACEHOLDER_CONTENT[type]

  return (
    <div className="terms-view-modal__content">
      {content.intro ? <p className="terms-view-modal__paragraph">{content.intro}</p> : null}
      {content.sections.map(section => (
        <section key={section.heading} className="terms-view-modal__section">
          <h3 className="terms-view-modal__section-heading">{section.heading}</h3>
          {section.paragraphs.map(paragraph => (
            <p key={paragraph} className="terms-view-modal__paragraph">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  )
}
