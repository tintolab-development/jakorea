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
    expect(programScheduleMorePath('trained_teacher')).toBe(
      '/programs/trained-teachers?viewMode=calendar'
    )
  })

  it('모집 더보기는 일반 프로그램 리스트뷰다', () => {
    expect(RECRUITMENT_STATUS_MORE_PATH).toBe('/programs/general?viewMode=list')
    expect(recruitmentProgramDetailPath('12')).toBe('/programs/general?programId=12')
    expect(recruitmentProgramDetailPath('12', 'ujat')).toBe('/programs/ujat?programId=12')
    expect(recruitmentProgramDetailPath('12', 'company_school')).toBe(
      '/programs/company-school?programId=12'
    )
    expect(recruitmentProgramDetailPath('12', 'gemini')).toBe(
      '/programs/gemini/visiting-training?programId=12'
    )
    expect(recruitmentProgramDetailPath('12', 'TRAINED_TEACHER')).toBe(
      '/programs/trained-teachers?programId=12'
    )
  })

  it('KPI 더보기는 대표 프로그램명으로 실적 관리를 필터한다', () => {
    expect(kpiEducationRecordsPath()).toBe('/education-records')
    expect(kpiEducationRecordsPath('지역 경제교육')).toBe(
      `/education-records?er_main=${encodeURIComponent('지역 경제교육')}`
    )
  })

  it('문의 행은 필터 칸에 프로그램명, 조회는 프로그램 ID(inq_pid)로 넘긴다', () => {
    const withId = new URL(inquiryListPath('101', '봉사시간'), 'http://x')
    expect(withId.pathname).toBe('/admin/posts/inquiries')
    expect(withId.searchParams.get('inq_prog')).toBe('봉사시간')
    expect(withId.searchParams.get('inq_pid')).toBe('101')

    const nameOnly = new URL(inquiryListPath(undefined, '봉사시간'), 'http://x')
    expect(nameOnly.searchParams.get('inq_prog')).toBe('봉사시간')
    expect(nameOnly.searchParams.has('inq_pid')).toBe(false)

    expect(inquiryListPath()).toBe('/admin/posts/inquiries')
  })

  it('일정 이벤트는 유형별 프로그램 상세 쿼리다', () => {
    expect(programScheduleEventPath('gemini', '9')).toBe(
      '/programs/gemini/visiting-training?programId=9'
    )
    expect(programScheduleEventPath('trained_teacher', '9')).toBe(
      '/programs/trained-teachers?programId=9'
    )
  })
})
