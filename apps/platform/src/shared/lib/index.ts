/** 공유 유틸 barrel */
export { getDevAuthLoggedIn, setDevAuthLoggedIn } from './dev-auth'
export {
  DEV_MEMBER_PROFILE_OPTIONS,
  getDevMemberProfile,
  setDevMemberProfile,
} from './dev-member-profile'
export {
  EMAIL_ID_MESSAGES,
  isValidEmailId,
  normalizeEmailId,
  validateEmailId,
} from './email-id'
export type { EmailIdErrorCode, EmailIdValidationResult } from './email-id'
export { platformBreakpoints, platformMediaQueries } from './breakpoints'
export type { PlatformBreakpointKey } from './breakpoints'
export { buildYouTubeNocookieEmbedSrc, extractYouTubeVideoId } from './youtube'
