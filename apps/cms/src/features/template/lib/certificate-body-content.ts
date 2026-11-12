/**
 * 인증서 발급 본문 문구 (기획 확정 2026-11-12).
 * - 강사 활동인증서·봉사 활동인증서·참가인증서: 같은 문구
 * - 수료증: 수료 문구
 * 양식 시드(`settingsJson.bodyContent`)와 실발급 미리보기가 이 값을 함께 쓴다.
 * 서버 시드 기본 본문(BE-17)과 같은 값이어야 한다.
 */
export const ACTIVITY_CERTIFICATE_BODY_CONTENT =
  '귀하는 위 프로그램 활동에\n성실히 참여하였음을 확인합니다.'

export const COMPLETION_CERTIFICATE_BODY_CONTENT =
  '귀하는 위의 과정에 참여하여\n교육과정을 수료하였음을 확인합니다.'

/** 참가인증서는 활동인증서와 같은 문구를 쓴다. */
export const PARTICIPATION_CERTIFICATE_BODY_CONTENT = ACTIVITY_CERTIFICATE_BODY_CONTENT
