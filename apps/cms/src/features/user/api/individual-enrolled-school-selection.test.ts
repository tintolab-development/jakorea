import { describe, expect, it } from 'vitest'
import {
  resolveIndividualEnrolledSchoolSubmitBlock,
  shouldSkipIndividualEnrolledSchoolReselectionGuard,
} from '@/features/user/api/individual-enrolled-school-selection'
import { INDIVIDUAL_ENROLLED_NEIS_SCHOOL_SELECTION_REQUIRED_ALERT_MESSAGE } from '@/shared/constants/messages'

describe('resolveIndividualEnrolledSchoolSubmitBlock', () => {
  it('CAREER_NET + externalSchoolCode면 통과한다', () => {
    expect(
      resolveIndividualEnrolledSchoolSubmitBlock({
        schoolProvider: 'CAREER_NET',
        schoolExternalCode: '1',
      })
    ).toBeNull()
  })

  it('CAREER_NET인데 코드가 없으면 막는다', () => {
    expect(
      resolveIndividualEnrolledSchoolSubmitBlock({
        schoolProvider: 'CAREER_NET',
        schoolExternalCode: undefined,
      })
    ).toBe(INDIVIDUAL_ENROLLED_NEIS_SCHOOL_SELECTION_REQUIRED_ALERT_MESSAGE)
  })

  it('CMS PK가 있으면 통과한다', () => {
    expect(
      resolveIndividualEnrolledSchoolSubmitBlock({
        schoolOrganizationId: 42,
        schoolProvider: undefined,
      })
    ).toBeNull()
  })

  it('NEIS 코드·교육청 코드가 있으면 통과한다', () => {
    expect(
      resolveIndividualEnrolledSchoolSubmitBlock({
        schoolProvider: 'NEIS',
        schoolExternalCode: 'B100000658',
        schoolEducationOfficeCode: 'B10',
      })
    ).toBeNull()
  })

  it('externalSchoolCode만 있고 시/도로 교육청을 유도할 수 있으면 통과한다', () => {
    expect(
      resolveIndividualEnrolledSchoolSubmitBlock({
        schoolProvider: 'NEIS',
        schoolExternalCode: 'B100000658',
        schoolRegionSido: '서울특별시',
      })
    ).toBeNull()
  })

  it('학교명만 있는 재학은 선택 필수 안내를 반환한다', () => {
    expect(
      resolveIndividualEnrolledSchoolSubmitBlock({
        schoolProvider: undefined,
        schoolExternalCode: undefined,
        schoolEducationOfficeCode: undefined,
      })
    ).toBe(INDIVIDUAL_ENROLLED_NEIS_SCHOOL_SELECTION_REQUIRED_ALERT_MESSAGE)
  })

  it('externalSchoolCode만 있고 교육청을 알 수 없으면 막는다', () => {
    expect(
      resolveIndividualEnrolledSchoolSubmitBlock({
        schoolProvider: 'NEIS',
        schoolExternalCode: '999999',
      })
    ).toBe(INDIVIDUAL_ENROLLED_NEIS_SCHOOL_SELECTION_REQUIRED_ALERT_MESSAGE)
  })
})

describe('shouldSkipIndividualEnrolledSchoolReselectionGuard', () => {
  it('기존 소속명을 그대로 두면 재검색 가드를 건너뛴다', () => {
    expect(
      shouldSkipIndividualEnrolledSchoolReselectionGuard({
        draftInstitution: '진월초등학교',
        originalInstitution: '진월초등학교',
      })
    ).toBe(true)
  })

  it('소속명을 바꾸면 재검색 가드를 적용한다', () => {
    expect(
      shouldSkipIndividualEnrolledSchoolReselectionGuard({
        draftInstitution: '다른초등학교',
        originalInstitution: '진월초등학교',
      })
    ).toBe(false)
  })

  it('소속명이 비어 있으면 재검색 가드를 적용한다', () => {
    expect(
      shouldSkipIndividualEnrolledSchoolReselectionGuard({
        draftInstitution: '',
        originalInstitution: '진월초등학교',
      })
    ).toBe(false)
  })

  it('검색 선택이 있으면 가드 스킵 대상이 아니다(resolve로 검증)', () => {
    expect(
      shouldSkipIndividualEnrolledSchoolReselectionGuard({
        draftInstitution: '진월초등학교',
        originalInstitution: '진월초등학교',
        schoolExternalCode: 'B100000001',
        schoolProvider: 'NEIS',
      })
    ).toBe(false)
  })
})
