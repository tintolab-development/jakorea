/** 공유 유틸 barrel */
export { getDevAuthLoggedIn, setDevAuthLoggedIn } from './dev-auth'
export {
  EMAIL_ID_MESSAGES,
  isValidEmailId,
  normalizeEmailId,
  validateEmailId,
} from './email-id'
export type { EmailIdErrorCode, EmailIdValidationResult } from './email-id'
export { buildYouTubeNocookieEmbedSrc, extractYouTubeVideoId } from './youtube'
