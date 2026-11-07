import assert from 'node:assert/strict'
import { createAgreementPortraitDraft } from '@jakorea/form-schema/writing-form'
import {
  attachPortraitFilledDocumentToTermsAgreements,
  buildPortraitFilledDocument,
} from './map-portrait-consent-filled-document.ts'

const draft = createAgreementPortraitDraft()
const withoutIds = buildPortraitFilledDocument(draft)
assert.equal('templateCode' in withoutIds, false)
assert.equal('templateVersionId' in withoutIds, false)
assert.equal(withoutIds.schemaJson != null, true)

const withIds = buildPortraitFilledDocument(draft, {
  templateVersionId: 88,
  templateCode: 'agreement-portrait',
})
assert.equal(withIds.templateVersionId, 88)
assert.equal(withIds.templateCode, 'agreement-portrait')

const rows = attachPortraitFilledDocumentToTermsAgreements(
  [
    { termsType: 'SERVICE_TERMS', version: '1', agreed: true },
    { termsType: 'PORTRAIT_RIGHTS', version: '2', agreed: true },
  ],
  draft,
)
assert.equal(rows[0]?.filledDocument, undefined)
assert.equal(rows[1]?.filledDocument?.schemaJson != null, true)
assert.equal(rows[1]?.filledDocument?.templateCode, undefined)

console.log('map-portrait-consent-filled-document.selfcheck: ok')
