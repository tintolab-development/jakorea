import { describe, expect, it } from 'vitest'
import {
  AGREEMENT_USER_MODE_AUTHOR_PLACEHOLDER,
  resolveAgreementUserModeAuthorDisplayName,
} from '@/features/template/lib/extract-agreement-draft-author-name'

describe('resolveAgreementUserModeAuthorDisplayName', () => {
  it('returns (작성자) when empty', () => {
    expect(resolveAgreementUserModeAuthorDisplayName('')).toBe(AGREEMENT_USER_MODE_AUTHOR_PLACEHOLDER)
    expect(resolveAgreementUserModeAuthorDisplayName('   ')).toBe(
      AGREEMENT_USER_MODE_AUTHOR_PLACEHOLDER
    )
  })

  it('returns trimmed name when present', () => {
    expect(resolveAgreementUserModeAuthorDisplayName(' 김철수 ')).toBe('김철수')
  })
})
