import { describe, expect, it } from 'vitest'
import {
  resolveGeneralVolunteerDocScreeningDetailMeta,
  SCREENING_VOLUNTEER_APPLICATION_DETAIL_BREADCRUMB,
  screeningDoc1DetailTitle,
  screeningVolunteerApplicationDetailTitle,
} from './screening-subject-kind'

describe('resolveGeneralVolunteerDocScreeningDetailMeta', () => {
  it('면접 없음이면 봉사자 신청 상세 제목·브레드크럼을 쓴다', () => {
    expect(resolveGeneralVolunteerDocScreeningDetailMeta('김재인', false)).toEqual({
      title: screeningVolunteerApplicationDetailTitle('김재인'),
      breadcrumbLabel: SCREENING_VOLUNTEER_APPLICATION_DETAIL_BREADCRUMB,
    })
    expect(screeningVolunteerApplicationDetailTitle('김재인')).toBe('봉사자 신청 상세 (김재인)')
    expect(SCREENING_VOLUNTEER_APPLICATION_DETAIL_BREADCRUMB).toBe('봉사자 신청 상세')
  })

  it('면접 있음이면 1차 서류 심사 대상자 상세 제목과 이름 브레드크럼을 유지한다', () => {
    expect(resolveGeneralVolunteerDocScreeningDetailMeta('최지원', true)).toEqual({
      title: screeningDoc1DetailTitle('volunteer', '최지원'),
      breadcrumbLabel: '최지원',
    })
    expect(screeningDoc1DetailTitle('volunteer', '최지원')).toBe(
      '봉사자 1차 서류 심사 대상자 상세 (최지원)'
    )
  })
})
