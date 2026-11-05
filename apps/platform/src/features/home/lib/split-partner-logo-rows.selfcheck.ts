import assert from 'node:assert/strict'
import {
  cellsForTwoColumnSponsorGrid,
  gridCellsFromPartnerRows,
  partnerRowsFromOrderedLogos,
  splitSponsorLogosIntoTwoColumns,
} from './split-partner-logo-rows.ts'

const odd = splitSponsorLogosIntoTwoColumns([1, 2, 3, 4, 5])
assert.deepEqual(odd.column1, [1, 2])
assert.deepEqual(odd.column2, [3, 4, 5])

const even = splitSponsorLogosIntoTwoColumns([1, 2, 3, 4])
assert.deepEqual(even.column1, [1, 2])
assert.deepEqual(even.column2, [3, 4])

assert.deepEqual(splitSponsorLogosIntoTwoColumns([1]).column1, [])
assert.deepEqual(splitSponsorLogosIntoTwoColumns([1]).column2, [1])

assert.deepEqual(partnerRowsFromOrderedLogos([1, 2, 3, 4, 5]), [
  [1, 2],
  [3, 4, 5],
])
assert.deepEqual(partnerRowsFromOrderedLogos([1]), [[1]])
assert.deepEqual(partnerRowsFromOrderedLogos([]), [])

assert.deepEqual(cellsForTwoColumnSponsorGrid([1, 2], [3, 4, 5]), [1, 3, 2, 4, null, 5])
assert.deepEqual(cellsForTwoColumnSponsorGrid([], [1]), [null, 1])
assert.deepEqual(gridCellsFromPartnerRows([[1, 2], [3, 4, 5]]), [1, 3, 2, 4, null, 5])
assert.deepEqual(gridCellsFromPartnerRows([[1]]), [null, 1])

console.log('split-partner-logo-rows.selfcheck: ok')
