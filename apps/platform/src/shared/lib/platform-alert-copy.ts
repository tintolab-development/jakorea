/**
 * Platform(사용자 홈페이지) 공통 안내 팝업 문구 — Figma 사용자 플랫폼(tiDywBHEhTkruOHjh1ctuT)
 * 「오류 제한 팝업」 14491-2533 의 '변경' 문구. CMS 팝업 문구(별도 CMS 시안)와 섞지 않는다.
 * 설명의 `\n`은 PFAlertModal에서 줄바꿈으로 보인다.
 */
export type PlatformAlertCopy = {
  title: string
  description: string
}

export const PLATFORM_ALERT_COPY = {
  /** 수료증 발급 불가 — 신청일로부터 3년 경과 */
  certificateExpired: {
    title: '수료증 발급 기한이 만료되었어요.',
    description: '수료증은 프로그램 신청일로부터\n3년까지만 발급 받을 수 있어요.',
  },
  /** 공통 제한 안내 / 항목 선택 */
  noItemSelected: {
    title: '선택된 항목이 없어요.',
    description: '항목을 선택한 뒤 다시 시도해 주세요.',
  },
  /** 공통 제한 안내 / 필수 항목 미동의 */
  requiredNotAgreed: {
    title: '필수 항목에 동의해 주세요.',
    description:
      '모든 필수 항목에 동의해야 제출할 수 있어요.\n동의하지 않은 항목을 확인 후 다시 제출해 주세요.',
  },
  /** 공통 제한 안내 / 처리 실패 */
  requestFailed: {
    title: '요청을 처리하지 못했어요.',
    description: '잠시 후 다시 시도해 주세요.',
  },
  /** 공통 제한 안내 / 처리 제한 */
  rateLimited: {
    title: '요청이 반복되어 제한되었어요.',
    description: '짧은 시간 동안 요청을 반복하여 처리가 제한되었어요.\n잠시 후 다시 시도해 주세요.',
  },
  /** 네트워크 오류 안내 */
  networkError: {
    title: '일시적인 네트워크 오류가 발생했어요.',
    description: '잠시 후 다시 시도해 주세요.',
  },
  /** 자동 로그아웃된 경우 */
  autoLoggedOut: {
    title: '자동으로 로그아웃되었어요.',
    description: '보안을 위해 로그인 세션이 종료되었어요.\n계속 이용하시려면 다시 로그인해 주세요.',
  },
  /** 중복 가입 시 — [확인] + [로그인하기] */
  duplicateMember: {
    title: '이미 가입된 회원이에요.',
    description:
      '본인인증한 정보로 가입된 계정이 있어요.\n가입한 이메일로 로그인하거나, 이메일 찾기를 이용해 주세요.',
  },
  /** 비밀번호 재사용 시 */
  passwordRecentlyUsed: {
    title: '사용할 수 없는 비밀번호예요.',
    description: '최근에 사용한 비밀번호 5개는 다시 쓸 수 없어요.\n다른 비밀번호를 입력해 주세요.',
  },
  /** 비밀번호 변경 시 */
  passwordChanged: {
    title: '비밀번호가 변경되었어요.',
    description: '다음부터는 새 비밀번호로 로그인해 주세요.',
  },
} as const satisfies Record<string, PlatformAlertCopy>

/** 공통 제한 안내 / 필수 항목 미입력 — 설명은 빨간 `*`가 있어 `PFRequiredFieldsIncompleteDescription`을 쓴다 */
export const PLATFORM_REQUIRED_NOT_FILLED_TITLE = '입력하지 않은 필수 항목이 있어요.'
