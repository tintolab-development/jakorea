import type { TermsViewType } from '../terms-view-config'

export type TermsSection = {
  heading: string
  paragraphs: string[]
}

export type TermsDocumentContent = {
  intro?: string
  sections: TermsSection[]
}

/** 서비스 이용약관 — 본문 편집 SSOT */
export const TERMS_OF_SERVICE_CONTENT: TermsDocumentContent = {
  sections: [
    {
      heading: '제1조 목적',
      paragraphs: [
        '본 약관은 JA Korea가 운영하는 웹사이트 및 관련 온라인 서비스에서 제공하는 회원 서비스의 이용과 관련하여, JA Korea와 이용자 및 회원 간의 권리, 의무, 책임사항, 서비스 이용 조건 및 절차를 정하는 것을 목적으로 합니다.',
      ],
    },
    {
      heading: '제2조 용어의 정의',
      paragraphs: [
        '본 약관에서 사용하는 용어의 뜻은 다음과 같습니다. 1. 이용자란 JA Korea 웹사이트에 접속하여 JA Korea가 제공하는 정보를 열람하거나 서비스를 이용하는 자를 말합니다. 2. 회원이란 본 약관에 동의하고 JA Korea가 정한 절차에 따라 회원가입을 완료하여 JA Korea가 제공하는 회원 서비스를 이용할 수 있는 자를 말합니다. 3. 일반회원이란 개인 자격으로 JA Korea 회원가입을 완료한 회원을 말합니다. 4. 교사회원이란 학교 또는 기관에 소속된 교사로서, JA Korea가 정한 교사 정보 및 소속 학교/기관 정보를 입력하고 회원가입을 완료한 회원을 말합니다. 5. 만 14세 미만 회원이란 회원가입 시 입력한 생년월일 또는 본인확인 절차를 통해 만 14세 미만으로 확인된 일반회원을 말합니다. 6. 법정대리인이란 만 14세 미만 회원의 회원가입 및 개인정보 수집·이용에 대하여 동의할 수 있는 부모 등 법정대리인을 말합니다. 7. 이메일 ID란 회원 식별 및 로그인에 사용되는 이메일 주소를 말합니다. 8. 본인인증이란 회원가입 및 계정 보호를 위해 휴대폰 본인인증 등 JA Korea가 정한 방식으로 본인 여부를 확인하는 절차를 말합니다. 9. 소셜 계정 연결이란 회원가입을 완료한 회원이 Google, 네이버, 카카오 등 외부 계정을 JA Korea 계정과 연결하여 이후 간편 로그인에 이용할 수 있도록 하는 절차를 말합니다.',
      ],
    },
    {
      heading: '제3조 약관의 게시와 개정',
      paragraphs: [
        'JA Korea는 본 약관의 내용을 이용자가 쉽게 확인할 수 있도록 웹사이트 또는 서비스 화면에 게시합니다. JA Korea는 관련 법령을 위반하지 않는 범위에서 본 약관을 개정할 수 있습니다. 약관을 개정하는 경우 적용일자 및 개정 사유를 명시하여 웹사이트에 공지합니다. 회원에게 불리하거나 중요한 사항을 변경하는 경우에는 합리적인 기간을 두고 공지하거나 개별 통지할 수 있습니다. 관련 법령상 별도 동의가 필요한 사항은 별도 동의 절차를 거칩니다.',
      ],
    },
  ],
}

/** 개인정보 수집·이용 동의 — 본문 편집 SSOT */
export const PRIVACY_POLICY_CONTENT: TermsDocumentContent = {
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
}

/** 2단계 인증(MFA) 설정 동의 — 본문 편집 SSOT */
export const MFA_SETUP_CONTENT: TermsDocumentContent = {
  intro:
    'JA Korea는 회원 계정의 보안 강화를 위해 2단계 인증(MFA) 설정을 안내합니다. 아래 내용을 확인하신 후 동의 여부를 선택해 주세요.',
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
      paragraphs: ['본인은 위 내용을 확인하였으며, 2단계 인증(MFA) 설정 및 이용에 동의합니다.'],
    },
  ],
}

/** 마케팅 정보 수신 동의 — 본문 편집 SSOT */
export const MARKETING_CONSENT_CONTENT: TermsDocumentContent = {
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
}

export const TERMS_DOCUMENT_BY_TYPE: Record<TermsViewType, TermsDocumentContent> = {
  termsOfService: TERMS_OF_SERVICE_CONTENT,
  privacyPolicy: PRIVACY_POLICY_CONTENT,
  mfaSetup: MFA_SETUP_CONTENT,
  marketingConsent: MARKETING_CONSENT_CONTENT,
}
