import assert from 'node:assert/strict'
import { pickSignupPortraitTermsDocument } from './pick-signup-portrait-terms.ts'

assert.equal(pickSignupPortraitTermsDocument(null), null)
assert.equal(pickSignupPortraitTermsDocument({ terms: [] }), null)

const portrait = pickSignupPortraitTermsDocument({
  memberType: 'GENERAL',
  ageGroup: 'ADULT',
  terms: [
    { termsType: 'SERVICE_TERMS', version: '1', content: 'svc' },
    {
      termsType: 'PORTRAIT_RIGHTS',
      version: '2',
      documentRequired: true,
      content: '{"schemaVersion":1,"paragraphs":[{"id":"p1"}]}',
      agreementPayload: { termsType: 'PORTRAIT_RIGHTS', version: '2', agreed: false },
    },
  ],
})
assert.equal(portrait?.termsType, 'PORTRAIT_RIGHTS')
assert.equal(portrait?.version, '2')
assert.equal(portrait?.documentRequired, true)

const fromPayload = pickSignupPortraitTermsDocument({
  terms: [{ agreementPayload: { termsType: 'PORTRAIT_RIGHTS', version: '9' }, content: 'x' }],
})
assert.equal(fromPayload?.agreementPayload?.version, '9')

console.log('pick-signup-portrait-terms.selfcheck: ok')
