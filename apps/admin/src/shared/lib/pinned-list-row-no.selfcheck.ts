/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/shared/lib/pinned-list-row-no.selfcheck.ts
 */
import assert from 'node:assert/strict'
import { buildPinnedListRowNoMap, sortPinnedRowsFirst } from './pinned-list-row-no.ts'

function row(id: string, isPinned = false) {
  return { id, isPinned }
}

function check(run: () => void) {
  run()
}

// 전체 건수에서 고정 건수를 뺀 번호부터 역순, 고정 행은 번호 없음
check(() => {
  const map = buildPinnedListRowNoMap(
    [row('p1', true), row('p2', true), row('a'), row('b'), row('c')],
    25
  )
  assert.equal(map.get('p1'), undefined)
  assert.deepEqual([map.get('a'), map.get('b'), map.get('c')], [23, 22, 21])
})

// 다음 페이지가 붙어도 이미 보인 행의 번호는 그대로
check(() => {
  const page1 = [row('p1', true), row('a'), row('b')]
  const page2 = [row('c'), row('d')]
  const before = buildPinnedListRowNoMap(page1, 5)
  const after = buildPinnedListRowNoMap([...page1, ...page2], 5)
  assert.deepEqual([before.get('a'), before.get('b')], [4, 3])
  assert.deepEqual([after.get('a'), after.get('b'), after.get('c'), after.get('d')], [4, 3, 2, 1])
})

// 전체 건수가 불러온 행보다 작게 오면 불러온 행 수 기준
check(() => {
  const map = buildPinnedListRowNoMap([row('a'), row('b')], 0)
  assert.deepEqual([map.get('a'), map.get('b')], [2, 1])
})

// 고정 행 사이에 낀 일반 행은 고정 행 뒤로 (각자 순서 유지)
check(() => {
  const rows = [row('p1', true), row('a'), row('p2', true), row('b'), row('p3', true)]
  assert.deepEqual(
    sortPinnedRowsFirst(rows).map(r => r.id),
    ['p1', 'p2', 'p3', 'a', 'b']
  )
})

// 이미 고정 행이 앞에 있으면 원본 배열 그대로 (불필요한 재렌더 방지)
check(() => {
  const rows = [row('p1', true), row('a'), row('b')]
  assert.equal(sortPinnedRowsFirst(rows), rows)
})

console.log('pinned-list-row-no selfcheck: ok')
