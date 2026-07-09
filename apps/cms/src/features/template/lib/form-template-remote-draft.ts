import { PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE } from '@/features/template/lib/program-registration-editor-state'

/** `registration-general` — forms-surveys draft API 연동 */
export const REGISTRATION_GENERAL_USE_REMOTE_DRAFT_API = true

/**
 * templateCode별 원격 draft API 사용 여부.
 * env·JWT 게이트는 `shouldUseFormsSurveysRemoteApi`에서 별도 확인한다.
 */
export function shouldUseRemoteDraftApiForTemplateCode(templateCode: string): boolean {
  if (templateCode === PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE) {
    return REGISTRATION_GENERAL_USE_REMOTE_DRAFT_API
  }
  return true
}
