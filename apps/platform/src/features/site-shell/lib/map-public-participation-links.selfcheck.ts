/**
 * 참여하기 공개 링크 매핑
 */
import assert from 'node:assert/strict'
import { platformQueryKeys } from '../../../shared/api/query-keys.ts'
import { SITE_FOOTER_FALLBACK } from './map-public-footer.ts'
import { SITE_GNB_FALLBACK } from './map-public-gnb.ts'
import {
  applyParticipationLinksToFooter,
  applyParticipationLinksToGnb,
  mapPublicParticipationLinks,
} from './map-public-participation-links.ts'

assert.deepEqual(platformQueryKeys.site.participationLinks(), [
  'platform',
  'site',
  'participation-links',
])

const mapped = mapPublicParticipationLinks([
  {
    menuCode: 'ONLINE_LEARNING',
    menuName: '온라인 학습',
    externalUrl: null,
    displayOrder: 1,
  },
  {
    menuCode: 'ALUMNI',
    menuName: 'Alumni',
    externalUrl: 'https://gatheralumni.org/',
    displayOrder: 2,
  },
  {
    menuCode: 'ALUMNI',
    externalUrl: 'javascript:alert(1)',
  },
  {
    menuCode: 'UNKNOWN',
    externalUrl: 'https://example.com',
  },
])

assert.equal(mapped.onlineLearning, null)
// 유효하지 않은 URL은 무시 — 직전 유효 ALUMNI URL 유지
assert.equal(mapped.alumni, 'https://gatheralumni.org/')

const gnb = applyParticipationLinksToGnb(SITE_GNB_FALLBACK, mapped)
const participation = gnb.groups.find(group => group.groupCode === 'PARTICIPATION')
const online = participation?.children.find(item => item.menuCode === 'PARTICIPATION_ONLINE')
const alumni = participation?.children.find(item => item.menuCode === 'PARTICIPATION_ALUMNI')
assert.equal(online?.href, undefined)
assert.equal(alumni?.href, 'https://gatheralumni.org/')
assert.equal(alumni?.external, true)

const footer = applyParticipationLinksToFooter(SITE_FOOTER_FALLBACK, {
  onlineLearning: 'https://learn.example.com/',
  alumni: null,
})
const learning = footer.menus.find(item => item.key === 'LOCAL_ONLINE_LEARNING')
assert.ok(learning)
assert.equal(learning.kind, 'external')
if (learning.kind === 'external') {
  assert.equal(learning.href, 'https://learn.example.com/')
}

assert.deepEqual(
  mapPublicParticipationLinks({ success: true, data: [] }),
  { onlineLearning: null, alumni: null },
)

console.log('map-public-participation-links.selfcheck ok')
