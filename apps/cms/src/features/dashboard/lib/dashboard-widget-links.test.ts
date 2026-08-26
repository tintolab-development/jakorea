import { describe, expect, it } from 'vitest'
import {
  inquiryListPath,
  kpiEducationRecordsPath,
  programScheduleEventPath,
  programScheduleMorePath,
  RECRUITMENT_STATUS_MORE_PATH,
  recruitmentProgramDetailPath,
} from './dashboard-widget-links'

describe('dashboard-widget-links', () => {
  it('일정 더보기는 유형별 캘린더(또는 Gemini 목록)로 이동한다', () => {
    expect(programScheduleMorePath('general')).toBe('/programs/general?viewMode=calendar')
    expect(programScheduleMorePath('company_school')).toBe(
      '/programs/company-school?viewMode=calendar'
    )
    expect(programScheduleMorePath('ujat')).toBe('/programs/ujat?viewMode=calendar')
    expect(programScheduleMorePath('gemini')).toBe('/programs/gemini/visiting-training')
  })

  it('모집 더보기는 진행 중 리스트뷰다', () => {
    expect(RECRUITMENT_STATUS_MORE_PATH).toBe(
      '/programs/general?status=in_progress&viewMode=list'
    )
    expect(recruitmentProgramDetailPath('12')).toBe('/programs/general?programId=12')
  })

  it('KPI 더보기는 대표 프로그램명으로 실적 관리를 필터한다', () => {
    expect(kpiEducationRecordsPath()).toBe('/education-records')
    expect(kpiEducationRecordsPath('지역 경제교육')).toBe(
      `/education-records?er_main=${encodeURIComponent('지역 경제교육')}`
    )
  })

  it('문의 행은 programId를 우선해 inq_prog를 붙인다', () => {
    expect(inquiryListPath('101', '봉사시간')).toBe('/admin/posts/inquiries?inq_prog=101')
    expect(inquiryListPath(undefined, '봉사시간')).toBe(
      `/admin/posts/inquiries?inq_prog=${encodeURIComponent('봉사시간')}`
    )
  })

  it('일정 이벤트는 유형별 프로그램 상세 쿼리다', () => {
    expect(programScheduleEventPath('gemini', '9')).toBe(
      '/programs/gemini/visiting-training?programId=9'
    )
  })
})
