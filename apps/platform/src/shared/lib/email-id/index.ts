export {
  EMAIL_ID_BRAND_TOKENS,
  EMAIL_ID_INAPPROPRIATE_TOKENS,
  EMAIL_ID_LOCAL_PART_MAX_LENGTH,
  EMAIL_ID_MAX_LENGTH,
  EMAIL_ID_MESSAGES,
  EMAIL_ID_RESERVED_LOCAL_PARTS,
} from './constants'
export type { EmailIdErrorCode, EmailIdValidationResult } from './validation'
export { isValidEmailId, normalizeEmailId, validateEmailId } from './validation'
