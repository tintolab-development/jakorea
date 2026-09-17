import {
  PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE,
  PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE,
} from '@/features/template/lib/program-registration-editor-state'

/** `registration-general` — forms-surveys draft API 연동 */
export const REGISTRATION_GENERAL_USE_REMOTE_DRAFT_API = true

/** `registration-economy` — 1사1교 등록 공통정보 draft */
export const REGISTRATION_ECONOMY_USE_REMOTE_DRAFT_API = true

/**
 * templateCode별 원격 draft API 사용 여부.
 * env·JWT 게이트는 `shouldUseFormsSurveysRemoteApi`에서 별도 확인한다.
 */
export function shouldUseRemoteDraftApiForTemplateCode(templateCode: string): boolean {
  if (templateCode === PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE) {
    return REGISTRATION_GENERAL_USE_REMOTE_DRAFT_API
  }
  if (templateCode === PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE) {
    return REGISTRATION_ECONOMY_USE_REMOTE_DRAFT_API
  }
  return true
}

/**
 * 개발 전용 — remote load 실패 시 localStorage fallback.
 * 운영·스테이징에서는 끄고 remote SSOT만 사용한다.
 */
export function isFormTemplateLocalFallbackEnabled(): boolean {
  return String(import.meta.env.VITE_FORM_TEMPLATE_LOCAL_FALLBACK ?? '') === '1'
}
