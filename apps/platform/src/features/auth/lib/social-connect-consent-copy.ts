export const SOCIAL_CONNECT_CONSENT_MODAL_TITLE = '소셜 계정 연결 안내 및 동의 약관'

export const SOCIAL_CONNECT_CONSENT_INTRO =
  'JA Korea 계정에 소셜 계정을 연결하면, 다음부터 연결된 소셜 계정으로 간편하게 로그인할 수 있습니다.'

export const SOCIAL_CONNECT_CONSENT_SECTIONS: ReadonlyArray<{
  title: string
  items: readonly string[]
}> = [
  {
    title: '1. 이용 목적',
    items: [
      '소셜 계정 기반 간편 로그인 제공',
      'JA Korea 계정과 소셜 계정 연결 관리',
      '부정 로그인 방지 및 계정 보안 관리',
    ],
  },
  {
    title: '2. 수집 항목',
    items: [
      '소셜 계정 제공자',
      '소셜 계정 식별자',
      '소셜 계정 이메일',
      '연결 일시',
      '연결 상태',
    ],
  },
  {
    title: '3. 유의사항',
    items: [
      '소셜 계정은 회원가입 수단이 아니며, 만 14세 이상 일반 회원과 교사 회원에게 제공되는 간편 로그인 수단입니다.',
      'JA Korea 회원가입 완료 후 연결할 수 있습니다.',
      '하나의 JA Korea 계정에 Google, 네이버, 카카오 계정을 복수로 연결할 수 있습니다.',
      '이미 다른 JA Korea 계정에 연결된 소셜 계정은 연결할 수 없습니다.',
      '연결된 소셜 계정은 마이페이지에서 언제든 해제할 수 있습니다.',
      '소셜 계정을 해제해도 이메일 ID와 비밀번호로 계속 로그인할 수 있습니다.',
    ],
  },
]
