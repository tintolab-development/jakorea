import { describe, expect, it } from 'vitest'
import {
  getLectureReportProgressAccent,
  getLectureReportSubmissionAccent,
} from './lecture-report-status-presentation'

describe('lecture report status presentation', () => {
  it('강의 진행 여부: 진행 완료 검정, 진행 예정 초록', () => {
    expect(getLectureReportProgressAccent('진행 완료')).toContain('#3d3d3d')
    expect(getLectureReportProgressAccent('진행 예정')).toContain('#1e8c29')
  })

  it('제출 현황: 미제출 빨강, 진행 예정 초록, 제출 완료 검정', () => {
    expect(getLectureReportSubmissionAccent('미제출')).toContain('#c32f4a')
    expect(getLectureReportSubmissionAccent('진행 예정')).toContain('#1e8c29')
    expect(getLectureReportSubmissionAccent('제출 완료')).toContain('#3d3d3d')
  })
})
