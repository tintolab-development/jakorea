import assert from 'node:assert/strict'
import { selectRenderedHomePopups } from './popup-queue.ts'

const popups = ['a', 'b', 'c', 'd']

// PC: 기존처럼 모두(최대 4개는 호출부에서 자름) 함께
assert.deepEqual(selectRenderedHomePopups(popups, false), ['a', 'b', 'c', 'd'])

// 모바일: 하나씩 — 첫 팝업을 닫으면(visible에서 빠지면) 다음 팝업
assert.deepEqual(selectRenderedHomePopups(popups, true), ['a'])
assert.deepEqual(selectRenderedHomePopups(popups.slice(1), true), ['b'])
assert.deepEqual(selectRenderedHomePopups([], true), [])

console.log('popup-queue selfcheck ok')
