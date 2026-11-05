import assert from 'node:assert/strict'
import {
  INSTRUCTOR_TRANSPORT_MIN_ONE_WAY_KM,
  formatInstructorOneWayDistanceKm,
  formatInstructorTransportWon,
  isInstructorTransportBelowMinimum,
  isInstructorTransportSectionVisible,
  parseInstructorTransportPreview,
} from './instructor-transport-preview.ts'

assert.equal(INSTRUCTOR_TRANSPORT_MIN_ONE_WAY_KM, 30)
assert.equal(formatInstructorOneWayDistanceKm(30), '30km(편도)')
assert.equal(formatInstructorOneWayDistanceKm(null), '-')
assert.equal(formatInstructorTransportWon(999_999_999), '999,999,999원')
assert.equal(formatInstructorTransportWon(null), '-')

assert.equal(isInstructorTransportBelowMinimum({ oneWayDistanceKm: 29.9, fuelCostWon: null, tollFeeWon: null, totalTransportFeeWon: null }), true)
assert.equal(isInstructorTransportBelowMinimum({ oneWayDistanceKm: 30, fuelCostWon: null, tollFeeWon: null, totalTransportFeeWon: null }), false)
assert.equal(isInstructorTransportSectionVisible({ oneWayDistanceKm: 10, fuelCostWon: null, tollFeeWon: null, totalTransportFeeWon: null }), false)
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
    totalTransportFeeWon: 15000,
  },
)
assert.equal(parseInstructorTransportPreview({ lectureFeeType: 'GRADE_1' }), null)

console.log('instructor-transport-preview.selfcheck: ok')
