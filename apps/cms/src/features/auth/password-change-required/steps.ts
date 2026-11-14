/**
 * 관리자 등록 회원 최초 로그인 흐름 — 진행 단계 (시안 12111:298684: 2단계 스텝퍼)
 * 1 본인인증 → 2 비밀번호 변경
 */
// 총 단계 수는 wizard-state.ts의 PASSWORD_CHANGE_REQUIRED_TOTAL_STEPS(2)를 쓴다
export const PASSWORD_CHANGE_REQUIRED_STEP_IDENTITY = 1
export const PASSWORD_CHANGE_REQUIRED_STEP_CHANGE_PASSWORD = 2
export const PASSWORD_CHANGE_REQUIRED_STEP_PROGRESS_LABEL = '최초 로그인 진행 단계'
