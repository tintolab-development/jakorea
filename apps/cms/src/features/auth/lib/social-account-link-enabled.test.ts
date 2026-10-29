import { describe, expect, it } from 'vitest'

import { SOCIAL_ACCOUNT_LINK_ENABLED } from './social-account-link-enabled'

describe('SOCIAL_ACCOUNT_LINK_ENABLED', () => {
  it('temporarily hides social-account link UI', () => {
    expect(SOCIAL_ACCOUNT_LINK_ENABLED).toBe(false)
  })
})
