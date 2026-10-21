import assert from 'node:assert/strict'
import {
  fillTrainedTeachersBasicInfoFromProfile,
  trainedTeachersProfileDefaults,
} from './profile-defaults.ts'
import type { ApplyTrainedTeachersBasicInfoValues } from './apply-trained-teachers-basic-info.tsx'

function emptyBasicInfo(): ApplyTrainedTeachersBasicInfoValues {
  return {
    schoolName: '',
    regionLabel: '',
    applicationGrade: '',
    addressDetail: '',
    classCount: '',
    studentCount: '',
    educationFormat: '',
    educationPlace: 'inside',
    educationPlaceDetail: '',
    teacherName: '',
    teacherTel: '',
    teacherMobile: '',
    teacherEmail: '',
    applicationReason: '',
    otherRequests: '',
  }
}

const fromOrganization = trainedTeachersProfileDefaults({
  name: '이진희',
  phone: '01057649470',
  email: 'teacher@example.com',
  schoolName: 'JA서울미래초등학교',
  teacherOrganization: {
    organizationName: 'JA서울미래초등학교',
    address: '서울특별시 강남구 테헤란로 1',
    addressDetail: '3층',
    regionSido: '서울특별시',
    regionSigungu: '강남구',
  },
})

assert.equal(fromOrganization.schoolName, 'JA서울미래초등학교')
assert.equal(fromOrganization.regionLabel, '서울특별시 강남구 테헤란로 1')
assert.equal(fromOrganization.addressDetail, '3층')
assert.equal(fromOrganization.teacherName, '이진희')
assert.equal(fromOrganization.teacherMobile, '010-5764-9470')
assert.equal(fromOrganization.teacherEmail, 'teacher@example.com')

const fromMemberAddress = trainedTeachersProfileDefaults({
  regionSido: '경기도',
  regionSigungu: '성남시',
  addressDetail: '101호',
})
assert.equal(fromMemberAddress.regionLabel, '경기도 성남시')
assert.equal(fromMemberAddress.addressDetail, '101호')

const filled = fillTrainedTeachersBasicInfoFromProfile(
  {
    ...emptyBasicInfo(),
    addressDetail: '직접 입력한 상세주소',
  },
  fromOrganization,
)
assert.equal(filled.schoolName, 'JA서울미래초등학교')
assert.equal(filled.regionLabel, '서울특별시 강남구 테헤란로 1')
assert.equal(filled.addressDetail, '직접 입력한 상세주소')
assert.equal(filled.teacherMobile, '010-5764-9470')
