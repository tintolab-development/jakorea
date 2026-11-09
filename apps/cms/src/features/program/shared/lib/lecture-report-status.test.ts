import { describe, expect, it } from 'vitest'
import {
  resolveLectureReportProgressLabel,
  resolveLectureReportSubmissionStatus,
} from './lecture-report-status'

describe('lecture report status (server reportStatus · lectureProgressStatus)', () => {
  it.each([
    ['SUBMITTED', '제출 완료', true],
    ['APPROVED', '제출 완료', true],
    ['COMPLETED', '제출 완료', true],
    ['EXCEPTION_ACCEPTED', '예외 승인', false],
    ['NOT_SUBMITTED', '미제출', false],
    ['DRAFT', '미제출', false],
    ['UPCOMING', '진행 예정', false],
    ['GAVE_UP', '활동 포기', false],
  ] as const)('%s → %s', (status, label, hasSubmittedReport) => {
    expect(resolveLectureReportSubmissionStatus(status)).toEqual({ label, hasSubmittedReport })
  })

  it('R01: NOT_SUBMITTED는 SUBMIT 문자열을 포함해도 제출 완료가 아니다', () => {
    expect(resolveLectureReportSubmissionStatus('not_submitted ').label).toBe('미제출')
  })

  it('정의되지 않은 값·빈값은 추정하지 않고 - 로 둔다', () => {
    for (const status of [undefined, null, '', 'RESUBMIT_REQUESTED', 'SCHEDULED', 'DONE']) {
      expect(resolveLectureReportSubmissionStatus(status)).toEqual({
        label: '-',
        hasSubmittedReport: false,
      })
    }
  })

  it('강의 진행 여부는 서버 lectureProgressStatus만 따른다', () => {
    expect(resolveLectureReportProgressLabel('COMPLETED')).toBe('진행 완료')
    expect(resolveLectureReportProgressLabel('upcoming')).toBe('진행 예정')
    expect(resolveLectureReportProgressLabel(undefined)).toBe('-')
    expect(resolveLectureReportProgressLabel('SUBMITTED')).toBe('-')
  })
})
