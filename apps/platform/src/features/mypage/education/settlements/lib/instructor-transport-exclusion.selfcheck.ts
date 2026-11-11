import assert from 'node:assert/strict'
import {
  TRANSPORTATION_EXCLUDED_RESUBMIT_GUIDE,
  instructorTransportExclusionNotice,
  readInstructorTransportExclusion,
} from './instructor-transport-exclusion.ts'

// 제외되지 않았으면 안내 없음
assert.equal(readInstructorTransportExclusion({ transportationExcludedReason: null }), null)
assert.equal(readInstructorTransportExclusion(null), null)
assert.equal(instructorTransportExclusionNotice(null), null)

const origin = readInstructorTransportExclusion({
  transportationExcludedReason: 'ADDRESS_UNRESOLVED',
  transportationUnresolvedAddressSide: 'ORIGIN',
})
assert.deepEqual(origin, { reason: 'ADDRESS_UNRESOLVED', addressSide: 'ORIGIN' })
assert.deepEqual(instructorTransportExclusionNotice(origin), [
  '회원정보의 자택 주소를 지도에서 찾을 수 없어 교통비가 제외되었어요. 주소를 확인해 주세요.',
  TRANSPORTATION_EXCLUDED_RESUBMIT_GUIDE,
])

assert.equal(
  instructorTransportExclusionNotice({ reason: 'ADDRESS_UNRESOLVED', addressSide: 'DESTINATION' })?.[0],
  '교육 장소 주소를 지도에서 찾을 수 없어 교통비가 제외되었어요. 담당자에게 문의해 주세요.',
)
assert.equal(
  instructorTransportExclusionNotice({ reason: 'ADDRESS_UNRESOLVED', addressSide: 'ROUTE' })?.[0],
  '이동 경로를 찾을 수 없어 교통비가 제외되었어요.',
)
// UNKNOWN·null은 일반 문구 + 재신청 안내
const unknown = instructorTransportExclusionNotice({ reason: 'ADDRESS_UNRESOLVED', addressSide: 'UNKNOWN' })
assert.equal(unknown?.length, 2)
assert.equal(
  unknown?.[0],
  '교통비 계산에 필요한 주소를 지도에서 찾을 수 없어 교통비가 제외되었어요.',
)
assert.equal(unknown?.[1], '제출 후 교통비를 보완하려면 담당자에게 문의해 주세요.')

// 모르는 사유는 안내하지 않는다
assert.equal(instructorTransportExclusionNotice({ reason: 'SOMETHING_ELSE', addressSide: null }), null)

console.log('instructor-transport-exclusion.selfcheck: ok')
