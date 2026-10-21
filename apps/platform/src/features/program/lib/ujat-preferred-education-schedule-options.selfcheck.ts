import assert from 'node:assert/strict'
import { readUjatPreferredEducationScheduleOptions } from './ujat-preferred-education-schedule-options.ts'

function testRuntimeOptionsUseIdAndLabel() {
  const options = readUjatPreferredEducationScheduleOptions({
    runtimeContext: {
      ujatPreferredEducationDateOptions: [
        { id: 'h2:2029-04-12', date: '2029-04-12', label: '29년 4월 12일(금)' },
        { id: 'h1:2029-04-05', date: '2029-04-05', label: '29년 4월 5일(금)' },
      ],
    },
  })
  assert.deepEqual(options, [
    { id: 'h1:2029-04-05', date: '2029-04-05', display: '29년 4월 5일(금)' },
    { id: 'h2:2029-04-12', date: '2029-04-12', display: '29년 4월 12일(금)' },
  ])
}

function testEmptyArrayDoesNotInventFridays() {
  const options = readUjatPreferredEducationScheduleOptions({
    runtimeContext: {
      ujatPreferredEducationDateOptions: [],
      educationScheduleLines: ['상반기: 2029.04.03 ~ 2029.06.19'],
    },
  })
  assert.deepEqual(options, [])
}

function testMissingFieldIsEmpty() {
  const options = readUjatPreferredEducationScheduleOptions({
    runtimeContext: { educationScheduleLines: ['상반기: 2029.04.03 ~ 2029.06.19'] },
  })
  assert.deepEqual(options, [])
}

testRuntimeOptionsUseIdAndLabel()
testEmptyArrayDoesNotInventFridays()
testMissingFieldIsEmpty()
console.log('ujat-preferred-education-schedule-options: ok')
