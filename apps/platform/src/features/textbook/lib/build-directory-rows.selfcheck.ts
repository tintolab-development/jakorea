import assert from 'node:assert/strict'
import { buildDirectoryRows } from './build-directory-rows.ts'

assert.deepEqual(buildDirectoryRows([]), [])
const source = [
  { id: '42', title: 'Economic Life', levels: ['elementary', 'middle', 'high'] as const },
  { id: '43', title: 'Career', levels: ['adult'] as const },
]
const rows = buildDirectoryRows(source.map(x => ({ ...x, levels: [...x.levels] })))
assert.equal(rows.length, 4)
assert.deepEqual(rows.map(x => x.id), ['42-elementary', '42-middle', '42-high', '43-adult'])
assert.deepEqual(rows.slice(0, 3).map(x => x.contentId), ['42', '42', '42'])
assert.deepEqual(rows.slice(0, 3).map(x => x.levels), [['elementary'], ['middle'], ['high']])
assert.deepEqual(rows[3]?.levels, ['adult'])

// 교급 순 정렬: 유아 → 초등 → 중 → 고 → 성인 → 안내사항, 같은 교급은 서버 순서 유지
const mixed = buildDirectoryRows([
  { id: '1', title: '2323', levels: ['elementary', 'middle', 'high'] },
  { id: '2', title: '우리들의 경제생활', levels: ['preschool'] },
  { id: '3', title: '경제 탐험대', levels: ['elementary'] },
  { id: '4', title: '교육 콘텐츠 이용 안내', levels: ['notice'] },
  { id: '5', title: '성인을 위한 금융 리터러시', levels: ['adult'] },
  { id: '6', title: '우주여행', levels: ['middle'] },
])
assert.deepEqual(
  mixed.map(x => x.id),
  ['2-preschool', '1-elementary', '3-elementary', '1-middle', '6-middle', '1-high', '5-adult', '4-notice'],
)
console.log('build-directory-rows.selfcheck: ok')
