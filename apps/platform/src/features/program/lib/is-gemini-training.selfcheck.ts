import assert from 'node:assert/strict'
import { isGeminiTrainingProgram, isGeminiTrainingProgramType } from './is-gemini-training.ts'

assert.equal(isGeminiTrainingProgramType('GEMINI_TRAINING'), true)
assert.equal(isGeminiTrainingProgramType('gemini'), true)
assert.equal(isGeminiTrainingProgramType('GENERAL_ORGANIZATION'), false)
assert.equal(isGeminiTrainingProgram({ detailCase: 'gemini' }), true)
assert.equal(isGeminiTrainingProgram({ programType: 'GEMINI_TRAINING', detailCase: 'instructor' }), true)
assert.equal(isGeminiTrainingProgram({ detailCase: 'instructor', programType: 'GENERAL' }), false)

console.log('is-gemini-training.selfcheck: ok')
