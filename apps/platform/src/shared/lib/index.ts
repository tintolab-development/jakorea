/** 공유 유틸 barrel */
export { getApiBaseUrl, isRemoteApiConfigured } from './api-remote-env'
export {
  PLATFORM_AUTH_EXPIRES_AT_KEY,
  PLATFORM_AUTH_REFRESH_TOKEN_KEY,
  PLATFORM_AUTH_TOKEN_KEY,
  clearAuthTokens,
  getAccessToken,
  getExpiresAt,
  getRefreshToken,
  setAuthTokens,
} from './auth-token'
export { queryClient } from './query-client'
export { DEV_AUTH_CHANGE_EVENT, getDevAuthLoggedIn, setDevAuthLoggedIn } from './dev-auth'
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
export {
  downloadAttachment,
  getAttachmentFileExtension,
  getEmptyAttachmentMimeType,
  needsEmptyAttachmentFallback,
} from './download-attachment'
export { buildYouTubeNocookieEmbedSrc, extractYouTubeVideoId } from './youtube'
