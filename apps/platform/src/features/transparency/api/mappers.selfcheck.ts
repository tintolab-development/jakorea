/**
 * 공개 투명경영 원칙 — displayOrder 순 노출, 아이콘은 id/iconCode 고정.
 */
import assert from 'node:assert/strict'
import { mapPublicTransparency } from './mappers.ts'

const mapped = mapPublicTransparency({
  introSubText: '투명한 운영으로 신뢰를 이어갑니다.',
  introMainText: 'JA Korea는 NGO로서 신뢰를 바탕으로 운영합니다.',
  principles: [
    {
      id: 5,
      itemCode: 'PRINCIPLE_5',
      iconCode: 'TRANSPARENCY_PRINCIPLE_5',
      title: '파트너십',
      subText: '다섯 번째',
      displayOrder: 1,
    },
    {
      id: 1,
      itemCode: 'PRINCIPLE_1',
      iconCode: 'TRANSPARENCY_PRINCIPLE_1',
      title: '회계 투명성',
      subText: '첫 번째',
      displayOrder: 5,
    },
    {
      id: 3,
      itemCode: 'PRINCIPLE_3',
      iconCode: 'TRANSPARENCY_PRINCIPLE_3',
      title: '개인정보 보호',
      subText: '세 번째',
      displayOrder: 2,
    },
  ],
})

assert.deepEqual(
  mapped.principles.map(row => ({ id: row.id, icon: row.icon, title: row.title })),
  [
    { id: '5', icon: 'partnership', title: '파트너십' },
    { id: '3', icon: 'privacy', title: '개인정보 보호' },
    { id: '1', icon: 'audit', title: '회계 투명성' },
  ],
)

assert.equal(mapped.heroLabel, '투명한 운영으로 신뢰를 이어갑니다.')
assert.equal(mapped.heroTitle, 'JA Korea는 NGO로서 신뢰를 바탕으로 운영합니다.')

const missingOrder = mapPublicTransparency({
  principles: [
    { id: 2, iconCode: 'TRANSPARENCY_PRINCIPLE_2', title: '거버넌스', subText: 'A' },
    { id: 4, iconCode: 'TRANSPARENCY_PRINCIPLE_4', title: '자산', subText: 'B' },
  ],
})
assert.deepEqual(
  missingOrder.principles.map(row => row.icon),
  ['governance', 'asset'],
)

const emptyCopy = mapPublicTransparency({
  principles: [
    {
      id: 4,
      itemCode: 'PRINCIPLE_4',
      iconCode: 'TRANSPARENCY_PRINCIPLE_4',
      title: '',
      subText: '',
      displayOrder: 1,
    },
    {
      id: 2,
      itemCode: 'PRINCIPLE_2',
      iconCode: 'TRANSPARENCY_PRINCIPLE_2',
      title: '거버넌스',
      subText: 'A',
      displayOrder: 2,
    },
  ],
})
assert.equal(emptyCopy.principles.length, 2)
assert.deepEqual(emptyCopy.principles[0], {
  id: '4',
  icon: 'asset',
  title: '',
  description: [],
})

console.log('transparency mappers.selfcheck ok')
