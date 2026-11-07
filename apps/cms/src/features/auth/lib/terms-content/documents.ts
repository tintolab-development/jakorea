import type { TermsViewType } from '../terms-view-config'

export type TermsTable = {
  columns: string[]
  rows: string[][]
}

export type TermsSection = {
  heading: string
  paragraphs: string[]
  table?: TermsTable
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
        '본 약관은 JA Korea가 운영하는 어드민 서비스(CMS 어드민·홈페이지 어드민)의 이용과 관련하여 JA Korea와 관리자 간의 권리, 의무, 책임과 이용 조건·절차를 정하는 것을 목적으로 합니다.',
      ],
    },
    {
      heading: '제2조 용어의 정의',
      paragraphs: [
        '본 약관에서 사용하는 용어의 뜻은 다음과 같습니다.',
        '•	어드민 서비스란 JA Korea가 프로그램·회원·정산·홈페이지 콘텐츠 등을 관리하기 위해 운영하는 CMS 어드민과 홈페이지 어드민을 말합니다.',
        '•	관리자란 JA Korea 소속 직원으로서 @jakorea.org 이메일로 가입하고 승인을 받아 어드민 서비스를 이용하는 자를 말합니다.',
        '•	권한 유형이란 관리자에게 부여하는 Master, Accounting Manager, Program Manager, Program Viewer를 말하며, 프로그램 담당 역할이란 프로그램별로 지정하는 Program Owner, Program Assistant, Program Viewer를 말합니다.',
        '•	2단계 인증이란 비밀번호 외에 인증 앱의 인증 코드로 본인 여부를 추가로 확인하는 절차를 말합니다.',
      ],
    },
    {
      heading: '제3조 약관의 게시와 개정',
      paragraphs: [
        '본 약관은 관리자 회원가입 화면에서 확인할 수 있으며, JA Korea는 약관을 개정하는 경우 적용일자 7일 전(관리자에게 불리하거나 중요한 변경은 30일 전)부터 관리자에게 이메일로 알립니다.',
      ],
    },
    {
      heading: '제4조 가입 및 승인',
      paragraphs: [
        '•	관리자는 @jakorea.org 이메일로만 가입할 수 있으며, 휴대폰 본인인증과 필수 동의를 마친 뒤 가입을 신청합니다.',
        '•	가입 신청은 Master 관리자가 승인한 후 이용할 수 있으며, 승인 시 권한 유형을 지정합니다.',
        '•	JA Korea는 소속 확인이 되지 않거나 허위 정보로 신청한 경우 가입을 반려할 수 있습니다.',
      ],
    },
    {
      heading: '제5조 권한 관리',
      paragraphs: [
        '•	권한 유형은 Master가 지정·변경합니다.',
        '•	프로그램 담당 역할은 프로그램을 등록한 관리자가 최초 Program Owner가 되며, 이후 지정·변경은 Program Owner가 합니다.',
        '•	관리자는 부여받은 권한 범위 안에서만 어드민 서비스를 이용하며, 권한 부여·변경·회수 이력은 기록·보관합니다. ',
      ],
    },
    {
      heading: '제6조 계정 보안',
      paragraphs: [
        '•	관리자는 영문·숫자·특수문자를 조합한 12자 이상의 비밀번호를 사용하고, 로그인 시 2단계 인증을 거쳐야 합니다. 관리자에게는 소셜 계정 로그인을 제공하지 않습니다.',
        '•	비밀번호 또는 2단계 인증에 연속 5회 실패하면 30분간 로그인이 제한됩니다.',
        '•	30분 동안 사용하지 않으면 로그인이 종료되며, 로그인 후 12시간이 지나면 다시 인증해야 합니다. 같은 계정으로 새로 로그인하면 기존 접속은 종료됩니다.',
        '•	관리자는 계정과 인증 수단을 다른 사람에게 제공하거나 함께 사용해서는 안 됩니다.',
      ],
    },
    {
      heading: '제7조 개인정보 보호 의무',
      paragraphs: [
        '•	관리자는 업무에 필요한 범위에서만 개인정보를 열람·이용하며, 원문 열람·수정·다운로드 시 조회 이력이 기록됩니다.',
        '•	주민등록번호 등이 포함된 파일은 다운로드 시 암호를 설정해 보관하며, 업무 목적 외로 외부에 제공하거나 유출해서는 안 됩니다.',
        '•	관리자 코멘트 등 입력란에 주민등록번호·건강정보 등 민감정보를 입력해서는 안 됩니다.',
      ],
    },
    {
      heading: '제8조 휴면 및 탈퇴',
      paragraphs: [
        '3개월 이상 로그인하지 않은 관리자 계정은 휴면으로 전환하며, 휴면 포함 3년이 지나면 자동 탈퇴합니다. 관리자는 언제든 탈퇴를 요청할 수 있으며, 관리자 로그인·접근권한 변경 이력은 관련 기준에 따라 3년간 보관합니다.',
      ],
    },
    {
      heading: '제9조 이용 제한',
      paragraphs: [
        '관리자가 본 약관을 위반하거나 권한을 부정하게 이용한 경우 JA Korea는 권한을 회수하거나 이용을 제한할 수 있습니다.',
      ],
    },
    {
      heading: '제10조 서비스의 변경 및 중단',
      paragraphs: [
        'JA Korea는 운영상·기술상 필요에 따라 어드민 서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다.',
      ],
    },
    {
      heading: '제11조 기타',
      paragraphs: [
        '본 약관에 정하지 않은 사항은 관련 법령, JA Korea 내부 규정 및 개인정보처리방침에 따릅니다.',
      ],
    },
  ],
}

/** 개인정보 수집·이용 동의 — 본문 편집 SSOT */
export const PRIVACY_POLICY_CONTENT: TermsDocumentContent = {
  sections: [
    {
      heading: '',
      paragraphs: [
        'JA Korea는 어드민 서비스 이용을 위한 관리자 회원가입과 계정 관리를 위해 아래와 같이 개인정보를 수집·이용합니다.',
      ],
    },
    {
      heading: '1. 수집·이용 목적',
      paragraphs: [
        '•	관리자 회원가입 및 본인 확인',
        '•	관리자 계정 관리(가입 승인, 권한 부여·변경, 휴면, 탈퇴)',
        '•	2단계 인증을 통한 어드민 서비스 접근 통제',
        '•	접속·처리 기록 관리 및 보안 사고 대응',
        '•	서비스 이용 관련 안내 발송',
      ],
    },
    {
      heading: '2. 수집 항목',
      paragraphs: [
        '세부 수집 항목은 본 문서 5장의 항목 정의를 기준으로 하며, 실제 회원가입 화면에서 필수/선택 표시를 명확히 구분해야 합니다.',
      ],
      table: {
        columns: ['구분', '수집 항목'],
        rows: [
          [
            '필수',
            '이름, 성별, 생년월일, 휴대폰 번호, 이메일 주소(@jakorea.org), 비밀번호, 본인인증 결과(인증 여부·일시), 중복가입 확인정보(CI·DI 암호화값)',
          ],
          ['승인 후 생성', '권한 유형, 담당 프로그램, 2단계 인증(MFA) 등록 정보'],
          [
            '서비스 이용 중 자동 생성',
            '가입 일시, 회원 상태, 로그인·접근권한 변경 이력, 접속 IP, 기기·브라우저 정보',
          ],
        ],
      },
    },
    {
      heading: '3. 보유 및 이용기간',
      paragraphs: [
        '회원 탈퇴 시까지 보유·이용합니다. 중복가입 확인정보(CI·DI 암호화값)는 탈퇴 시 즉시 파기합니다. 3개월 이상 로그인하지 않으면 휴면으로 전환하며, 휴면 포함 3년 시점에 자동 탈퇴합니다. 관리자 로그인·접근권한 변경 이력은 3년, 약관 동의 이력은 탈퇴 후 2년간 보관한 뒤 파기합니다.',
      ],
    },
    {
      heading: '4. 동의 거부권 및 불이익',
      paragraphs: [
        '개인정보 수집·이용 동의를 거부할 권리가 있습니다. 다만 동의하지 않으면 관리자 회원가입과 어드민 서비스 이용이 제한됩니다.',
      ],
    },
  ],
}

/** 2단계 인증(MFA) 설정 동의 — 본문 편집 SSOT */
export const MFA_SETUP_CONTENT: TermsDocumentContent = {
  intro:
    'JA Korea는 어드민 서비스의 안전한 이용과 관리자 계정 보호를 위해 관리자에게 2단계 인증 설정을 요구할 수 있습니다. 2단계 인증은 관리자 계정의 ID와 비밀번호 외에 별도의 인증 수단을 통해 본인 여부를 추가로 확인하는 보안 절차입니다.',
  sections: [
    {
      heading: '1. 적용 대상',
      paragraphs: [
        '본 동의는 JA Korea 어드민 서비스를 이용하는 내부 관리자에게 적용됩니다. 일반 회원에게는 적용되지 않습니다.',
      ],
    },
    {
      heading: '2. 설정 방법',
      paragraphs: [
        '관리자는 Microsoft Authenticator 앱 등 JA Korea가 정한 인증 앱에 어드민 화면의 QR 코드를 등록한 뒤, 인증 앱에서 생성되는 6자리 인증 코드를 입력하여 2단계 인증 설정을 완료합니다.',
      ],
    },
    {
      heading: '3. 이용 목적',
      paragraphs: [
        '관리자 계정의 부정 사용을 방지하고, 어드민 서비스에서 처리되는 정보와 권한을 안전하게 보호하기 위해 사용됩니다.',
      ],
    },
    {
      heading: '4. 보유 및 이용기간',
      paragraphs: ['회원 탈퇴 시까지 보유·이용합니다.'],
    },
    {
      heading: '5. 인증정보 관리',
      paragraphs: [
        '관리자는 2단계 인증에 사용되는 휴대기기, 인증 앱 및 인증정보를 안전하게 관리하여야 하며, 이를 제3자에게 제공하거나 이용하게 해서는 안 됩니다. 휴대기기 변경, 인증 앱 삭제, 인증정보 분실 등으로 2단계 인증 이용이 어려운 경우 JA Korea가 정한 절차에 따라 본인 확인 또는 계정 복구 절차를 진행해야 합니다. 이 경우 Master 관리자가 해당 관리자 계정의 2단계 인증을 재발급하며, 관리자는 다음 로그인 시 인증 앱을 다시 등록합니다.',
      ],
    },
    {
      heading: '6. 이용 제한',
      paragraphs: [
        '관리자가 2단계 인증 설정을 완료하지 않거나 필요한 시점에 인증 코드 입력을 완료하지 않는 경우 어드민 서비스 이용이 제한됩니다.',
      ],
    },
    {
      heading: '7. 동의 내용',
      paragraphs: [
        '관리자는 어드민 서비스 이용을 위한 2단계 인증 설정 및 이용 절차에 동의하며, 어드민 서비스 이용 과정에서 추가 인증 절차가 적용될 수 있음을 확인합니다. 본 동의는 어드민 이용을 위한 필수 보안 절차이므로 직접 철회할 수 없습니다.',
      ],
    },
  ],
}

/** 마케팅 정보 수신 동의 — 본문 편집 SSOT */
export const MARKETING_CONSENT_CONTENT: TermsDocumentContent = {
  sections: [
    {
      heading: '',
      paragraphs: [
        'JA Korea는 교육 프로그램, 행사, 캠페인 등 JA Korea의 활동과 관련된 정보를 이메일, 문자(SMS), 카카오톡으로 안내할 수 있습니다.',
      ],
    },
    {
      heading: '1. 수집·이용 목적',
      paragraphs: [
        '• JA Korea 활동 및 프로그램 안내',
        '• 행사, 캠페인, 뉴스레터 발송',
        '• 참여 기회 및 후원/협력 정보 안내',
      ],
    },
    {
      heading: '2. 이용 항목',
      paragraphs: ['• 이름', '• 이메일 주소', '• 휴대폰 번호', '• 회원 유형'],
    },
    {
      heading: '3. 안내 채널',
      paragraphs: ['이메일, 문자(SMS), 카카오톡'],
    },
    {
      heading: '4. 보유 및 이용기간',
      paragraphs: [
        '동의 철회 또는 회원 탈퇴 시까지 보유·이용합니다. JA Korea는 동의일로부터 2년마다 수신 동의 여부를 확인하며, 동의·거부·철회 처리 결과는 14일 이내에 알려 드립니다. 만 14세 미만 회원이 만 14세 이상 회원으로 전환하는 경우 회원 본인에게 수신 동의 여부를 다시 확인하며, 동의하지 않으면 기존 동의(법정대리인 동의)는 철회된 것으로 처리합니다.',
      ],
    },
    {
      heading: '5. 동의 거부권 및 불이익',
      paragraphs: [
        '마케팅 정보 수신 동의는 선택 사항입니다. 동의하지 않아도 회원가입 및 기본 서비스 이용에는 제한이 없습니다.',
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
