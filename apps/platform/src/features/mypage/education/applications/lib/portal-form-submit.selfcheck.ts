import assert from 'node:assert/strict'
import { buildPortalBoundFormSubmitBody } from './portal-form-submit.ts'

const body = buildPortalBoundFormSubmitBody({
  programId: 186363,
  bindingId: 189289,
  templateVersionId: 70,
  answers: { question: 'v1 answer' },
})

assert.deepEqual(body, {
  templateVersionId: 70,
  programId: 186363,
  programFormBindingId: 189289,
  answers: { question: 'v1 answer' },
})

const contextualBody = buildPortalBoundFormSubmitBody({
  programId: 186363,
  bindingId: 189289,
  templateVersionId: 70,
  contextType: 'PROGRAM_SCHEDULE',
  contextId: 991,
  answers: {},
  fileObjectIdsByQuestion: { attachment: [123] },
})

assert.equal(contextualBody.contextType, 'PROGRAM_SCHEDULE')
assert.equal(contextualBody.contextId, 991)

const participantBody = buildPortalBoundFormSubmitBody({
  programId: 186495,
  bindingId: 1,
  templateVersionId: 70,
  answers: {},
  contextType: 'PARTICIPANT',
  contextId: 190001,
})
assert.equal(participantBody.contextType, 'PARTICIPANT')
assert.equal(participantBody.contextId, 190001)
assert.equal(participantBody.programFormBindingId, 1)
assert.deepEqual(contextualBody.fileObjectIdsByQuestion, { attachment: [123] })

console.log('portal-form-submit.selfcheck: ok')
