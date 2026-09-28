import assert from 'node:assert/strict'
import { PEOPLE_HERO_TITLE } from '../lib/constants.ts'
import { hasPeopleContent, mapPublicPeople } from './mappers.ts'

const mapped = mapPublicPeople({
  organizationChart: {
    title: '  청소년들의 미래를 위해 JA Korea와 함께하는 사람들  ',
    imageUrl: ' https://cdn.example/org.svg ',
  },
  boardMembers: [
    {
      id: 2,
      role: 'BOARD_CHAIR_PRESIDENT',
      roleLabel: '무시',
      koreanName: '이은형',
      englishName: 'Eunhyung Lee',
      positionTitle: '회장',
      affiliationTitle: '국민대 경영학부 교수',
      displayOrder: 2,
    },
    {
      id: 1,
      role: 'BOARD_CHAIR_PRESIDENT',
      koreanName: '신철식',
      englishName: 'Mr. Cheulsik Shin',
      positionTitle: '이사장',
      affiliationTitle: '우호문화재단 이사장',
      displayOrder: 1,
    },
    {
      id: 9,
      role: 'UNKNOWN_ROLE',
      koreanName: '제외',
      displayOrder: 1,
    },
    {
      id: 5,
      role: 'FIDUCIARY_BOARD_MEMBER',
      koreanName: '팽경인',
      englishName: 'Mr. Cheulsik Shin',
      positionTitle: '이사',
      affiliationTitle: '서부 T&D 사외이사',
      displayOrder: 3,
    },
    {
      role: 'BOARD_CHAIR',
      koreanName: ' ',
      englishName: ' ',
      positionTitle: ' ',
      affiliationTitle: ' ',
      displayOrder: 1,
    },
  ],
})

assert.equal(mapped.title, '청소년들의 미래를 위해 JA Korea와 함께하는 사람들')
assert.equal(mapped.imageUrl, 'https://cdn.example/org.svg')
assert.equal(mapped.sections.length, 2)
assert.equal(mapped.sections[0]?.id, 'board-chair-president')
assert.equal(mapped.sections[0]?.title, 'Board Chair & President')
assert.equal(mapped.sections[0]?.columns, 2)
assert.deepEqual(
  mapped.sections[0]?.members.map(member => member.name),
  ['신철식', '이은형'],
)
assert.equal(mapped.sections[0]?.members[0]?.id, '1')
assert.equal(mapped.sections[0]?.members[0]?.role, '이사장')
assert.equal(mapped.sections[0]?.members[0]?.englishName, 'Mr. Cheulsik Shin')
assert.equal(mapped.sections[1]?.id, 'fiduciary-board')
assert.equal(mapped.sections[1]?.columns, 3)
assert.equal(mapped.sections[1]?.members[0]?.englishName, 'Mr. Cheulsik Shin')
assert.equal(hasPeopleContent(mapped), true)

const emptyTitle = mapPublicPeople({
  organizationChart: { title: '   ', imageUrl: '' },
  boardMembers: [],
})
assert.equal(emptyTitle.title, PEOPLE_HERO_TITLE)
assert.equal(emptyTitle.imageUrl, '')
assert.equal(emptyTitle.sections.length, 0)
assert.equal(hasPeopleContent(emptyTitle), false)
assert.equal(hasPeopleContent(mapPublicPeople({})), false)

console.log('people mapPublicPeople selfcheck: ok')
