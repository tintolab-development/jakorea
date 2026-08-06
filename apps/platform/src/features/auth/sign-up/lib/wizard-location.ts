export const SIGN_UP_PATH = '/auth/sign-up'

export type SignUpWizardPhase =
  | 'guardian-consent'
  | 'guardian-agreement'
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

export function parseSignUpPhase(searchParams: URLSearchParams): SignUpWizardPhase | null {
  const phase = searchParams.get('phase')
  switch (phase) {
    case 'guardian-consent':
    case 'guardian-agreement':
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
