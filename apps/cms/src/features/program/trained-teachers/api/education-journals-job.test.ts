import { describe, expect, it } from 'vitest'
import {
  educationJournalZipJobStatusLabel,
  isEducationJournalZipJobCompleted,
  isEducationJournalZipJobFailed,
  isEducationJournalZipJobPending,
} from './education-journals-job'

describe('education journal ZIP job status', () => {
  it('polls pending states and stops on terminal states', () => {
    expect(isEducationJournalZipJobPending({ jobStatus: 'REQUESTED' })).toBe(true)
    expect(isEducationJournalZipJobPending({ jobStatus: 'PROCESSING' })).toBe(true)
    expect(isEducationJournalZipJobPending({ jobStatus: 'COMPLETED' })).toBe(false)
    expect(isEducationJournalZipJobCompleted({ jobStatus: 'COMPLETED' })).toBe(true)
    expect(isEducationJournalZipJobCompleted({ jobStatus: 'SUCCEEDED' })).toBe(true)
  })

  it('recognizes failures and exposes stable labels', () => {
    expect(isEducationJournalZipJobFailed({ jobStatus: 'FAILED' })).toBe(true)
    expect(isEducationJournalZipJobFailed({ jobStatus: 'CANCELLED' })).toBe(true)
    expect(educationJournalZipJobStatusLabel({ jobStatus: 'REQUESTED' })).toBe('생성 중')
    expect(educationJournalZipJobStatusLabel({ jobStatus: 'COMPLETED' })).toBe('완료')
    expect(educationJournalZipJobStatusLabel({ jobStatus: 'FAILED' })).toBe('실패')
  })
})
