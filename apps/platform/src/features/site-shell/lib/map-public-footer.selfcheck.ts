/**
 * 푸터 공개 응답 머지
 */
import assert from 'node:assert/strict'
import { mapPublicFooter, SITE_FOOTER_FALLBACK } from './map-public-footer.ts'

assert.equal(SITE_FOOTER_FALLBACK.menus.length, 8)
assert.equal(SITE_FOOTER_FALLBACK.menus.at(-1)?.label, '온라인 학습관리')
assert.equal(SITE_FOOTER_FALLBACK.partners.length, 3)

const remote = mapPublicFooter({
  menus: [
    {
      menuCode: 'TERMS',
      label: '이용약관',
      linkType: 'INTERNAL',
      externalUrl: null,
      displayOrder: 1,
    },
    {
      menuCode: 'PRIVACY',
      label: '개인정보처리방침',
      linkType: 'INTERNAL',
      displayOrder: 2,
    },
    {
      menuCode: 'DIRECTIONS',
      label: '오시는길',
      linkType: 'INTERNAL',
      displayOrder: 3,
    },
    {
      menuCode: 'NTS_DISCLOSURE',
      label: '국세청 공시 및 공개 내역',
      linkType: 'EXTERNAL',
      externalUrl: 'https://www.hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index.xml',
      displayOrder: 4,
    },
    {
      menuCode: 'EXTRA_MENU',
      label: '없는 메뉴',
      linkType: 'EXTERNAL',
      externalUrl: 'https://example.com',
      displayOrder: 8,
    },
    {
      menuCode: 'DONATION',
      label: '후원하기',
      linkType: 'EXTERNAL',
      externalUrl: '   ',
      displayOrder: 6,
    },
  ],
  organization: {
    organizationName: '사단법인 제이에이코리아',
    organizationDescription: null,
    address: '서울특별시 강서구 마곡중앙로 171 마곡나루역 프라이빗타워2차 714호',
    postalCode: '07788',
    representativeName: '이은형',
    businessRegistrationNumber: '107-82-10367',
    phone: '02-783-2367',
    fax: '070-4275-5115',
    email: 'jakorea@jakorea.org',
  },
  partners: [],
})

assert.ok(remote)
assert.equal(remote.source, 'remote')
assert.equal(remote.menus.find(menu => menu.key === 'DIRECTIONS')?.label, '오시는 길')
assert.equal(remote.menus.length, 6)
assert.equal(remote.menus.at(-1)?.label, '온라인 학습관리')
assert.equal(
  remote.menus.some(menu => menu.label === '없는 메뉴'),
  false
)
assert.equal(remote.addressLine.includes('('), false)
const donation = remote.menus.find(menu => menu.key === 'DONATION')
assert.equal(donation?.kind, 'noop')
assert.equal(remote.partners.length, 0)

const withPartners = mapPublicFooter({
  menus: [],
  partners: [
    {
      partnerId: 1,
      organizationName: '기획재정부',
      logoUrl: 'https://cdn.example.com/logo.png',
      externalUrl: 'https://www.moef.go.kr/',
      displayOrder: 1,
    },
    {
      partnerId: 2,
      organizationName: '국세청',
      logoUrl: 'https://cdn.example.com/nts.png',
      externalUrl: 'javascript:alert(1)',
      displayOrder: 2,
    },
  ],
})
assert.ok(withPartners)
assert.equal(withPartners.partners[0]?.href, 'https://www.moef.go.kr/')
assert.equal(withPartners.partners[1]?.href, null)

assert.equal(mapPublicFooter([]), null)

console.log('map-public-footer.selfcheck ok')
