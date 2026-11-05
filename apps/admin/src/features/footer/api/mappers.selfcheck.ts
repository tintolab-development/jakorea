/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/features/footer/api/mappers.selfcheck.ts
 */
import assert from 'node:assert/strict'
import {
  mapFooterPartnerToDomain,
  toFooterOrganizationUpdateRequest,
  toFooterPartnerUpdateRequest,
} from './mappers.ts'

const org = toFooterOrganizationUpdateRequest(
  {
    name: '  JA Korea  ',
    address: '서울',
    zipCode: '07788',
    representative: '대표',
    businessNumber: '107-82-10367',
    phone: '02-783-2367',
    fax: '070-4275-5115',
    email: 'jakorea@jakorea.org',
    organizationDescription: '',
    logoUrl: 'https://cdn.example.test/logo.png',
    logoAssetId: 12,
  },
  3,
  12,
)

assert.equal(org.organizationName, 'JA Korea')
assert.equal(org.address, '서울')
assert.equal(org.postalCode, '07788')
assert.equal(org.logoAssetId, 12)
assert.equal('address' in org && org.address !== undefined, true)
assert.equal(org.organizationDescription, undefined)

const partner = toFooterPartnerUpdateRequest(
  {
    id: 'footer-logo-1',
    partnerId: 1,
    sortOrder: 1,
    isActive: false,
    hasContent: true,
    name: '기획재정부',
    linkUrl: '',
    logoUrl: 'https://cdn.example.test/moef.png',
    logoAssetId: 77,
    version: 0,
  },
  77,
)
assert.equal(partner.enabled, false)
assert.equal('externalUrl' in partner, false)
assert.equal(partner.organizationName, '기획재정부')

const mapped = mapFooterPartnerToDomain({
  partnerId: 1,
  enabled: true,
  displayOrder: 1,
  organizationName: '기획재정부',
  externalUrl: 'https://www.moef.go.kr',
  version: 1,
})
assert.equal(mapped?.linkUrl, 'https://www.moef.go.kr')

console.log('footer mappers.selfcheck ok')
