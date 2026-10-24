/**
 * GNB 공개 응답 머지
 */
import assert from 'node:assert/strict'
import { platformQueryKeys } from '../../../shared/api/query-keys.ts'
import { mapPublicGnb } from './map-public-gnb.ts'
import { GNB_MENU_ROUTES, gnbFallbackGroups } from './menu-routes.ts'

assert.equal(gnbFallbackGroups.length, 5)
assert.equal(GNB_MENU_ROUTES.JA_ORGANIZATION.href, '/about/introduction')

const overlaid = mapPublicGnb([
  {
    groupCode: 'EDUCATION',
    groupName: '교육 소개',
    displayOrder: 1,
    menus: [
      { menuCode: 'EDU_CAREER', displayName: '진로·취업', displayOrder: 1 },
      { menuCode: 'NOT_A_MENU', displayName: '없는 메뉴', displayOrder: 2 },
      { menuCode: 'EDU_ECONOMY', displayName: '   ', displayOrder: 3 },
    ],
  },
  {
    groupCode: 'UNKNOWN_GROUP',
    groupName: '없는 그룹',
    displayOrder: 2,
    menus: [{ menuCode: 'EDU_CAREER', displayName: '진로취업', displayOrder: 1 }],
  },
])

assert.ok(overlaid)
assert.equal(overlaid.source, 'remote')
assert.equal(overlaid.groups.length, 1)
const career = overlaid.groups[0]?.children.find(item => item.menuCode === 'EDU_CAREER')
assert.equal(career?.label, '진로·취업')
assert.equal(career?.href, '/education/career')

const designLabelOverlay = mapPublicGnb([
  {
    groupCode: 'EDUCATION',
    groupName: '교육 소개',
    menus: [
      { menuCode: 'EDU_ENTREPRENEURSHIP', displayName: '기업가 정신' },
      { menuCode: 'EDU_DIGITAL_LITERACY', displayName: '디지털 리터러시' },
      { menuCode: 'EDU_MATERIAL', displayName: '교재 소개' },
    ],
  },
])
assert.equal(
  designLabelOverlay?.groups[0]?.children.find(item => item.menuCode === 'EDU_ENTREPRENEURSHIP')
    ?.label,
  '기업가정신'
)
assert.equal(
  designLabelOverlay?.groups[0]?.children.find(item => item.menuCode === 'EDU_DIGITAL_LITERACY')
    ?.label,
  '디지털리터러시'
)
assert.equal(
  designLabelOverlay?.groups[0]?.children.find(item => item.menuCode === 'EDU_MATERIAL')?.label,
  '교재'
)
assert.equal(
  overlaid.groups[0]?.children.some(item => item.menuCode === 'NOT_A_MENU'),
  false,
)

const mobileMenuDesignOverlay = mapPublicGnb([
  {
    groupCode: 'JA_KOREA',
    groupName: 'JA Korea',
    menus: [
      { menuCode: 'JA_NOTICE', displayName: '공지사항', displayOrder: 3 },
      { menuCode: 'JA_HISTORY', displayName: '연혁', displayOrder: 4 },
      { menuCode: 'JA_ORGANIZATION', displayName: '기관소개', displayOrder: 1 },
    ],
  },
  {
    groupCode: 'IMPACT_STORY',
    groupName: '임팩트',
    menus: [{ menuCode: 'IMPACT_STORY', displayName: '임팩트', displayOrder: 1 }],
  },
])
assert.equal(mobileMenuDesignOverlay?.groups[0]?.label, 'JA Korea')
assert.deepEqual(
  mobileMenuDesignOverlay?.groups[0]?.children.map(item => item.menuCode),
  ['JA_ORGANIZATION', 'JA_HISTORY', 'JA_NOTICE'],
)
assert.equal(mobileMenuDesignOverlay?.groups[1]?.label, '임팩트 스토리')

const empty = mapPublicGnb([])
assert.ok(empty)
assert.equal(empty.source, 'remote')
assert.equal(empty.groups.length, 0)

assert.equal(mapPublicGnb({ success: true, data: { groups: [] } }), null)
assert.deepEqual(platformQueryKeys.site.gnb(), ['platform', 'site', 'gnb'])

console.log('map-public-gnb.selfcheck ok')
