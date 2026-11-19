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
console.log('build-directory-rows.selfcheck: ok')
