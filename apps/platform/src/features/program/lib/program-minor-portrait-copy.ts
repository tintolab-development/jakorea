/** 만 14세 미만 회원 — 프로그램 신청 시 보호자 본인인증 + 프로그램 초상권 동의 문구 */

/**
 * (미사용 fallback) 필수 동의 안내 시트 미성년 문구.
 * 신청 흐름은 시트 없이 보호자 본인인증부터 시작한다 — `openRequiredConsentModal`.
 */
export const PROGRAM_MINOR_PORTRAIT_REQUIRED_COPY = {
  descriptionLines: [
    '만 14세 미만 회원의 경우 해당 항목의 동의가 필요해요.',
    '신청하시려면 동의서를 작성해 주세요.',
  ],
} as const

/** 1단계: 보호자 본인인증 모달 */
export const PROGRAM_GUARDIAN_IDENTITY_COPY = {
  title: '만 14세 미만 회원 보호자 본인인증',
  description:
    '프로그램 신청을 위해 보호자의 휴대폰 본인인증이 필요해요.\n보호자의 본인인증 이후 초상권 수집·이용 동의서 작성을 계속할 수 있어요.',
  verifyLabel: '보호자 본인인증하기',
} as const

/** 2단계: 보호자 정보 입력 안내 — 프로그램 신청 맥락 설명 (지원 승인 문구). 3단계는 초상권 동의서 화면 */
export const PROGRAM_GUARDIAN_INFO_DESCRIPTION =
  '보호자 본인인증이 완료됐어요. 프로그램 신청 회원과의 관계를 입력해 주세요.\n확인하면 보호자님이 초상권 수집·이용 동의서를 작성하는 화면으로 이동해요.'

export const PROGRAM_GUARDIAN_MISSING_MESSAGE =
  '등록된 보호자 정보를 확인할 수 없어요. 회원정보 수정에서 보호자 정보를 확인해 주세요.'
