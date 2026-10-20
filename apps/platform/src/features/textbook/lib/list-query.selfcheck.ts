import assert from 'node:assert/strict'
import { toPublicTextbookListQuery } from './list-query.ts'

const allLatest = toPublicTextbookListQuery({ category: 'all', sort: 'latest', page: 1 })
assert.equal(allLatest.fieldCode, undefined)
assert.equal(allLatest.sort, 'LATEST')
assert.equal(allLatest.page, 0)
assert.equal(allLatest.size, 10)

const digitalName = toPublicTextbookListQuery({
  category: 'digital',
  sort: 'name',
  page: 2,
})
assert.equal(digitalName.fieldCode, 'DIGITAL_LITERACY')
assert.equal(digitalName.sort, 'NAME')
assert.equal(digitalName.page, 1)
assert.equal(digitalName.size, 10)

const economy = toPublicTextbookListQuery({ category: 'economy', sort: 'latest', page: 1 })
assert.equal(economy.fieldCode, 'ECONOMICS_FINANCE')
assert.equal(economy.sort, 'LATEST')

const career = toPublicTextbookListQuery({ category: 'career', sort: 'name', page: 1 })
assert.equal(career.fieldCode, 'CAREER_EMPLOYMENT')
assert.equal(career.sort, 'NAME')
assert.equal(career.page, 0)
assert.equal(career.size, 10)

const entrepreneurship = toPublicTextbookListQuery({
  category: 'entrepreneurship',
  sort: 'name',
  page: 1,
})
assert.equal(entrepreneurship.fieldCode, 'ENTREPRENEURSHIP')

console.log('textbook list-query.selfcheck: ok')
