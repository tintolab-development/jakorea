import { describe, expect, it } from 'vitest'
import {
  applicationBulkSubjectLabel,
  buildApplicationProcessedSelectionAlert,
  buildInterview2ProcessedSelectionAlert,
} from './application-processed-selection-alert'

describe('application-processed-selection-alert', () => {
  it.each([
    ['institution', '기관', '이'],
    ['instructor', '강사', '가'],
    ['participant', '참여자', '가'],
    ['volunteer', '봉사자', '가'],
  ] as const)('application alert for %s uses noun %s with particle %s', (noun, label, particle) => {
    expect(applicationBulkSubjectLabel(noun)).toBe(label)
    expect(buildApplicationProcessedSelectionAlert(noun)).toEqual({
      title: '신청 처리 완료 안내',
      content: `이미 승인 또는 반려 완료된 ${label}${particle} 포함되어 있습니다.\n승인 대기 중인 ${label}만 선택해 주세요.`,
    })
  })

  it.each([
    ['volunteer', '봉사자', '가'],
    ['participant', '참여자', '가'],
  ] as const)('interview2 alert for %s uses noun %s and waiting-only copy', (kind, label, particle) => {
    expect(buildInterview2ProcessedSelectionAlert(kind)).toEqual({
      title: '면접 처리 완료 안내',
      content: `이미 합격 또는 불합격 처리된 ${label}${particle} 포함되어 있습니다.\n면접 대기 중인 ${label}만 선택해 주세요.`,
    })
  })
})
