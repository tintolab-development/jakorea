/**
 * 신청폼 답변 키 — questionKey, fieldKey, key, name, id
 */
import assert from 'node:assert/strict'
import { resolveApplicationAnswerKey } from './application-answer-key.ts'

assert.equal(
  resolveApplicationAnswerKey({
    id: 'paragraph-motivation',
    questionKey: 'paragraph-motivation',
    name: 'motivation',
  }),
  'paragraph-motivation',
)
assert.equal(resolveApplicationAnswerKey({ id: 'only-id', name: '' }), 'only-id')
assert.equal(resolveApplicationAnswerKey({ fieldKey: 'field', id: 'ignored' }), 'field')
assert.equal(resolveApplicationAnswerKey({}), '')

console.log('application-answer-key.selfcheck: ok')
