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

// 하위 메뉴명은 Admin 입력값 그대로 — 시안 표기(진로·취업 등)로 덮어쓰지 않는다.
const adminLabelOverlay = mapPublicGnb([
  {
    groupCode: 'EDUCATION',
    groupName: '교육 소개',
    menus: [
      { menuCode: 'EDU_CAREER', displayName: '진로취업' },
      { menuCode: 'EDU_ECONOMY', displayName: '경제금융' },
      { menuCode: 'EDU_ENTREPRENEURSHIP', displayName: '기업가 정신' },
      { menuCode: 'EDU_DIGITAL_LITERACY', displayName: '디지털리터러시' },
      { menuCode: 'EDU_MATERIAL', displayName: '교재 소개' },
    ],
  },
])
assert.deepEqual(
  adminLabelOverlay?.groups[0]?.children.map(item => item.label),
  ['진로취업', '경제금융', '기업가 정신', '디지털리터러시', '교재 소개'],
)
assert.equal(
  overlaid.groups[0]?.children.some(item => item.menuCode === 'NOT_A_MENU'),
  false,
)

const directionsLabelOverlay = mapPublicGnb([
  {
    groupCode: 'JA_KOREA',
    groupName: 'JA Korea',
    menus: [{ menuCode: 'JA_DIRECTIONS', displayName: '오시는길', displayOrder: 1 }],
  },
])
assert.equal(
  directionsLabelOverlay?.groups[0]?.children.find(item => item.menuCode === 'JA_DIRECTIONS')
    ?.label,
  '오시는길',
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
  ['JA_ORGANIZATION', 'JA_NOTICE', 'JA_HISTORY'],
)

// Admin GNB 관리에서 바꾼 순서·노출 메뉴를 그대로 따른다(시안 고정 순서로 재정렬·숨김 금지).
const adminOrderOverlay = mapPublicGnb([
  {
    groupCode: 'JA_KOREA',
    groupName: 'JA Korea',
    menus: [
      { menuCode: 'JA_TRANSPARENCY', displayName: '투명경영', displayOrder: 7 },
      { menuCode: 'JA_HISTORY', displayName: 'JA History', displayOrder: 1 },
      { menuCode: 'JA_RECRUIT', displayName: '채용', displayOrder: 6 },
      { menuCode: 'JA_ORGANIZATION', displayName: '기관소개', displayOrder: 2 },
      { menuCode: 'JA_NOTICE', displayName: '공지사항', displayOrder: 3 },
      { menuCode: 'JA_DIRECTIONS', displayName: '오시는 길', displayOrder: 4 },
      { menuCode: 'JA_PEOPLE', displayName: '함께하는 사람들', displayOrder: 5 },
    ],
  },
  {
    groupCode: 'PARTICIPATION',
    groupName: '참여하기',
    menus: [
      { menuCode: 'PARTICIPATION_ALUMNI', displayName: 'Alumni', displayOrder: 1 },
      { menuCode: 'PARTICIPATION_RESULT', displayName: '결과 확인', displayOrder: 2 },
      { menuCode: 'PARTICIPATION_APPLY', displayName: '프로그램 신청', displayOrder: 3 },
    ],
  },
])
assert.deepEqual(
  adminOrderOverlay?.groups[0]?.children.map(item => item.menuCode),
  [
    'JA_HISTORY',
    'JA_ORGANIZATION',
    'JA_NOTICE',
    'JA_DIRECTIONS',
    'JA_PEOPLE',
    'JA_RECRUIT',
    'JA_TRANSPARENCY',
  ],
)
assert.deepEqual(
  adminOrderOverlay?.groups[1]?.children.map(item => item.menuCode),
  ['PARTICIPATION_ALUMNI', 'PARTICIPATION_RESULT', 'PARTICIPATION_APPLY'],
)
assert.equal(mobileMenuDesignOverlay?.groups[1]?.label, '임팩트')
const impactGroup = mobileMenuDesignOverlay?.groups.find(g => g.groupCode === 'IMPACT_STORY')
assert.equal(impactGroup?.children[0]?.label, '임팩트')

const empty = mapPublicGnb([])
assert.ok(empty)
assert.equal(empty.source, 'remote')
assert.equal(empty.groups.length, 0)

assert.equal(mapPublicGnb({ success: true, data: { groups: [] } }), null)
assert.deepEqual(platformQueryKeys.site.gnb(), ['platform', 'site', 'gnb'])

console.log('map-public-gnb.selfcheck ok')
