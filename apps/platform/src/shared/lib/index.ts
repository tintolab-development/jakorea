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
export {
  ADMIN_REGISTERED_ONBOARDING_PATH,
  PLATFORM_ADMIN_ONBOARDING_REQUIRED_KEY,
  isAdminOnboardingRequired,
  resolveLoginRequiredPath,
  setAdminOnboardingRequired,
} from './admin-onboarding-session'
export { queryClient } from './query-client'
export {
  DEV_AUTH_CHANGE_EVENT,
  getDevAuthLoggedIn,
  setDevAuthLoggedIn,
  shouldUsePlatformMockData,
  withPlatformMockData,
} from './dev-auth'
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
  EDUCATION_LEVEL_BORDER_FALLBACK_HEX,
  EDUCATION_LEVEL_CSS_VARS,
  EDUCATION_LEVEL_HEX,
  EDUCATION_LEVEL_KEYS,
  EDUCATION_LEVEL_LABELS,
  getEducationLevelColor,
  getEducationLevelLabel,
  isEducationLevelKey,
} from './education-level-colors'
export type { EducationLevelKey } from './education-level-colors'
export {
  downloadAttachment,
  getAttachmentFileExtension,
  getEmptyAttachmentMimeType,
  needsEmptyAttachmentFallback,
} from './download-attachment'
export { buildYouTubeNocookieEmbedSrc, extractYouTubeVideoId } from './youtube'
