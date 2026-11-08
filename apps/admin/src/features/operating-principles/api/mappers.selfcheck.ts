/**
 * 운영원칙 PUT — 배열 순서가 displayOrder 1..n
 */
import assert from 'node:assert/strict'
import {
  applyFreshPrincipleLock,
  mapPrincipleManagementToDomain,
  toPrincipleUpdateRequest,
} from './mappers.ts'

const domain = mapPrincipleManagementToDomain({
  introSubText: '서브',
  introMainText: '메인',
  settingVersion: 3,
  items: [
    {
      id: 5,
      iconCode: 'TRANSPARENCY_PRINCIPLE_5',
      enabled: true,
      title: '파트너십',
      subText: '5',
      displayOrder: 1,
      version: 1,
    },
    {
      id: 1,
      iconCode: 'TRANSPARENCY_PRINCIPLE_1',
      enabled: true,
      title: '회계',
      subText: '1',
      displayOrder: 2,
      version: 1,
    },
    {
      id: 2,
      iconCode: 'TRANSPARENCY_PRINCIPLE_2',
      enabled: true,
      title: '거버넌스',
      subText: '2',
      displayOrder: 3,
      version: 1,
    },
    {
      id: 3,
      iconCode: 'TRANSPARENCY_PRINCIPLE_3',
      enabled: false,
      title: '개인정보',
      subText: '3',
      displayOrder: 4,
      version: 1,
    },
    {
      id: 4,
      iconCode: 'TRANSPARENCY_PRINCIPLE_4',
      enabled: true,
      title: '자산',
      subText: '4',
      displayOrder: 5,
      version: 1,
    },
  ],
})

assert.deepEqual(
  domain.principles.map(row => row.id),
  [
    'operating-principle-p5',
    'operating-principle-p1',
    'operating-principle-p2',
    'operating-principle-p3',
    'operating-principle-p4',
  ],
)
assert.equal(domain.principles[0]?.iconKey, 'p5')
assert.equal(domain.principles[1]?.iconKey, 'p1')
assert.equal(domain.principles[3]?.isActive, false)

const payload = toPrincipleUpdateRequest(domain)
assert.deepEqual(
  payload.items.map(item => ({ id: item.id, displayOrder: item.displayOrder })),
  [
    { id: 5, displayOrder: 1 },
    { id: 1, displayOrder: 2 },
    { id: 2, displayOrder: 3 },
    { id: 3, displayOrder: 4 },
    { id: 4, displayOrder: 5 },
  ],
)
assert.equal(
  payload.items.every(item => !('iconCode' in item) && !('itemCode' in item)),
  true,
)
assert.equal(payload.items[3]?.enabled, false)

const locked = applyFreshPrincipleLock(domain, {
  ...domain,
  settingVersion: 9,
  principles: domain.principles.map(row => ({ ...row, version: 7, iconKey: row.iconKey })),
})
assert.equal(locked.settingVersion, 9)
assert.equal(locked.principles[0]?.id, 'operating-principle-p5')
assert.equal(locked.principles[0]?.version, 7)
assert.equal(locked.principles[0]?.iconKey, 'p5')

console.log('operating-principles mappers.selfcheck ok')
