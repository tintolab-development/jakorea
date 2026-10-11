/** 소셜 계정 연결 안내 모달 — CMS 관리자 연결 화면 */

export const SOCIAL_CONNECT_CONSENT_MODAL_TITLE = '소셜 계정 연결 안내'

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
      'JA Korea 계정과 소셜 계정 간 연결 관리',
      '부정 로그인 방지 및 계정 보안 관리',
    ],
  },
  {
    title: '2. 수집 항목',
    items: [
      '소셜 계정 제공자, 식별자, 이메일',
      '연결 일시 및 연결 상태',
    ],
  },
  {
    title: '3. 유의사항',
    items: [
      '소셜 계정 연결은 관리자 로그인을 위한 수단이며, 회원가입 수단이 아닙니다.',
      'JA Korea 관리자 가입 및 관리자 승인을 완료한 후에만 연결할 수 있습니다.',
      '하나의 JA Korea 계정에 Google, 네이버, 카카오 등 여러 소셜 계정을 연결할 수 있습니다.',
      '이미 다른 JA Korea 계정에 연결된 소셜 계정은 중복으로 연결할 수 없습니다.',
      '연결된 소셜 계정은 [내 정보 수정]에서 관리·해제할 수 있습니다.',
      '소셜 계정 연결을 해제하더라도 이메일과 비밀번호로 로그인할 수 있습니다.',
    ],
  },
]
