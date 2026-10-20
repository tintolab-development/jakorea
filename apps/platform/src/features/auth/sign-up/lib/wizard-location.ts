import { SIGN_UP_UNDER_AGE_TOTAL_STEPS } from './constants'

export const SIGN_UP_PATH = '/auth/sign-up'

export type SignUpWizardPhase =
  | 'guardian-consent'
  | 'guardian-agreement'
  | 'guardian-profile'
  | 'guardian-identity'
  | 'identity'
  | 'agreement'

export type SignUpWizardLocationState = {
  signupWizard?: boolean
}

export function parseSignUpStep(searchParams: URLSearchParams, maxStep: number) {
  const raw = Number(searchParams.get('step') ?? '1')
  if (!Number.isFinite(raw)) return 1
  return Math.min(Math.max(Math.trunc(raw), 1), maxStep)
}

export function isUnderAgeSignUpWizardPhase(phase: SignUpWizardPhase | null): boolean {
  return (
    phase === 'guardian-consent' ||
    phase === 'guardian-agreement' ||
    phase === 'guardian-profile' ||
    phase === 'guardian-identity'
  )
}

export function parseSignUpPhase(searchParams: URLSearchParams): SignUpWizardPhase | null {
  const phase = searchParams.get('phase')
  switch (phase) {
    case 'guardian-consent':
    case 'guardian-agreement':
    case 'guardian-profile':
    case 'guardian-identity':
    case 'identity':
    case 'agreement':
      return phase
    default:
      return null
  }
}

export function buildSignUpSearch(step: number, phase?: SignUpWizardPhase | null) {
  const params = new URLSearchParams()
  params.set('step', String(step))
  if (phase) {
    params.set('phase', phase)
  }
  return params
}

export function isSignUpWizardLocationState(
  state: unknown,
): state is SignUpWizardLocationState {
  return Boolean(state && typeof state === 'object' && (state as SignUpWizardLocationState).signupWizard)
}

/** 로그인·헤더 등에서 회원가입을 새로 시작할 때 (step=1, phase 없음, wizard history state 없음) */
export function isFreshSignUpWizardEntry(
  searchParams: URLSearchParams,
  locationState: unknown,
  maxStep = SIGN_UP_UNDER_AGE_TOTAL_STEPS,
): boolean {
  const step = parseSignUpStep(searchParams, maxStep)
  const phase = parseSignUpPhase(searchParams)
  return step === 1 && phase == null && !isSignUpWizardLocationState(locationState)
}
