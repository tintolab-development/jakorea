/**
 * 회원가입 스텝퍼에 보여 줄 단계 번호.
 *
 * 내부 마법사 단계(1~7)는 본인인증·약관 동의를 3단계 하나로 묶지만, 시안 스텝퍼는 화면마다 번호가 따로 있다.
 * - 14세 이상 일반·교사(8단계): 유형 1 → 생년월일 2 → 본인인증 3 → 약관 동의 4 → 이메일 5 → 비밀번호 6 → 추가정보 7 → 가입 정보 확인 8
 * - 14세 미만(9단계): 유형 1 → 생년월일 2 → 약관 동의 3 → 보호자 본인인증 4 → 보호자 정보 확인 5 → 이메일 6 → 비밀번호 7 → 추가정보 8 → 가입 정보 확인 9
 */
export const SIGN_UP_PROGRESS_TOTAL_STEPS = 8
export const SIGN_UP_UNDER_AGE_PROGRESS_TOTAL_STEPS = 9

export type SignUpProgressInput = {
  wizardStep: number
  isUnderAgeSignup: boolean
  /** 14세 이상: 본인인증을 마쳐 약관 동의 화면인지 */
  isIdentityVerified: boolean
  /** 14세 미만: 약관 동의를 마쳤는지 */
  isGuardianAgreementCompleted: boolean
  /** 14세 미만: 보호자 본인인증을 마쳤는지 */
  isGuardianIdentityVerified: boolean
}

export function resolveSignUpProgressStep(input: SignUpProgressInput): {
  current: number
  total: number
} {
  const { wizardStep } = input

  if (input.isUnderAgeSignup) {
    if (wizardStep <= 2) return { current: wizardStep, total: SIGN_UP_UNDER_AGE_PROGRESS_TOTAL_STEPS }
    if (wizardStep === 3) {
      const current = !input.isGuardianAgreementCompleted
        ? 3
        : !input.isGuardianIdentityVerified
          ? 4
          : 5
      return { current, total: SIGN_UP_UNDER_AGE_PROGRESS_TOTAL_STEPS }
    }
    return { current: wizardStep + 2, total: SIGN_UP_UNDER_AGE_PROGRESS_TOTAL_STEPS }
  }

  if (wizardStep <= 2) return { current: wizardStep, total: SIGN_UP_PROGRESS_TOTAL_STEPS }
  if (wizardStep === 3) {
    return { current: input.isIdentityVerified ? 4 : 3, total: SIGN_UP_PROGRESS_TOTAL_STEPS }
  }
  return { current: wizardStep + 1, total: SIGN_UP_PROGRESS_TOTAL_STEPS }
}
