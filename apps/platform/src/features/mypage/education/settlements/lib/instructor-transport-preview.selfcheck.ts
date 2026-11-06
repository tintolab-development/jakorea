import assert from 'node:assert/strict'
import {
  INSTRUCTOR_TRANSPORT_MIN_ONE_WAY_KM,
  formatInstructorCalculatedTransportAmount,
  formatInstructorOneWayDistanceKm,
  formatInstructorTransportWon,
  isInstructorTransportBelowMinimum,
  isInstructorTransportSectionVisible,
  parseInstructorTransportPreview,
} from './instructor-transport-preview.ts'

assert.equal(INSTRUCTOR_TRANSPORT_MIN_ONE_WAY_KM, 30)
assert.equal(formatInstructorOneWayDistanceKm(30), '30km(편도)')
assert.equal(formatInstructorOneWayDistanceKm(528.6), '528.6km(편도)')
assert.equal(formatInstructorOneWayDistanceKm(null), '-')
assert.equal(formatInstructorTransportWon(999_999_999), '999,999,999원')
assert.equal(formatInstructorTransportWon(null), '-')
assert.equal(formatInstructorTransportWon(185010.5), '-')

const emptyAmounts = {
  oneWayDistanceKm: 29.9,
  fuelCostWon: null,
  tollFeeWon: null,
  calculatedTransportAmount: null,
  totalTransportFeeWon: null,
}
assert.equal(isInstructorTransportBelowMinimum(emptyAmounts), true)
assert.equal(
  isInstructorTransportBelowMinimum({ ...emptyAmounts, oneWayDistanceKm: 30 }),
  false,
)
assert.equal(
  isInstructorTransportSectionVisible({ ...emptyAmounts, oneWayDistanceKm: 10 }),
  false,
)
assert.equal(isInstructorTransportSectionVisible({ ...emptyAmounts, oneWayDistanceKm: 30 }), true)
assert.equal(isInstructorTransportSectionVisible(null), true)

assert.deepEqual(
  parseInstructorTransportPreview({
    distanceFromHome: 30,
    transportPreview: {
      fuelCostWon: 12000,
      tollFeeWon: 3000,
      calculatedTransportAmount: 15000,
    },
  }),
  {
    oneWayDistanceKm: 30,
    fuelCostWon: 12000,
    tollFeeWon: 3000,
    calculatedTransportAmount: 15000,
    totalTransportFeeWon: 15000,
  },
)

const qa528 = parseInstructorTransportPreview({
  assignmentId: 123,
  startAt: '2026-11-05T09:00:00+09:00',
  distanceFromHome: 528.6,
  transportPreview: {
    oneWayDistanceKm: 528.6,
    fuelCostWon: 185010,
    tollFeeWon: 24800,
    calculatedTransportAmount: 209810,
  },
})
assert.equal(qa528?.oneWayDistanceKm, 528.6)
assert.equal(qa528?.fuelCostWon, 185010)
assert.equal(qa528?.tollFeeWon, 24800)
assert.equal(qa528?.calculatedTransportAmount, 209810)
assert.equal(formatInstructorOneWayDistanceKm(qa528?.oneWayDistanceKm), '528.6km(편도)')
assert.equal(formatInstructorTransportWon(qa528?.fuelCostWon), '185,010원')
assert.equal(formatInstructorTransportWon(qa528?.tollFeeWon), '24,800원')
assert.equal(formatInstructorCalculatedTransportAmount(qa528), '209,810원')
assert.notEqual(
  formatInstructorTransportWon((qa528?.fuelCostWon ?? 0) + (qa528?.tollFeeWon ?? 0) + 1),
  formatInstructorCalculatedTransportAmount(qa528),
)

const unpaid299 = parseInstructorTransportPreview({
  distanceFromHome: 29.9,
  transportPreview: {
    oneWayDistanceKm: 29.9,
    fuelCostWon: null,
    tollFeeWon: null,
    calculatedTransportAmount: null,
  },
})
assert.equal(isInstructorTransportSectionVisible(unpaid299), false)

const stringAmounts = parseInstructorTransportPreview({
  transportPreview: {
    oneWayDistanceKm: 528.6,
    fuelCostWon: '185010',
    tollFeeWon: '24800',
    calculatedTransportAmount: '209810',
  },
})
assert.equal(stringAmounts?.fuelCostWon, null)
assert.equal(stringAmounts?.tollFeeWon, null)
assert.equal(stringAmounts?.calculatedTransportAmount, null)
assert.equal(formatInstructorCalculatedTransportAmount(stringAmounts), '-')

assert.equal(parseInstructorTransportPreview({ lectureFeeType: 'GRADE_1' }), null)

console.log('instructor-transport-preview.selfcheck: ok')
