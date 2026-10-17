import assert from 'node:assert/strict'
import type { ProgramListItem } from '../model/types'
import {
  filterProgramsByEducationTargetParams,
  programMatchesEducationTargetFilter,
} from './education-target-filter.ts'

function row(keys: string[]): ProgramListItem {
  return {
    id: '1',
    category: 'youth',
    categories: ['youth'],
    categoryLabel: '청소년 · 청년',
    title: 't',
    operatingPeriodLabel: '',
    operatingPeriodStart: '1970-01-01',
    operatingPeriodEnd: '1970-01-01',
    applicationStartDate: null,
    applicationEndDate: null,
    recruitmentPeriodLabel: '',
    recruitmentStatus: 'recruiting',
    educationTargetKey: keys[0] as ProgramListItem['educationTargetKey'],
    educationTargetKeys: keys as ProgramListItem['educationTargetKeys'],
    educationTargetLabel: '',
    educationForm: 'offline',
    educationFormLabel: '',
  }
}

const elementaryAndAdult = row(['elementary', 'adult'])

assert.equal(programMatchesEducationTargetFilter(elementaryAndAdult, 'adult'), true)
assert.equal(programMatchesEducationTargetFilter(elementaryAndAdult, 'elementary'), true)
assert.equal(programMatchesEducationTargetFilter(elementaryAndAdult, 'high'), false)

const filtered = filterProgramsByEducationTargetParams([elementaryAndAdult], {
  recruitmentTarget: 'adult',
  educationTarget: 'all',
})
assert.equal(filtered.length, 1)

console.log('education-target-filter.selfcheck: ok')
