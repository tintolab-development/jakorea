import assert from 'node:assert/strict'
import { AgeTransitionApiError } from '../api/types.ts'
import {
  isAgeTransitionAuthBoundaryError,
  isAgeTransitionNiceValid,
  isAgeTransitionValidateUnavailable,
  isNiceSessionVerified,
  mapAgeTransitionErrorCodeToAlert,
  mapAgeTransitionNiceStatusToAlert,
  mapAgeTransitionUnknownErrorToAlert,
} from './error-codes.ts'

assert.equal(mapAgeTransitionErrorCodeToAlert('AGE14_TRANSITION_NICE_FAILED'), 'fail')
assert.equal(mapAgeTransitionErrorCodeToAlert('AGE14_TRANSITION_UNDER_AGE'), 'under14')
assert.equal(mapAgeTransitionErrorCodeToAlert('AGE14_TRANSITION_IDENTITY_MISMATCH'), 'mismatch')
assert.equal(mapAgeTransitionErrorCodeToAlert('AGE14_TRANSITION_CI_ALREADY_REGISTERED'), 'duplicate')

assert.equal(mapAgeTransitionErrorCodeToAlert('AGE_UNDER_14'), null)
assert.equal(mapAgeTransitionErrorCodeToAlert('BIRTH_GENDER_MISMATCH'), null)
assert.equal(mapAgeTransitionErrorCodeToAlert('GUARDIAN_CI_MISMATCH'), null)
assert.equal(mapAgeTransitionErrorCodeToAlert('DUPLICATE_CI'), null)
assert.equal(mapAgeTransitionErrorCodeToAlert('SESSION_EXPIRED'), null)
assert.equal(mapAgeTransitionErrorCodeToAlert('NAME_MISMATCH'), null)
assert.equal(mapAgeTransitionErrorCodeToAlert('AGE14_TRANSITION_CHOICE_REQUIRED'), null)
assert.equal(mapAgeTransitionErrorCodeToAlert('AGE14_TRANSITION_NOT_ELIGIBLE'), null)
assert.equal(mapAgeTransitionErrorCodeToAlert('IDEMPOTENCY_KEY_CONFLICT'), null)
assert.equal(mapAgeTransitionErrorCodeToAlert('DATABASE_ERROR'), null)
assert.equal(mapAgeTransitionErrorCodeToAlert('INTERNAL_SERVER_ERROR'), null)
assert.equal(mapAgeTransitionErrorCodeToAlert('GUARDIAN_FILE_DELETION_BLOCKED'), null)
assert.equal(mapAgeTransitionErrorCodeToAlert(undefined), null)

assert.equal(
  mapAgeTransitionNiceStatusToAlert({
    status: 'VERIFIED',
    failureCode: null,
  }),
  null,
)
assert.equal(
  mapAgeTransitionNiceStatusToAlert({
    status: 'FAILED',
    failureCode: null,
  }),
  'fail',
)
assert.equal(
  mapAgeTransitionNiceStatusToAlert({
    status: 'VERIFIED',
    failureCode: 'STILL_UNDER_14',
  }),
  null,
)
assert.equal(
  mapAgeTransitionNiceStatusToAlert({
    status: 'FAILED',
    failureCode: 'AGE14_TRANSITION_UNDER_AGE',
  }),
  'under14',
)
assert.equal(isNiceSessionVerified({ status: 'VERIFIED' }), true)
assert.equal(isNiceSessionVerified({ status: 'FAILED' }), false)

assert.equal(
  isAgeTransitionNiceValid({
    status: 'VALID',
    identityVerified: true,
    transitionCompleted: false,
  }),
  true,
)
assert.equal(
  isAgeTransitionNiceValid({
    status: 'VERIFIED',
    identityVerified: true,
    transitionCompleted: false,
  }),
  false,
)
assert.equal(
  isAgeTransitionNiceValid({
    status: 'VALID',
    identityVerified: false,
    transitionCompleted: false,
  }),
  false,
)
assert.equal(
  isAgeTransitionNiceValid({
    status: 'VALID',
    identityVerified: true,
    transitionCompleted: true,
  }),
  false,
)

assert.equal(
  mapAgeTransitionUnknownErrorToAlert(
    new AgeTransitionApiError('AGE14_TRANSITION_IDENTITY_MISMATCH', 'AGE14_TRANSITION_ERROR', 409),
  ),
  'mismatch',
)
assert.equal(
  mapAgeTransitionUnknownErrorToAlert(
    new AgeTransitionApiError('AGE14_TRANSITION_NICE_FAILED', 'AGE14_TRANSITION_ERROR', 409),
  ),
  'fail',
)
assert.equal(
  mapAgeTransitionUnknownErrorToAlert(
    new AgeTransitionApiError('INTERNAL_SERVER_ERROR', 'AGE14_TRANSITION_ERROR', 500),
  ),
  null,
)
assert.equal(
  mapAgeTransitionUnknownErrorToAlert(
    new AgeTransitionApiError('NOT_FOUND', 'AGE14_TRANSITION_ERROR', 404),
  ),
  null,
)
assert.equal(
  mapAgeTransitionUnknownErrorToAlert(
    new AgeTransitionApiError('UNAUTHORIZED', 'AGE14_TRANSITION_ERROR', 401),
  ),
  null,
)
assert.equal(
  mapAgeTransitionUnknownErrorToAlert(
    new AgeTransitionApiError('FORBIDDEN', 'AGE14_TRANSITION_ERROR', 403),
  ),
  null,
)
assert.equal(isAgeTransitionValidateUnavailable(new AgeTransitionApiError('NOT_FOUND', 'x', 404)), true)
assert.equal(isAgeTransitionAuthBoundaryError(new AgeTransitionApiError('UNAUTHORIZED', 'x', 401)), true)
assert.equal(isAgeTransitionAuthBoundaryError(new AgeTransitionApiError('FORBIDDEN', 'x', 403)), true)
