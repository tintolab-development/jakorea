export type ProgramApplyDetailStatus = 'loading' | 'ready' | 'not-found' | 'error'

export type ApplyGateState =
  | 'loading'
  | 'login-required'
  | 'config-error'
  | 'not-found'
  | 'ready'

export function resolveApplyGate(input: {
  hasAccessToken: boolean
  remoteConfigured: boolean
  numericProgramId: number | null
  status: ProgramApplyDetailStatus
}): ApplyGateState {
  if (input.numericProgramId == null) {
    return 'not-found'
  }
  if (input.status === 'loading') {
    return 'loading'
  }
  if (!input.hasAccessToken) {
    return 'login-required'
  }
  if (!input.remoteConfigured) {
    return 'config-error'
  }
  if (input.status === 'not-found') {
    return 'not-found'
  }
  if (input.status === 'error') {
    return 'config-error'
  }
  return 'ready'
}

export const APPLY_GATE_LOGIN_SUBMIT_MESSAGE =
  '로그인이 필요합니다. 로그인 후 다시 신청해 주세요.'

export const APPLY_GATE_CONFIG_ERROR_MESSAGE =
  '신청 API가 연결되지 않았습니다. 환경 설정을 확인하거나 잠시 후 다시 시도해 주세요.'

export const APPLY_GATE_NOT_FOUND_MESSAGE = '프로그램을 찾을 수 없습니다.'
